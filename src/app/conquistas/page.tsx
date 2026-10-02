'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useGamification } from '@/context/GamificationContext'
import { ACHIEVEMENTS } from '@/lib/gamification/achievements'
import { requirementProgress } from '@/lib/gamification/engine'
import { iconKeys } from '@/lib/gamification/settings'
import type { AchCategory, Rarity } from '@/lib/gamification/types'
import { uploadFile } from '@/lib/storage'
import RankGallery from '@/components/gamification/RankGallery'
import { Loader2, Lock, Pencil, Trophy, Upload, Trash2 } from 'lucide-react'

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
  const { progress, unlocks, counters, unlockedCount, totalAchievements, loading, level, resetNew, settings, saveCover } = useGamification()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas')
  const [catFilter, setCatFilter] = useState<AchCategory | 'todas'>('todas')
  const [rankOpen, setRankOpen] = useState(false)
  const [coverMenu, setCoverMenu] = useState(false)
  const [savingCover, setSavingCover] = useState(false)
  const [coverError, setCoverError] = useState('')
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    resetNew()
  }, [resetNew])

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
      return true
    })
  }, [unlocks, statusFilter, catFilter])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
        <p className="text-sm font-medium">Carregando conquistas...</p>
      </div>
    )
  }

  const totalXp = progress?.totalXp ?? 0
  const completionPercent = Math.round((unlockedCount / Math.max(1, totalAchievements)) * 100)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Perfil */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-6 shadow-sm overflow-hidden relative">
        {progress?.coverUrl && (
          <img src={progress.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
        )}
        <div
          className={`absolute inset-0 pointer-events-none ${
            progress?.coverUrl
              ? 'bg-white/60 dark:bg-[#0c1220]/60'
              : 'bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/10'
          }`}
        />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setRankOpen(true)}
            title="Ver patentes"
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/30 shrink-0 overflow-hidden cursor-pointer transition hover:scale-105"
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
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">
                Nível {level?.level ?? 1}
              </p>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                {level?.title ?? 'Recruta'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{totalXp.toLocaleString('pt-BR')} XP acumulado</p>
            </div>
          </div>

          <div className="flex-1 md:pl-6 md:border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
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
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {unlockedCount}/{totalAchievements}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Conquistas</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{completionPercent}%</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completo</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{counters.total}</p>
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
            className="w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer disabled:opacity-60"
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
        <div className="flex flex-wrap gap-2">
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
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_LABELS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCatFilter(c.id)}
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
      </section>

      {/* Grid de conquistas */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 dark:text-slate-500">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhuma conquista neste filtro.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((a) => {
            const unlocked = Boolean(unlocks[a.id])
            const lockedSecret = a.secret && !unlocked
            const rarity = RARITY_META[a.rarity]
            const progressValue = requirementProgress(a, counters)
            const showProgress = !lockedSecret && a.requirement.value > 1 && a.requirement.type !== 'rapid'
            const percent = Math.min(100, Math.round((progressValue / a.requirement.value) * 100))
            const unlockedAt = unlocks[a.id]?.unlockedAt
            const customIcon = settings.icons[iconKeys.achievement(a.id)]
            const customRarity = settings.icons[iconKeys.rarity(a.rarity)]

            return (
              <article
                key={a.id}
                className={`rounded-2xl border p-4 transition relative ${
                  unlocked
                    ? `${rarity.border} bg-white dark:bg-[#0c1220] shadow-lg ${rarity.ring}`
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden ${
                      unlocked
                        ? 'bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-400/30'
                        : 'bg-slate-200 dark:bg-slate-800 grayscale'
                    }`}
                  >
                    {lockedSecret ? (
                      <Lock className="w-5 h-5 text-slate-400" />
                    ) : customIcon ? (
                      <img src={customIcon} alt={a.name} className="w-full h-full object-cover" />
                    ) : (
                      a.icon
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {lockedSecret ? '???' : a.name}
                      </h3>
                      {customRarity ? (
                        <img src={customRarity} alt={rarity.label} className="shrink-0 h-5 max-w-[84px] object-contain" />
                      ) : (
                        <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase border ${rarity.pill}`}>
                          {rarity.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                      {lockedSecret ? 'Conquista secreta — continue jogando para descobrir.' : a.description}
                    </p>

                    {showProgress && (
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                          <span>
                            {Math.min(progressValue, a.requirement.value)}/{a.requirement.value}
                          </span>
                          <span>{percent}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              unlocked ? '' : 'bg-slate-400 dark:bg-slate-600'
                            }`}
                            style={unlocked ? { ...grad, width: '100%' } : { width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-[11px] font-bold text-emerald-500">+{a.xpReward} XP</span>
                      {unlocked && unlockedAt ? (
                        <span className="text-[10px] font-semibold text-slate-400">
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
          currentXp={progress?.totalXp ?? 0}
          icons={settings.icons}
          onClose={() => setRankOpen(false)}
        />
      )}
    </div>
  )
}
