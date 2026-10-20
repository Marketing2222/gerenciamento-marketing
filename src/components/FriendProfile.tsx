'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Flame, ListChecks, Trophy, Medal, Activity, Target } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { useGamification } from '@/context/GamificationContext'
import {
  subscribeEvents,
  subscribeProgress,
  subscribeUnlocks,
} from '@/lib/gamification/store'
import { TOTAL_ACHIEVEMENTS } from '@/lib/gamification/achievements'
import {
  buildSeasonSummaries,
  eventInSeason,
  isUnlockInSeason,
  type SeasonInfo,
} from '@/lib/gamification/seasons'
import { levelProgress } from '@/lib/gamification/levels'
import { computeCounters } from '@/lib/gamification/engine'
import {
  FIRST_AVAILABLE_SEASON,
  MONTHS_PT,
  computeSeasonStats,
} from '@/lib/gamification/stats'
import { iconKeys } from '@/lib/gamification/settings'
import type {
  AchievementUnlock,
  ContentCategory,
  Rarity,
  UserProgress,
  XpEvent,
} from '@/lib/gamification/types'

const RARITY_META: Record<Rarity, string> = {
  comum: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
  rara: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30',
  epica: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30',
  lendaria: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40',
}

const RARITY_LABEL: Record<Rarity, string> = {
  comum: 'Comum',
  rara: 'Rara',
  epica: 'Épica',
  lendaria: 'Lendária',
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const PERIODS: { label: string; range: string; hour: number }[] = [
  { label: 'Madrugada', range: '00h–06h', hour: 3 },
  { label: 'Manhã', range: '06h–12h', hour: 9 },
  { label: 'Tarde', range: '12h–18h', hour: 15 },
  { label: 'Noite', range: '18h–24h', hour: 21 },
]

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  video: 'vídeo',
  post: 'post',
  trafego: 'tráfego pago',
  geral: 'geral',
}

const DUE_META: Record<
  XpEvent['dueResult'],
  { label: string; cls: string } | null
> = {
  early: { label: 'Adiantado', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  ontime: { label: 'No prazo', cls: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30' },
  late: { label: 'Atrasado', cls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' },
  none: null,
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

function MiniBars({
  labels,
  counts,
  bestIndex,
  subLabels,
}: {
  labels: string[]
  counts: number[]
  bestIndex: number
  subLabels?: string[]
}) {
  const max = Math.max(1, ...counts)
  return (
    <div className="flex items-end gap-1 h-14">
      {labels.map((label, idx) => {
        const isBest = idx === bestIndex && counts[idx] > 0
        const pct = Math.round((counts[idx] / max) * 100)
        return (
          <div key={label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400">
              {counts[idx] || ''}
            </span>
            <div className="w-full flex-1 flex items-end">
              <div
                className={`w-full rounded-t ${
                  isBest
                    ? 'bg-gradient-to-t from-amber-500 to-orange-400'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
                style={{ height: `${counts[idx] ? Math.max(pct, 14) : 6}%` }}
              />
            </div>
            <span
              className={`text-[9px] font-bold truncate ${
                isBest ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
              }`}
              title={subLabels?.[idx]}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Perfil de um amigo (visitante): capa, patente da temporada, nível,
 * XP, conquistas (x/38), tarefas concluídas, sequência (streak),
 * conquistas da temporada e histórico de temporadas (T08+).
 */
export default function FriendProfile({
  userId,
  season,
  onClose,
}: {
  userId: string
  season: SeasonInfo
  onClose: () => void
}) {
  const { users, roles } = useData()
  const { settings } = useGamification()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [events, setEvents] = useState<XpEvent[] | null>(null)
  const [unlocks, setUnlocks] = useState<Record<string, AchievementUnlock>>({})

  const friend = users.find((u) => u.id === userId)
  const roleName = roles.find((r) => r.id === friend?.role)?.name ?? ''

  useEffect(() => {
    const unsubs = [
      subscribeProgress(userId, (p) => setProgress(p)),
      subscribeEvents(userId, setEvents),
      subscribeUnlocks(userId, setUnlocks),
    ]
    return () => unsubs.forEach((f) => f())
  }, [userId])

  const stats = useMemo(
    () => computeSeasonStats(events ?? [], unlocks, season),
    [events, unlocks, season]
  )
  const level = useMemo(() => levelProgress(stats.xp), [stats.xp])
  const counters = useMemo(
    () => computeCounters(events ?? [], userId),
    [events, userId]
  )
  const history = useMemo(
    () =>
      buildSeasonSummaries(events ?? [], unlocks)
        .filter(
          (s) =>
            s.info.number >= FIRST_AVAILABLE_SEASON && s.info.key !== season.key
        )
        .reverse(),
    [events, unlocks, season]
  )

  const seasonEvents = useMemo(
    () => (events ?? []).filter((e) => eventInSeason(e, season)),
    [events, season]
  )

  const unlockDates = useMemo(() => {
    const map = new Map<string, string>()
    for (const [docId, unlock] of Object.entries(unlocks)) {
      if (!isUnlockInSeason(docId, unlock.unlockedAt, season)) continue
      map.set(unlock.achievementId, unlock.unlockedAt)
    }
    return map
  }, [unlocks, season])

  const medals = useMemo(
    () => stats.achievements.filter((a) => a.rarity === 'lendaria'),
    [stats.achievements]
  )

  const highlights = useMemo(
    () =>
      stats.achievements
        .filter((a) => a.rarity === 'lendaria' || a.rarity === 'epica')
        .sort((a, b) =>
          a.rarity === b.rarity ? 0 : a.rarity === 'lendaria' ? -1 : 1
        ),
    [stats.achievements]
  )

  const rhythm = useMemo(() => {
    const days = [0, 0, 0, 0, 0, 0, 0]
    const periods = [0, 0, 0, 0]
    for (const e of seasonEvents) {
      const d = new Date(e.completedAt)
      if (!Number.isFinite(d.getTime())) continue
      days[d.getDay()]++
      const h = d.getHours()
      if (h < 6) periods[0]++
      else if (h < 12) periods[1]++
      else if (h < 18) periods[2]++
      else periods[3]++
    }
    const bestDayIndex = days.indexOf(Math.max(...days))
    const bestPeriodIndex = periods.indexOf(Math.max(...periods))
    return { days, periods, bestDayIndex, bestPeriodIndex }
  }, [seasonEvents])

  const feed = useMemo(
    () =>
      [...seasonEvents]
        .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
        .slice(0, 5),
    [seasonEvents]
  )

  const rankIcon = settings.icons[iconKeys.rank(level.level)]
  const loading = events === null
  const levelSpan = Math.max(1, level.nextLevelXp - level.currentLevelXp)

  return (
    <div
      className="fixed inset-0 z-[100010] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Capa */}
        <div className="relative h-28 bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700">
          {progress?.coverUrl && (
            <img
              src={progress.coverUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-5 -mt-10 relative">
          {/* Patente + identidade */}
          <div className="flex items-end gap-3">
            <span
              className={`w-[88px] h-[88px] shrink-0 rounded-2xl border-4 border-white dark:border-[#0c1220] shadow-xl flex items-center justify-center text-4xl bg-gradient-to-br from-amber-400 to-orange-500 overflow-hidden ${
                loading ? 'animate-pulse' : ''
              }`}
            >
              {rankIcon ? (
                <img
                  src={rankIcon}
                  alt={`Nível ${level.level}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                level.icon
              )}
            </span>
            <div className="pb-1 min-w-0">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {friend?.name ?? '…'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {roleName && `${roleName} · `}
                Nível {level.level} — {level.title}
              </p>
            </div>
          </div>

          {/* Progresso do nível */}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {season.label}
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {level.intoLevel}/{levelSpan} XP para o próximo nível
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                style={{ width: `${level.percent}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-center">
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {stats.xp.toLocaleString('pt-BR')}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                XP {season.label}
              </p>
            </div>
            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-center">
              <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" />
                {stats.achievements.length}/{TOTAL_ACHIEVEMENTS}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Conquistas
              </p>
            </div>
            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-center">
              <p className="text-lg font-extrabold text-sky-600 dark:text-sky-400 flex items-center justify-center gap-1">
                <ListChecks className="w-4 h-4" />
                {counters.total}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Tarefas total
              </p>
            </div>
            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-center">
              <p className="text-lg font-extrabold text-orange-500 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4" />
                {counters.streak}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Sequência
              </p>
            </div>
          </div>

          {/* Conquistas da temporada (comum/rara) */}
          <div className="mt-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
              Conquistas da temporada
            </h3>
            {stats.achievements.some((a) => a.rarity === 'comum' || a.rarity === 'rara') ? (
              <div className="flex flex-wrap gap-2">
                {stats.achievements
                  .filter((a) => a.rarity === 'comum' || a.rarity === 'rara')
                  .map((a) => {
                    const custom = settings.icons[iconKeys.rarity(a.rarity)]
                    return (
                      <span
                        key={a.id}
                        title={a.description}
                        className={`inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full border text-[11px] font-bold ${RARITY_META[a.rarity]}`}
                      >
                        {custom ? (
                          <img
                            src={custom}
                            alt={a.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs">{a.icon}</span>
                        )}
                        {a.name}
                      </span>
                    )
                  })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                {loading ? 'Carregando…' : 'Nenhuma conquista simples nesta temporada ainda.'}
              </p>
            )}
          </div>

          {/* Medalhas (lendárias) */}
          {medals.length > 0 && (
            <div className="mt-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                <Medal className="w-3.5 h-3.5" /> Medalhas
              </h3>
              <div className="flex flex-wrap gap-3">
                {medals.map((a) => {
                  const custom = settings.icons[iconKeys.rarity(a.rarity)]
                  const date = fmtDate(unlockDates.get(a.id) ?? '')
                  return (
                    <span
                      key={a.id}
                      title={`${a.name} — ${a.description}${date ? ` · conquistada em ${date}` : ''}`}
                      className="relative w-14 h-14 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 ring-4 ring-amber-400/25 flex items-center justify-center text-2xl"
                    >
                      {custom ? (
                        <img src={custom} alt={a.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        a.icon
                      )}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Conquistas em destaque (épicas + lendárias, com data) */}
          {highlights.length > 0 && (
            <div className="mt-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> Em destaque
              </h3>
              <div className="space-y-1.5">
                {highlights.map((a) => {
                  const custom = settings.icons[iconKeys.rarity(a.rarity)]
                  const date = fmtDate(unlockDates.get(a.id) ?? '')
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40"
                    >
                      <span
                        className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-base overflow-hidden ${RARITY_META[a.rarity]}`}
                      >
                        {custom ? (
                          <img src={custom} alt={a.name} className="w-full h-full object-cover" />
                        ) : (
                          a.icon
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                          {a.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {date ? `Conquistada em ${date}` : 'Conquistada'}
                        </p>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0 ${RARITY_META[a.rarity]}`}
                      >
                        {RARITY_LABEL[a.rarity]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Ritmo — melhor dia e horário */}
          {seasonEvents.length > 0 && (
            <div className="mt-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
                Ritmo — {season.label}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                    Melhor dia
                  </p>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mb-1">
                    {DAY_LABELS[rhythm.bestDayIndex]}{' '}
                    <span className="text-[11px] font-bold text-slate-400">
                      · {rhythm.days[rhythm.bestDayIndex]} tarefas
                    </span>
                  </p>
                  <MiniBars
                    labels={DAY_LABELS}
                    counts={rhythm.days}
                    bestIndex={rhythm.bestDayIndex}
                  />
                </div>
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                    Horário favorito
                  </p>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mb-1">
                    {PERIODS[rhythm.bestPeriodIndex].label}{' '}
                    <span className="text-[11px] font-bold text-slate-400">
                      · {PERIODS[rhythm.bestPeriodIndex].range}
                    </span>
                  </p>
                  <MiniBars
                    labels={PERIODS.map((p) => p.label)}
                    subLabels={PERIODS.map((p) => `${p.label} ${p.range}`)}
                    counts={rhythm.periods}
                    bestIndex={rhythm.bestPeriodIndex}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Atividades recentes */}
          {feed.length > 0 && (
            <div className="mt-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Atividades recentes
              </h3>
              <div className="space-y-1.5">
                {feed.map((e) => {
                  const due = DUE_META[e.dueResult]
                  return (
                    <div
                      key={e.id}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40"
                    >
                      <span className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sky-600 dark:text-sky-400 bg-sky-500/15 border border-sky-500/25">
                        <ListChecks className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          Concluiu tarefa de {CATEGORY_LABELS[e.contentCategory] ?? 'geral'}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {fmtDateTime(e.completedAt)}
                          {e.checklistTotal > 0 &&
                            ` · checklist ${e.checklistDone}/${e.checklistTotal}`}
                        </p>
                      </div>
                      {due && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0 ${due.cls}`}
                        >
                          {due.label}
                        </span>
                      )}
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        +{e.xp} XP
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Histórico de temporadas */}
          {history.length > 0 && (
            <div className="mt-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Histórico
              </h3>
              <div className="space-y-1.5">
                {history.map((s) => (
                  <div
                    key={s.info.key}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs"
                  >
                    <span className="font-extrabold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {s.info.label} — {MONTHS_PT[s.info.month - 1]}{' '}
                      {s.info.year}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {s.tasksCompleted} tarefas
                    </span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {s.xpEarned.toLocaleString('pt-BR')} XP
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold whitespace-nowrap">
                      nv {s.levelEnd}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
