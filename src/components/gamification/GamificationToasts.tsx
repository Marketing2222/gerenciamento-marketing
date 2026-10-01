'use client'

import React from 'react'
import type { ToastItem } from '@/context/GamificationContext'

const RARITY_STYLE: Record<string, { border: string; glow: string }> = {
  comum: { border: 'border-slate-500/60', glow: 'shadow-slate-500/20' },
  rara: { border: 'border-blue-500/60', glow: 'shadow-blue-500/25' },
  epica: { border: 'border-purple-500/60', glow: 'shadow-purple-500/25' },
  lendaria: { border: 'border-amber-400/70', glow: 'shadow-amber-500/30' },
}

export default function GamificationToasts({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100001] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(({ id, msg }) => {
        if (msg.kind === 'xp') {
          return (
            <button
              key={id}
              onClick={() => onDismiss(id)}
              className="pointer-events-auto animate-scale-up px-3 py-1.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40 cursor-pointer"
            >
              +{msg.amount} XP ⚡
            </button>
          )
        }
        if (msg.kind === 'levelup') {
          return (
            <button
              key={id}
              onClick={() => onDismiss(id)}
              className="pointer-events-auto animate-scale-up w-[280px] text-left rounded-2xl px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl shadow-purple-600/40 border border-purple-400/50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{msg.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-200">
                    ⚡ Level Up!
                  </p>
                  <p className="text-sm font-bold leading-tight">
                    Nível {msg.to} — {msg.title}
                  </p>
                  <p className="text-[11px] text-purple-200/90">
                    Subiu do nível {msg.from}
                  </p>
                </div>
              </div>
            </button>
          )
        }
        const r = RARITY_STYLE[msg.achievement.rarity] ?? RARITY_STYLE.comum
        return (
          <button
            key={id}
            onClick={() => onDismiss(id)}
            className={`pointer-events-auto animate-scale-up w-[300px] text-left rounded-2xl px-4 py-3 bg-[#0f172a] dark:bg-[#111827] text-slate-100 shadow-2xl ${r.glow} border ${r.border} cursor-pointer`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl leading-none mt-0.5">{msg.achievement.icon}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  🏆 Conquista desbloqueada
                </p>
                <p className="text-sm font-bold leading-tight mt-0.5">{msg.achievement.name}</p>
                <p className="text-[11px] text-slate-400 leading-snug">{msg.achievement.description}</p>
                <p className="text-[11px] font-bold text-emerald-400 mt-1">+{msg.achievement.xpReward} XP</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
