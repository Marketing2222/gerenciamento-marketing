'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useUser } from '@/context/UserContext'
import { useData } from '@/context/DataContext'
import {
  resetNewAchievements,
  reconcileSeasonUnlocks,
  runBackfillIfNeeded,
  saveCoverUrl,
  saveProfileAccent,
  saveProfileBgZoom,
  subscribeEvents,
  subscribeProgress,
  subscribeUnlocks,
} from '@/lib/gamification/store'
import {
  DEFAULT_GRADIENT,
  DEFAULT_PAGE_THEME,
  clearIcon as clearSettingsIcon,
  saveAchievementName as saveSettingsAchievementName,
  saveGradient,
  saveIcon as saveSettingsIcon,
  savePageTheme,
  subscribeSettings,
  type GamificationSettings,
} from '@/lib/gamification/settings'
import { gamificationBus } from '@/lib/gamification/bus'
import { ACHIEVEMENTS_BY_ID, TOTAL_ACHIEVEMENTS } from '@/lib/gamification/achievements'
import { computeCounters } from '@/lib/gamification/engine'
import { currentSeason, eventInSeason, isUnlockInSeason } from '@/lib/gamification/seasons'
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
  /** Desbloqueios da TEMPORADA ATUAL, chave = achievementId (reset mensal). */
  unlocks: Record<string, AchievementUnlock>
  /** Todos os docs de desbloqueio (chave = docId) — histórico dos resumos. */
  allUnlocks: Record<string, AchievementUnlock>
  events: XpEvent[]
  counters: Counters
  unlockedCount: number
  totalAchievements: number
  newAchievements: number
  loading: boolean
  level: ReturnType<typeof levelProgress> | null
  /** XP (eventos + recompensas) da temporada atual. */
  seasonXp: number
  toasts: ToastItem[]
  dismissToast: (id: number) => void
  resetNew: () => void
  settings: GamificationSettings
  saveIcon: (key: string, url: string) => Promise<void>
  clearIcon: (key: string) => Promise<void>
  saveAchievementName: (id: string, name: string) => Promise<void>
  saveGradient: (from: string, to: string) => Promise<void>
  savePageTheme: (patch: import('@/lib/gamification/settings').PageThemePatch) => Promise<void>
  saveCover: (url: string | null) => Promise<void>
  saveAccent: (from: string, to: string) => Promise<void>
  saveBgZoom: (zoom: number) => Promise<void>
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined)

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const { tasks, loaded: tasksLoaded } = useData()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [unlockDocs, setUnlockDocs] = useState<Record<string, AchievementUnlock>>({})
  const [events, setEvents] = useState<XpEvent[]>([])
  /** Dono dos `events` atuais — evita reconciliar com eventos de outra sessão. */
  const [eventsForUser, setEventsForUser] = useState<string | null>(null)
  const [settings, setSettings] = useState<GamificationSettings>({
    gradientFrom: DEFAULT_GRADIENT.from,
    gradientTo: DEFAULT_GRADIENT.to,
    icons: {},
    names: {},
    ...DEFAULT_PAGE_THEME,
  })
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastSeq = useRef(0)
  const reconciledRef = useRef(false)
  const userId = user?.id ?? null

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(null)
      setUnlockDocs({})
      setEvents([])
      setEventsForUser(null)
      setLoading(true)
      reconciledRef.current = false
      return
    }
    setLoading(true)
    reconciledRef.current = false
    const unsubProgress = subscribeProgress(userId, (p) => {
      setProgress(p)
      setLoading(false)
    })
    const unsubUnlocks = subscribeUnlocks(userId, setUnlockDocs)
    const unsubEvents = subscribeEvents(userId, (evs) => {
      setEvents(evs)
      setEventsForUser(userId)
    })
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

  const doSaveAchievementName = useCallback(async (id: string, name: string) => {
    await saveSettingsAchievementName(id, name)
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

  const doSaveAccent = useCallback(async (from: string, to: string) => {
    if (userId) await saveProfileAccent(userId, from, to)
  }, [userId])

  const doSaveBgZoom = useCallback(async (zoom: number) => {
    if (userId) await saveProfileBgZoom(userId, zoom)
  }, [userId])

  // ===== Progresso da temporada atual (reset mensal) =====
  // Temporada fixada na montagem: cruzar a virada do mês exige recarregar.
  const season = React.useMemo(() => currentSeason(), [])

  const unlocks = React.useMemo(() => {
    const map: Record<string, AchievementUnlock> = {}
    for (const [docId, u] of Object.entries(unlockDocs)) {
      if (!isUnlockInSeason(docId, u.unlockedAt, season)) continue
      const prev = map[u.achievementId]
      if (!prev || prev.unlockedAt < u.unlockedAt) map[u.achievementId] = u
    }
    return map
  }, [unlockDocs, season])

  const seasonEvents = React.useMemo(
    () => events.filter((e) => eventInSeason(e, season)),
    [events, season]
  )

  const counters = React.useMemo(
    () => computeCounters(seasonEvents, userId, tasks, season),
    [seasonEvents, userId, tasks, season]
  )

  // 1ª carga: reavalia conquistas da temporada (cobre conclusões anteriores
  // ao reset/deploy e a virada do mês). Espera eventos E tarefas carregados
  // para os contadores baseados em tarefas.
  useEffect(() => {
    if (!userId || !tasksLoaded || eventsForUser !== userId) return
    if (reconciledRef.current) return
    reconciledRef.current = true
    void reconcileSeasonUnlocks(userId, seasonEvents, tasks).catch((err) =>
      console.error('[gamification] reconcile', err)
    )
  }, [userId, tasksLoaded, eventsForUser, seasonEvents, tasks])

  const seasonXp = React.useMemo(() => {
    const eventsXp = seasonEvents.reduce((sum, e) => sum + e.xp, 0)
    const rewardsXp = Object.keys(unlocks).reduce(
      (sum, id) => sum + (ACHIEVEMENTS_BY_ID[id]?.xpReward ?? 0),
      0
    )
    return eventsXp + rewardsXp
  }, [seasonEvents, unlocks])

  const unlockedCount = Object.keys(unlocks).length
  const level = React.useMemo(() => levelProgress(seasonXp), [seasonXp])

  const value: GamificationContextType = {
    progress,
    unlocks,
    allUnlocks: unlockDocs,
    events,
    counters,
    unlockedCount,
    totalAchievements: TOTAL_ACHIEVEMENTS,
    newAchievements: progress?.newAchievements ?? 0,
    loading,
    level,
    seasonXp,
    toasts,
    dismissToast,
    resetNew,
    settings,
    saveIcon: doSaveIcon,
    clearIcon: doClearIcon,
    saveAchievementName: doSaveAchievementName,
    saveGradient: doSaveGradient,
    savePageTheme: doSavePageTheme,
    saveCover: doSaveCover,
    saveAccent: doSaveAccent,
    saveBgZoom: doSaveBgZoom,
  }

  return (
    <GamificationContext.Provider value={value}>
      {children}
      <GamificationToasts
        toasts={toasts}
        onDismiss={dismissToast}
        gradient={{ from: settings.gradientFrom, to: settings.gradientTo }}
        icons={settings.icons}
        names={settings.names}
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
