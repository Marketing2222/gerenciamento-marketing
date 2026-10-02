'use client'

import React from 'react'
import { iconKeys, RANK_LEVELS } from '@/lib/gamification/settings'
import { iconForLevel, levelThreshold, titleForLevel } from '@/lib/gamification/levels'
import { X } from 'lucide-react'

/**
 * Galeria de patentes: abre ao clicar no quadrado da patente no perfil.
 * Mostra os níveis 1..15 com ícone personalizado (ou emoji padrão),
 * destaca o nível atual e indica quanto XP falta para os próximos.
 */
export default function RankGallery({
  currentLevel,
  currentXp,
  icons,
  onClose,
}: {
  currentLevel: number
  currentXp: number
  icons: Record<string, string>
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Patentes</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Você está no nível {currentLevel} — {titleForLevel(currentLevel)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer" title="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: RANK_LEVELS }, (_, i) => i + 1).map((lvl) => {
            const threshold = levelThreshold(lvl)
            const reached = currentLevel >= lvl
            const isCurrent = currentLevel === lvl
            const missing = Math.max(0, threshold - currentXp)
            const icon = icons[iconKeys.rank(lvl)]

            return (
              <div
                key={lvl}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition ${
                  isCurrent
                    ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/20 shadow-md shadow-amber-500/15'
                    : reached
                      ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/20 opacity-65'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                    reached
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/25'
                      : 'bg-slate-200 dark:bg-slate-800 grayscale'
                  }`}
                >
                  {icon ? (
                    <img src={icon} alt={`Nível ${lvl}`} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span>{iconForLevel(lvl)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">NÍVEL {lvl}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white">ATUAL</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{titleForLevel(lvl)}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lvl === 1 ? 'Nível inicial' : reached ? `A partir de ${threshold.toLocaleString('pt-BR')} XP` : `Faltam ${missing.toLocaleString('pt-BR')} XP`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
