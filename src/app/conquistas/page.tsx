'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useGamification } from '@/context/GamificationContext'
import { useTheme } from '@/context/ThemeContext'
import { ACHIEVEMENTS } from '@/lib/gamification/achievements'
import { achievementProgress } from '@/lib/gamification/engine'
import { iconKeys } from '@/lib/gamification/settings'
import type { AchCategory, Rarity } from '@/lib/gamification/types'
import { uploadFile } from '@/lib/storage'
import RankGallery from '@/components/gamification/RankGallery'
import SeasonPopup from '@/components/gamification/SeasonPopup'
import { buildSeasonSummaries, currentSeason } from '@/lib/gamification/seasons'
import { Loader2, Moon, Pencil, Sun, Trophy, Upload, Trash2, Filter, Calendar, Gem } from 'lucide-react'

type StatusFilter = 'todas' | 'desbloqueadas' | 'pendentes'

const RARITY_META: Record<Rarity, { label: string; pill: string; border: string; ring: string }> = {
  comum: { label: 'Comum', pill: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30', border: 'border-slate-300 dark:border-slate-700', ring: 'shadow-slate-400/10' },
  rara: { label: 'Rara', pill: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30', border: 'border-blue-300 dark:border-blue-700', ring: 'shadow-blue-400/15' },
  epica: { label: 'Épica', pill: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30', border: 'border-purple-300 dark:border-purple-700', ring: 'shadow-purple-400/15' },
  lendaria: { label: 'Lendária', pill: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40', border: 'border-amber-300 dark:border-amber-600', ring: 'shadow-amber-400/25' },
}

const CATEGORY_LABELS: { id: AchCategory | 'todas'; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'produtividade', label: 'Produtividade' },
  { id: 'velocidade', label: 'Velocidade' },
  { id: 'consistencia', label: 'Consistência' },
  { id: 'videos', label: 'Vídeos' },
  { id: 'posts', label: 'Posts' },
  { id: 'trafego', label: 'Tráfego' },
  { id: 'secretas', label: 'Secretas' },
]

export default function ConquistasPage() {
  const { progress, unlocks, allUnlocks, events, counters, unlockedCount, totalAchievements, loading, level, seasonXp, resetNew, settings, saveCover } = useGamification()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas')
  const [catFilter, setCatFilter] = useState<AchCategory | 'todas'>('todas')
  const [catMenu, setCatMenu] = useState(false)
  const [rarFilter, setRarFilter] = useState<Rarity | 'todas'>('todas')
  const [rarMenu, setRarMenu] = useState(false)
  const [seasonOpen, setSeasonOpen] = useState(false)
  const [rankOpen, setRankOpen] = useState(false)
  const [coverMenu, setCoverMenu] = useState(false)
  const [savingCover, setSavingCover] = useState(false)
  const [coverError, setCoverError] = useState('')
  const coverInputRef = useRef<HTMLInputElement>(null)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    resetNew()
  }, [resetNew])

  // A página de conquistas sempre começa no tema claro.
  useEffect(() => {
    if (theme === 'dark') setTheme('light')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const grad: React.CSSProperties = {
    backgroundImage: `linear-gradient(90deg, ${settings.gradientFrom}, ${settings.gradientTo})`,
  }

  const handleCoverUpload = async (file: File) => {
    setSavingCover(true)
    setCoverError('')
    try {
      const url = await uploadFile(file)
      await saveCover(url)
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : 'Falha ao enviar a capa.')
    } finally {
      setSavingCover(false)
      setCoverMenu(false)
    }
  }

  const handleCoverRemove = async () => {
    setSavingCover(true)
    try {
      await saveCover(null)
    } finally {
      setSavingCover(false)
      setCoverMenu(false)
    }
  }

  const filtered = useMemo(() => {
    return ACHIEVEMENTS.filter((a) => {
      const unlocked = Boolean(unlocks[a.id])
      if (statusFilter === 'desbloqueadas' && !unlocked) return false
      if (statusFilter === 'pendentes' && unlocked) return false
      if (catFilter !== 'todas' && a.category !== catFilter) return false
      if (rarFilter !== 'todas' && a.rarity !== rarFilter) return false
      return true
    })
  }, [unlocks, statusFilter, catFilter, rarFilter])

  const seasonSummaries = useMemo(() => buildSeasonSummaries(events, allUnlocks), [events, allUnlocks])
  const seasonNumberNow = seasonSummaries[seasonSummaries.length - 1]?.info.number ?? currentSeason().number

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[color:var(--gm-muted)]">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
        <p className="text-sm font-medium">Carregando conquistas...</p>
      </div>
    )
  }

  const totalXp = seasonXp
  const completionPercent = Math.round((unlockedCount / Math.max(1, totalAchievements)) * 100)

  return (
    <div
      className="gm-page -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 -mb-24 md:-mb-6 p-4 sm:p-6 pb-24 md:pb-6"
      style={{
        backgroundColor: settings.pageBg || undefined,
        ...(settings.pageText
          ? ({ '--gm-fg': settings.pageText, '--gm-muted': settings.pageText } as React.CSSProperties)
          : {}),
      }}
    >
      <div className="max-w-6xl mx-auto space-y-6">
      {/* Perfil */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-6 md:p-8 shadow-sm overflow-hidden relative">
        {progress?.coverUrl && (
          <img src={progress.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
        )}
        {progress?.coverUrl ? (
          settings.transparencyEnabled ? (
            <div
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{ backgroundColor: settings.transparencyColor }}
            />
          ) : null
        ) : (
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/10" />
        )}
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setRankOpen(true)}
            title="Ver patentes"
            className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-5xl shadow-lg shadow-amber-500/30 shrink-0 overflow-hidden cursor-pointer transition hover:scale-105"
          >
            {settings.icons[iconKeys.rank(level?.level ?? 1)] ? (
              <img
                src={settings.icons[iconKeys.rank(level?.level ?? 1)]}
                alt={`Patente nível ${level?.level ?? 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{level?.icon ?? '🌱'}</span>
            )}
          </button>
            <div>
              <span className="inline-flex items-center mb-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                T{seasonNumberNow}
              </span>
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">
                Nível {level?.level ?? 1}
              </p>
              <h1 className="text-3xl font-extrabold text-[color:var(--gm-fg)] leading-tight">
                {level?.title ?? 'Recruta'}
              </h1>
              <p className="text-sm text-[color:var(--gm-muted)]">{totalXp.toLocaleString('pt-BR')} XP na temporada</p>
            </div>
          </div>

          <div className="flex-1 md:pl-6 md:border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-[color:var(--gm-muted)] mb-1.5">
              <span>
                {level?.intoLevel ?? 0} / {Math.max(1, (level?.nextLevelXp ?? 1) - (level?.currentLevelXp ?? 0))} XP
              </span>
              <span>Próximo nível em {Math.max(0, (level?.nextLevelXp ?? 0) - totalXp)} XP</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ ...grad, width: `${level?.percent ?? 0}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
                <p className="text-xl font-extrabold text-[color:var(--gm-fg)]">
                  {unlockedCount}/{totalAchievements}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Conquistas</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
                <p className="text-xl font-extrabold text-[color:var(--gm-fg)]">{completionPercent}%</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completo</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
                <p className="text-xl font-extrabold text-[color:var(--gm-fg)]">{counters.total}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tarefas concluídas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Editar capa */}
        <div className="absolute bottom-3 right-3 z-20">
          <button
            type="button"
            onClick={() => setCoverMenu((v) => !v)}
            disabled={savingCover}
            title="Editar capa"
            className="w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-[color:var(--gm-muted)] hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer disabled:opacity-60"
          >
            {savingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
          </button>
          {coverMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setCoverMenu(false)} />
              <div className="absolute bottom-11 right-0 z-20 w-44 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden text-xs font-semibold text-slate-700 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-500" />
                  {progress?.coverUrl ? 'Trocar capa' : 'Adicionar capa'}
                </button>
                {progress?.coverUrl && (
                  <button
                    type="button"
                    onClick={handleCoverRemove}
                    className="w-full text-left px-3 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover capa
                  </button>
                )}
              </div>
            </>
          )}
          <input
            type="file"
            ref={coverInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleCoverUpload(f)
              e.target.value = ''
            }}
          />
        </div>
        {coverError && (
          <p className="absolute bottom-4 right-14 z-20 text-[11px] font-semibold text-red-500 bg-white/95 dark:bg-slate-900/95 px-2 py-1 rounded-lg border border-red-200 dark:border-red-900/50">
            {coverError}
          </p>
        )}
      </section>

      {/* Filtros */}
      <section className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          {(['todas', 'desbloqueadas', 'pendentes'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={statusFilter === s ? grad : undefined}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition capitalize cursor-pointer ${
                statusFilter === s
                  ? 'text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}

          {/* Temporada */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSeasonOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-950/70"
            >
              <Calendar className="w-3.5 h-3.5" />
              TEMPORADA {seasonNumberNow}
            </button>
            {seasonOpen && (
              <SeasonPopup
                summaries={seasonSummaries}
                icons={settings.icons}
                onClose={() => setSeasonOpen(false)}
              />
            )}
          </div>

          {/* Filtro de categorias (dropdown) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCatMenu((v) => !v)}
              style={catFilter !== 'todas' ? grad : undefined}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                catFilter !== 'todas'
                  ? 'text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {catFilter === 'todas' ? 'Filtro' : CATEGORY_LABELS.find((c) => c.id === catFilter)?.label}
            </button>
            {catMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setCatMenu(false)} />
                <div className="absolute z-20 mt-2 w-44 p-2 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 shadow-xl flex flex-wrap gap-1.5">
                  {CATEGORY_LABELS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCatFilter(c.id)
                        setCatMenu(false)
                      }}
                      style={catFilter === c.id ? grad : undefined}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                        catFilter === c.id
                          ? 'text-white shadow-md shadow-slate-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filtro de raridade (dropdown) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRarMenu((v) => !v)}
              style={rarFilter !== 'todas' ? grad : undefined}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                rarFilter !== 'todas'
                  ? 'text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Gem className="w-3.5 h-3.5" />
              {rarFilter === 'todas' ? 'Raridade' : RARITY_META[rarFilter].label}
            </button>
            {rarMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setRarMenu(false)} />
                <div className="absolute z-20 mt-2 w-44 p-2 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col gap-1.5">
                  {(['todas', 'comum', 'rara', 'epica', 'lendaria'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRarFilter(r)
                        setRarMenu(false)
                      }}
                      style={rarFilter === r ? grad : undefined}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition text-left cursor-pointer ${
                        rarFilter === r
                          ? 'text-white shadow-md shadow-slate-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {r === 'todas' ? 'Todas' : RARITY_META[r].label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Tema claro/escuro da página */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </section>

      {/* Grid de conquistas */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 dark:text-slate-500">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhuma conquista neste filtro.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((a) => {
            const unlocked = Boolean(unlocks[a.id])
            const rarity = RARITY_META[a.rarity]
            const progressValue = achievementProgress(a, counters, Object.keys(unlocks))
            const showProgress = a.requirement.value > 1 && a.requirement.type !== 'rapid'
            const percent = Math.min(100, Math.round((progressValue / a.requirement.value) * 100))
            const unlockedAt = unlocks[a.id]?.unlockedAt
            const customIcon = settings.icons[iconKeys.achievement(a.id)]
            const customRarity = settings.icons[iconKeys.rarity(a.rarity)]

            return (
              <article
                key={a.id}
                className={`rounded-2xl border p-5 transition relative ${
                  unlocked
                    ? `${rarity.border} bg-white dark:bg-[#0c1220] shadow-lg ${rarity.ring}`
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 opacity-80'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-4xl shrink-0 overflow-hidden ${
                      unlocked
                        ? 'bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-400/30'
                        : 'bg-slate-200 dark:bg-slate-800 grayscale'
                    }`}
                  >
                    {customIcon ? (
                      <img src={customIcon} alt={a.name} className="w-full h-full object-cover" />
                    ) : (
                      a.icon
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        title={a.name}
                        className="min-w-0 text-sm font-bold uppercase tracking-wide text-[color:var(--gm-fg)] leading-tight truncate"
                      >
                        {a.name}
                      </h3>
                      {customRarity ? (
                        <img src={customRarity} alt={rarity.label} className="shrink-0 w-9 h-9 rounded-full object-cover border border-black/10 dark:border-white/10" />
                      ) : (
                        <span className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold uppercase border ${rarity.pill}`}>
                          {rarity.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[color:var(--gm-muted)] leading-snug mt-1">
                      {a.description}
                    </p>

                    {showProgress && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                          <span>
                            {Math.min(progressValue, a.requirement.value)}/{a.requirement.value}
                          </span>
                          <span>{percent}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              unlocked ? '' : 'bg-slate-400 dark:bg-slate-600'
                            }`}
                            style={unlocked ? { ...grad, width: '100%' } : { width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-extrabold text-emerald-500">+{a.xpReward} XP</span>
                      {unlocked && unlockedAt ? (
                        <span className="text-xs font-semibold text-slate-400">
                          {new Date(unlockedAt).toLocaleDateString('pt-BR')}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}

      {rankOpen && (
        <RankGallery
          currentLevel={level?.level ?? 1}
          currentXp={totalXp}
          icons={settings.icons}
          onClose={() => setRankOpen(false)}
        />
      )}
      </div>
    </div>
  )
}
