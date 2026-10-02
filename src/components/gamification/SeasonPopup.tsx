'use client'

import { useState } from 'react'
import { ACHIEVEMENTS_BY_ID } from '@/lib/gamification/achievements'
import { iconForLevel, titleForLevel } from '@/lib/gamification/levels'
import { iconKeys } from '@/lib/gamification/settings'
import type { SeasonSummary } from '@/lib/gamification/seasons'

function fmt(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export default function SeasonPopup({
  summaries,
  icons,
  onClose,
}: {
  summaries: SeasonSummary[]
  icons: Record<string, string>
  onClose: () => void
}) {
  const last = summaries[summaries.length - 1]
  const [selectedKey, setSelectedKey] = useState(last?.info.key ?? '')
  const [showSummary, setShowSummary] = useState(false)

  const selected = summaries.find((s) => s.info.key === selectedKey) ?? last
  if (!selected) return null

  const rankIcon = icons[iconKeys.rank(selected.levelEnd)]

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute z-20 mt-2 left-0 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 shadow-xl p-3">
        {/* Abas T01 T02 ... */}
        <div className="flex flex-wrap gap-1.5">
          {summaries.map((s) => (
            <button
              key={s.info.key}
              type="button"
              onClick={() => {
                setSelectedKey(s.info.key)
                setShowSummary(false)
              }}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                s.info.key === selected.info.key
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {s.info.label}
            </button>
          ))}
        </div>

        {/* Destaque: ícone do nível alcançado */}
        <div className="mt-3 flex flex-col items-center text-center">
          <button
            type="button"
            onClick={() => setShowSummary((v) => !v)}
            title={showSummary ? 'Fechar resumo' : 'Ver resumo da temporada'}
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center overflow-hidden shadow-lg shadow-amber-500/25 border-2 border-amber-300/60 cursor-pointer transition hover:scale-105"
          >
            {rankIcon ? (
              <img src={rankIcon} alt={`Nível ${selected.levelEnd}`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl">{iconForLevel(selected.levelEnd)}</span>
            )}
          </button>
          <p className="mt-2 text-xs font-extrabold uppercase tracking-wide text-[color:var(--gm-fg)]">
            Nível {selected.levelEnd} · {titleForLevel(selected.levelEnd)}
          </p>
          <p className="text-[10px] font-semibold text-slate-400">
            {selected.info.label} · {fmt(selected.info.startMs)} – {fmt(selected.info.endMs)}
          </p>

          {!showSummary && (
            <p className="mt-2 text-[10px] text-slate-400">Toque no ícone para ver o resumo</p>
          )}

          {/* Resumo */}
          {showSummary && (
            <div className="mt-3 w-full rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 text-left">
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-500 dark:text-slate-400">XP ganho</span>
                <span className="font-extrabold text-emerald-500">+{selected.xpEarned} XP</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Tarefas concluídas</span>
                <span className="font-extrabold text-[color:var(--gm-fg)]">{selected.tasksCompleted}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Conquistas desbloqueadas</span>
                <span className="font-extrabold text-[color:var(--gm-fg)]">{selected.achievements.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Nível</span>
                <span className="font-extrabold text-[color:var(--gm-fg)]">
                  {selected.levelStart} → {selected.levelEnd}
                </span>
              </div>

              {selected.achievements.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                  {selected.achievements.map((u) => {
                    const a = ACHIEVEMENTS_BY_ID[u.achievementId]
                    if (!a) return null
                    return (
                      <div key={u.achievementId} className="flex items-center gap-1.5 text-[11px]">
                        <span>{icons[`ach_${a.id}`] ? <img src={icons[`ach_${a.id}`]} alt="" className="w-4 h-4 object-cover rounded" /> : a.icon}</span>
                        <span className="text-slate-600 dark:text-slate-300 truncate">{a.name}</span>
                        <span className="ml-auto font-bold text-emerald-500 shrink-0">+{a.xpReward}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
