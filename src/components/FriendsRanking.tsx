'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, UsersRound, ChevronDown, Eye } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { useUser } from '@/context/UserContext'
import { useGamification } from '@/context/GamificationContext'
import { subscribeEvents, subscribeUnlocks } from '@/lib/gamification/store'
import { TOTAL_ACHIEVEMENTS } from '@/lib/gamification/achievements'
import {
  SEASON_EPOCH,
  currentSeason,
  seasonInfo,
  type SeasonInfo,
} from '@/lib/gamification/seasons'
import { iconForLevel, levelProgress } from '@/lib/gamification/levels'
import {
  FIRST_AVAILABLE_SEASON,
  MONTHS_PT,
  computeSeasonStats,
} from '@/lib/gamification/stats'
import { iconKeys } from '@/lib/gamification/settings'
import FriendProfile from '@/components/FriendProfile'
import type { AchievementUnlock, XpEvent } from '@/lib/gamification/types'

interface FriendStats {
  events: XpEvent[]
  unlocks: Record<string, AchievementUnlock>
}

interface RankingRow {
  id: string
  name: string
  xp: number
  level: number
  title: string
  icon: string
  achievements: number
}

const MEDALS = ['bg-gradient-to-br from-amber-300 to-amber-600 text-amber-950 shadow-md shadow-amber-500/30',
  'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900 shadow-md shadow-slate-400/30',
  'bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-md shadow-orange-600/30']

/** Temporadas da T08 até a atual, da mais recente para a mais antiga. */
function seasonOptions(now: Date = new Date()): SeasonInfo[] {
  const cur = currentSeason(now)
  const list: SeasonInfo[] = []
  let y = SEASON_EPOCH.year
  let m = SEASON_EPOCH.month
  while (y < cur.year || (y === cur.year && m <= cur.month)) {
    const info = seasonInfo(y, m)
    if (info.number >= FIRST_AVAILABLE_SEASON) list.push(info)
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  return list.reverse()
}

/**
 * Ranking de amigos: posição, ícone do nível, nível, nome, XP e conquistas
 * da TEMPORADA ATUAL (mesma base do nível/badge do header). Exclui o Diretor.
 */
export default function FriendsRanking({ onClose }: { onClose: () => void }) {
  const { users, roles } = useData()
  const { user } = useUser()
  const { settings } = useGamification()
  const [stats, setStats] = useState<Record<string, FriendStats>>({})
  const [isSeasonMenuOpen, setIsSeasonMenuOpen] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)

  const now = useMemo(() => new Date(), [])
  const current = useMemo(() => currentSeason(now), [now])
  const options = useMemo(() => seasonOptions(now), [now])
  const [season, setSeason] = useState<SeasonInfo>(current)

  const rankable = useMemo(() => {
    const directorRoles = new Set(
      roles.filter((r) => r.name.trim().toLowerCase() === 'diretor').map((r) => r.id)
    )
    return users.filter((u) => !directorRoles.has(u.role) && !/^junior\b/i.test(u.name.trim()))
  }, [users, roles])

  useEffect(() => {
    const unsubs: (() => void)[] = []
    for (const u of rankable) {
      unsubs.push(
        subscribeEvents(u.id, (events) => {
          setStats((s) => ({ ...s, [u.id]: { events, unlocks: s[u.id]?.unlocks ?? {} } }))
        })
      )
      unsubs.push(
        subscribeUnlocks(u.id, (map) => {
          setStats((s) => ({ ...s, [u.id]: { events: s[u.id]?.events ?? [], unlocks: map } }))
        })
      )
    }
    return () => unsubs.forEach((f) => f())
  }, [rankable])

  const rows: RankingRow[] = useMemo(() => {
    const list = rankable.map((u) => {
      const st = stats[u.id]
      const s = computeSeasonStats(st?.events ?? [], st?.unlocks ?? {}, season)
      const level = levelProgress(s.xp)
      return {
        id: u.id,
        name: u.name,
        xp: s.xp,
        level: level.level,
        title: level.title,
        icon: level.icon,
        achievements: s.unlockedIds.length,
      }
    })
    return list.sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name))
  }, [rankable, stats, season])

  const loading = rankable.some((u) => !stats[u.id])

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/25">
              <UsersRound className="w-4 h-4" />
            </span>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              Amigos
            </h2>
          <div className="relative">
            <button
              onClick={() => setIsSeasonMenuOpen((v) => !v)}
              className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
              title="Selecionar temporada"
            >
              Temporada {season.label} — {season.year}
              {season.key !== current.key && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white">HISTÓRICO</span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSeasonMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSeasonMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSeasonMenuOpen(false)} />
                <div className="absolute left-0 top-7 z-50 w-52 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1628] shadow-2xl py-1">
                  {options.map((o) => {
                    const isCurrentSeason = o.key === current.key
                    const isSelected = o.key === season.key
                    return (
                      <button
                        key={o.key}
                        onClick={() => {
                          setSeason(o)
                          setIsSeasonMenuOpen(false)
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                        }`}
                      >
                        <span className="whitespace-nowrap">
                          {o.label} — {MONTHS_PT[o.month - 1]} {o.year}
                        </span>
                        {isCurrentSeason && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            ATUAL
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
          </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          <span className="w-8 text-center">#</span>
          <span className="w-20">Nível</span>
          <span className="flex-1">Usuário</span>
          <span className="w-24 text-right">XP</span>
          <span className="w-20 text-right">Conquistas</span>
          <span className="w-8" aria-hidden="true" />
        </div>

        <div className="px-5 pb-5 space-y-2">
          {rows.map((r, i) => {
            const pos = i + 1
            const isMe = r.id === user?.id
            const rankIcon = settings.icons[iconKeys.rank(r.level)]
            return (
              <div
                key={r.id}
                className={`flex items-center gap-2 px-3 py-3 rounded-2xl border transition ${
                  isMe
                    ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/20 shadow-md shadow-amber-500/15'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span
                  className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-extrabold ${
                    pos <= 3 ? MEDALS[pos - 1] : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {pos}
                </span>

                <div className="w-20 flex items-center gap-2 shrink-0">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-400/30">
                    {rankIcon ? (
                      <img src={rankIcon} alt={`Nível ${r.level}`} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      iconForLevel(r.level)
                    )}
                  </span>
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {r.level}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setProfileId(r.id)}
                  title="Ver perfil"
                  className="flex-1 min-w-0 text-left group/name cursor-pointer"
                >
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate transition-colors group-hover/name:text-sky-600 dark:group-hover/name:text-sky-400">
                    {r.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{r.title}</p>
                </button>

                <span className="w-24 text-right text-sm font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                  {r.xp.toLocaleString('pt-BR')}{' '}
                  <span className="text-[10px] font-bold text-slate-400">XP</span>
                </span>

                <span className="w-20 text-right shrink-0">
                  <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {r.achievements}/{TOTAL_ACHIEVEMENTS}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => setProfileId(r.id)}
                  title="Ver perfil"
                  className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-500/10 transition cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            )
          })}

          {rows.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">Nenhum amigo por aqui ainda.</p>
          )}

          {loading && (
            <p className="pt-1 text-center text-[11px] text-slate-400 animate-pulse">Carregando XP…</p>
          )}
        </div>
      </div>

      {profileId && (
        <FriendProfile
          userId={profileId}
          season={season}
          onClose={() => setProfileId(null)}
        />
      )}
    </div>
  )
}
