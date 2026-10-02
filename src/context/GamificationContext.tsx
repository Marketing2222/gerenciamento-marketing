'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useUser } from '@/context/UserContext'
import {
  resetNewAchievements,
  runBackfillIfNeeded,
  saveCoverUrl,
  subscribeEvents,
  subscribeProgress,
  subscribeUnlocks,
} from '@/lib/gamification/store'
import {
  DEFAULT_GRADIENT,
  DEFAULT_PAGE_THEME,
  clearIcon as clearSettingsIcon,
  saveGradient,
  saveIcon as saveSettingsIcon,
  savePageTheme,
  subscribeSettings,
  type GamificationSettings,
} from '@/lib/gamification/settings'
import { gamificationBus } from '@/lib/gamification/bus'
import { TOTAL_ACHIEVEMENTS } from '@/lib/gamification/achievements'
import { computeCounters } from '@/lib/gamification/engine'
import { playAchievementSound, playLevelUpSound, playXpSound } from '@/lib/gamification/sound'
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
  settings: GamificationSettings
  saveIcon: (key: string, url: string) => Promise<void>
  clearIcon: (key: string) => Promise<void>
  saveGradient: (from: string, to: string) => Promise<void>
  savePageTheme: (patch: import('@/lib/gamification/settings').PageThemePatch) => Promise<void>
  saveCover: (url: string | null) => Promise<void>
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined)

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [unlocks, setUnlocks] = useState<Record<string, AchievementUnlock>>({})
  const [events, setEvents] = useState<XpEvent[]>([])
  const [settings, setSettings] = useState<GamificationSettings>({
    gradientFrom: DEFAULT_GRADIENT.from,
    gradientTo: DEFAULT_GRADIENT.to,
    icons: {},
    ...DEFAULT_PAGE_THEME,
  })
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
    const unsub = subscribeSettings(setSettings)
    return unsub
  }, [])

  useEffect(() => {
    const unsub = gamificationBus.subscribe((msg) => {
      if (msg.kind === 'xp' && msg.amount <= 0) return
      const id = ++toastSeq.current
      setToasts((t) => [...t.slice(-3), { id, msg }])
      if (msg.kind === 'xp') playXpSound()
      else if (msg.kind === 'achievement') playAchievementSound()
      else playLevelUpSound()
      const ttl = msg.kind === 'xp' ? 8000 : 6000
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

  const doSaveIcon = useCallback(async (key: string, url: string) => {
    await saveSettingsIcon(key, url)
  }, [])

  const doClearIcon = useCallback(async (key: string) => {
    await clearSettingsIcon(key)
  }, [])

  const doSaveGradient = useCallback(async (from: string, to: string) => {
    await saveGradient(from, to)
  }, [])

  const doSavePageTheme = useCallback(async (patch: import('@/lib/gamification/settings').PageThemePatch) => {
    await savePageTheme(patch)
  }, [])

  const doSaveCover = useCallback(async (url: string | null) => {
    if (userId) await saveCoverUrl(userId, url)
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
    settings,
    saveIcon: doSaveIcon,
    clearIcon: doClearIcon,
    saveGradient: doSaveGradient,
    savePageTheme: doSavePageTheme,
    saveCover: doSaveCover,
  }

  return (
    <GamificationContext.Provider value={value}>
      {children}
      <GamificationToasts
        toasts={toasts}
        onDismiss={dismissToast}
        gradient={{ from: settings.gradientFrom, to: settings.gradientTo }}
      />
    </GamificationContext.Provider>
  )
}

export function useGamification(): GamificationContextType {
  const ctx = useContext(GamificationContext)
  if (!ctx) throw new Error('useGamification deve ser usado dentro de GamificationProvider')
  return ctx
}

export type { Achievement }
