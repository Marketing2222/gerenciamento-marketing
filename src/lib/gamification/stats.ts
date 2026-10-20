import { ACHIEVEMENTS_BY_ID } from './achievements'
import { eventInSeason, isUnlockInSeason, type SeasonInfo } from './seasons'
import type { Achievement, AchievementUnlock, XpEvent } from './types'

/** Histórico visível do ranking/perfil começa na T08 (Ago/2026). */
export const FIRST_AVAILABLE_SEASON = 8

export const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export interface SeasonStats {
  /** XP da temporada (eventos + recompensas de conquistas deduplicadas). */
  xp: number
  unlockedIds: string[]
  achievements: Achievement[]
}

/** Agrega eventos e desbloqueios de um usuário para UMA temporada. */
export function computeSeasonStats(
  events: XpEvent[],
  unlocks: Record<string, AchievementUnlock>,
  season: SeasonInfo
): SeasonStats {
  const eventsXp = events
    .filter((e) => eventInSeason(e, season))
    .reduce((sum, e) => sum + e.xp, 0)

  const ids = new Set<string>()
  let rewardsXp = 0
  for (const [docId, unlock] of Object.entries(unlocks)) {
    if (!isUnlockInSeason(docId, unlock.unlockedAt, season)) continue
    if (ids.has(unlock.achievementId)) continue
    ids.add(unlock.achievementId)
    rewardsXp += ACHIEVEMENTS_BY_ID[unlock.achievementId]?.xpReward ?? 0
  }

  const achievements = [...ids]
    .map((id) => ACHIEVEMENTS_BY_ID[id])
    .filter((a): a is Achievement => Boolean(a))

  return { xp: eventsXp + rewardsXp, unlockedIds: [...ids], achievements }
}
