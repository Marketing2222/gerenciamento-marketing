'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useUser } from '@/context/UserContext'
import {
  resetNewAchievements,
  runBackfillIfNeeded,
  subscribeEvents,
  subscribeProgress,
  subscribeUnlocks,
} from '@/lib/gamification/store'
import { gamificationBus } from '@/lib/gamification/bus'
import { TOTAL_ACHIEVEMENTS } from '@/lib/gamification/achievements'
import { computeCounters } from '@/lib/gamification/engine'
import { levelProgress } from '@/lib/gamification/levels'
import type {
  Achievement,
  AchievementUnlock,
  Counters,
  GamificationMessage,
  UserProgress,
  XpEvent,
} from '@/lib/gamification/types'
import GamificationToasts from '@/components/gamification/GamificationToasts'

export interface ToastItem {
  id: number
  msg: GamificationMessage
}

interface GamificationContextType {
  progress: UserProgress | null
  unlocks: Record<string, AchievementUnlock>
  events: XpEvent[]
  counters: Counters
  unlockedCount: number
  totalAchievements: number
  newAchievements: number
  loading: boolean
  level: ReturnType<typeof levelProgress> | null
  toasts: ToastItem[]
  dismissToast: (id: number) => void
  resetNew: () => void
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined)

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [unlocks, setUnlocks] = useState<Record<string, AchievementUnlock>>({})
  const [events, setEvents] = useState<XpEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastSeq = useRef(0)
  const userId = user?.id ?? null

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(null)
      setUnlocks({})
      setEvents([])
      setLoading(true)
      return
    }
    setLoading(true)
    const unsubProgress = subscribeProgress(userId, (p) => {
      setProgress(p)
      setLoading(false)
    })
    const unsubUnlocks = subscribeUnlocks(userId, setUnlocks)
    const unsubEvents = subscribeEvents(userId, setEvents)
    void runBackfillIfNeeded().catch((err) => console.error('[gamification] backfill', err))
    return () => {
      unsubProgress()
      unsubUnlocks()
      unsubEvents()
    }
  }, [userId])

  useEffect(() => {
    const unsub = gamificationBus.subscribe((msg) => {
      if (msg.kind === 'xp' && msg.amount <= 0) return
      const id = ++toastSeq.current
      setToasts((t) => [...t.slice(-3), { id, msg }])
      const ttl = msg.kind === 'achievement' || msg.kind === 'levelup' ? 6000 : 3000
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id))
      }, ttl)
    })
    return unsub
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const resetNew = useCallback(() => {
    if (userId) void resetNewAchievements(userId).catch(() => {})
  }, [userId])

  const unlockedCount = Object.keys(unlocks).length
  const level = progress ? levelProgress(progress.totalXp) : null
  const counters = React.useMemo(() => computeCounters(events), [events])

  const value: GamificationContextType = {
    progress,
    unlocks,
    events,
    counters,
    unlockedCount,
    totalAchievements: TOTAL_ACHIEVEMENTS,
    newAchievements: progress?.newAchievements ?? 0,
    loading,
    level,
    toasts,
    dismissToast,
    resetNew,
  }

  return (
    <GamificationContext.Provider value={value}>
      {children}
      <GamificationToasts toasts={toasts} onDismiss={dismissToast} />
    </GamificationContext.Provider>
  )
}

export function useGamification(): GamificationContextType {
  const ctx = useContext(GamificationContext)
  if (!ctx) throw new Error('useGamification deve ser usado dentro de GamificationProvider')
  return ctx
}

export type { Achievement }
