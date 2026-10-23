'use client'

import { useState } from 'react'
import type { ToastItem } from '@/context/GamificationContext'
import type { XpLine } from '@/lib/gamification/types'
import { achievementName, iconKeys } from '@/lib/gamification/settings'

const RARITY_STYLE: Record<string, { border: string; glow: string }> = {
  comum: { border: 'border-slate-500/60', glow: 'shadow-slate-500/20' },
  rara: { border: 'border-blue-500/60', glow: 'shadow-blue-500/25' },
  epica: { border: 'border-purple-500/60', glow: 'shadow-purple-500/25' },
  lendaria: { border: 'border-amber-400/70', glow: 'shadow-amber-500/30' },
}

function XpCard({
  amount,
  details,
  gradient,
  icon,
  onDismiss,
}: {
  amount: number
  details: XpLine[]
  gradient: { from: string; to: string }
  icon?: string
  onDismiss: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <button
      onClick={onDismiss}
      className={`pointer-events-auto animate-scale-up w-[320px] ${showDetails ? 'h-auto' : 'h-[132px]'} text-left rounded-2xl px-4 py-3 bg-[#0f172a] dark:bg-[#111827] text-slate-100 shadow-2xl shadow-blue-600/25 border border-blue-500/40 cursor-pointer overflow-hidden relative`}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundImage: `linear-gradient(90deg, ${gradient.from}, ${gradient.to})` }}
      />
      <div className="flex items-center gap-3">
        {icon ? (
          <img
            src={icon}
            alt="XP"
            className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-md border border-white/20"
          />
        ) : (
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-md"
            style={{ backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
          >
            ⚡
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">XP ganho</p>
          <p className="text-xl font-extrabold leading-tight">+{amount} XP</p>
        </div>
      </div>

      {showDetails ? (
        <div className="mt-2.5 pt-2.5 border-t border-slate-700/70 space-y-1" onClick={(e) => e.stopPropagation()}>
          {details.map((line) => (
            <div key={line.label} className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">{line.label}</span>
              <span className="font-bold text-emerald-400">+{line.amount}</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-700/50">
            <span className="font-bold text-slate-300">Total</span>
            <span className="font-extrabold text-emerald-400">+{amount} XP</span>
          </div>
        </div>
      ) : (
        <span
          className="mt-2 inline-block text-[11px] font-bold text-blue-300 underline underline-offset-2"
          onClick={(e) => {
            e.stopPropagation()
            setShowDetails(true)
          }}
        >
          Detalhes
        </span>
      )}
    </button>
  )
}

export default function GamificationToasts({
  toasts,
  onDismiss,
  gradient,
  icons,
  names,
}: {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
  gradient: { from: string; to: string }
  icons: Record<string, string>
  names?: Record<string, string>
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100001] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(({ id, msg }) => {
        if (msg.kind === 'xp') {
          return (
            <XpCard
              key={id}
              amount={msg.amount}
              details={msg.details}
              gradient={gradient}
              icon={icons[iconKeys.xp]}
              onDismiss={() => onDismiss(id)}
            />
          )
        }
        if (msg.kind === 'levelup') {
          const rankIcon = icons[iconKeys.rank(msg.to)]
          return (
            <button
              key={id}
              onClick={() => onDismiss(id)}
              className="pointer-events-auto animate-scale-up w-[320px] h-[132px] text-left rounded-2xl px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl shadow-purple-600/40 border border-purple-400/50 cursor-pointer overflow-hidden"
            >
              <div className="flex items-center gap-3">
                {rankIcon ? (
                  <img
                    src={rankIcon}
                    alt={`Nível ${msg.to}`}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-md border border-white/30"
                  />
                ) : (
                  <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-3xl shrink-0 shadow-md">
                    {msg.icon}
                  </span>
                )}
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
        const customIcon = icons[iconKeys.achievement(msg.achievement.id)]
        const achTitle = achievementName(msg.achievement, names)
        return (
          <button
            key={id}
            onClick={() => onDismiss(id)}
            className={`pointer-events-auto animate-scale-up w-[320px] h-[132px] text-left rounded-2xl px-4 py-3 bg-[#0f172a] dark:bg-[#111827] text-slate-100 shadow-2xl ${r.glow} border ${r.border} cursor-pointer overflow-hidden`}
          >
            <div className="flex items-start gap-3">
              {customIcon ? (
                <img
                  src={customIcon}
                  alt={achTitle}
                  className="w-10 h-10 rounded-xl object-cover shrink-0 mt-0.5 shadow-md"
                />
              ) : (
                <span className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-3xl shrink-0 mt-0.5">
                  {msg.achievement.icon}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  🏆 Conquista desbloqueada
                </p>
                <p className="text-sm font-bold leading-tight mt-0.5">{achTitle}</p>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{msg.achievement.description}</p>
                <p className="text-[11px] font-bold text-emerald-400 mt-1">+{msg.achievement.xpReward} XP</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
