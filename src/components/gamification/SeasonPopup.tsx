'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ACHIEVEMENTS_BY_ID } from '@/lib/gamification/achievements'
import { iconForLevel, titleForLevel } from '@/lib/gamification/levels'
import { achievementName, iconKeys } from '@/lib/gamification/settings'
import type { SeasonSummary } from '@/lib/gamification/seasons'

function fmt(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export default function SeasonPopup({
  summaries,
  icons,
  names,
  anchorRef,
  onClose,
}: {
  summaries: SeasonSummary[]
  icons: Record<string, string>
  names?: Record<string, string>
  /** Elemento que abriu o popup. O painel é posicionado logo abaixo dele. */
  anchorRef?: React.RefObject<HTMLElement | null>
  onClose: () => void
}) {
  const last = summaries[summaries.length - 1]
  const [selectedKey, setSelectedKey] = useState(last?.info.key ?? '')
  const [showSummary, setShowSummary] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const selected = summaries.find((s) => s.info.key === selectedKey) ?? last

  // Posiciona o painel em relação ao botão (fora do card): fixed + portal
  // evita que o overflow-hidden da seção recorte o conteúdo.
  useLayoutEffect(() => {
    const update = () => {
      const anchor = anchorRef?.current
      const panel = panelRef.current
      if (!anchor || !panel) return
      const a = anchor.getBoundingClientRect()
      const w = panel.offsetWidth
      const h = panel.offsetHeight
      const margin = 8
      const gap = 8

      let left = Math.min(a.left, window.innerWidth - margin - w)
      left = Math.max(margin, left)

      let top = a.bottom + gap
      if (top + h > window.innerHeight - margin) {
        const above = a.top - gap - h
        top = above >= margin ? above : Math.max(margin, window.innerHeight - margin - h)
      }

      setPos((prev) =>
        prev && prev.top === top && prev.left === left ? prev : { top, left },
      )
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [anchorRef, showSummary, selectedKey])

  if (!selected) return null

  const rankIcon = icons[iconKeys.rank(selected.levelEnd)]

  const panel = (
    <>
      <div className="fixed inset-0 z-[119]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        className="fixed z-[120] w-[340px] max-w-[calc(100vw-1rem)] max-h-[calc(100vh-1rem)] overflow-y-auto rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 shadow-2xl p-3"
        style={{
          top: pos?.top ?? 0,
          left: pos?.left ?? 0,
          visibility: pos ? 'visible' : 'hidden',
        }}
      >
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
                        <span className="text-slate-600 dark:text-slate-300 truncate">{achievementName(a, names)}</span>
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

  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}
