import { ACHIEVEMENTS_BY_ID, TOTAL_ACHIEVEMENTS } from './achievements'
import { currentSeason, eventInSeason, isUnlockInSeason, type SeasonInfo } from './seasons'
import { levelFromXp } from './levels'
import { storedSeasonFor } from './pastSeasons'
import type { Achievement, AchievementUnlock, XpEvent } from './types'

/** Histórico visível do ranking/perfil começa na T06 (Jun/2026). */
export const FIRST_AVAILABLE_SEASON = 6

export const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export interface SeasonStats {
  /** XP da temporada (eventos + recompensas de conquistas deduplicadas). */
  xp: number
  unlockedIds: string[]
  achievements: Achievement[]
  /** Tarefas concluídas na temporada (eventos reais ou registro oficial). */
  tasksCompleted: number
  /** Nível final — fixo em temporadas com registro oficial (não segue o XP). */
  levelEnd: number
  /** Denominador de conquistas (a pausa/remoção só vale no mês atual). */
  total: number
  /** true = registro oficial armazenado (sem eventos detalhados). */
  stored?: boolean
}

export interface SeasonStatsOptions {
  /** Dono dos eventos — aplica os registros oficiais de temporadas antigas. */
  uid?: string | null
  /** Conquistas pausadas/removidas: não contam na temporada ATUAL. */
  inactiveIds?: ReadonlySet<string>
}

/** Agrega eventos e desbloqueios de um usuário para UMA temporada. */
export function computeSeasonStats(
  events: XpEvent[],
  unlocks: Record<string, AchievementUnlock>,
  season: SeasonInfo,
  opts: SeasonStatsOptions = {}
): SeasonStats {
  // Registro oficial (T06–T10 de Leonardo): dados fixos, sem cálculo.
  const stored = storedSeasonFor(opts.uid, season.number)
  if (stored) {
    const achievements = stored.achievementIds
      .map((id) => ACHIEVEMENTS_BY_ID[id])
      .filter((a): a is Achievement => Boolean(a))
    return {
      xp: stored.xp,
      unlockedIds: [...stored.achievementIds],
      achievements,
      tasksCompleted: stored.tasks,
      levelEnd: stored.levelEnd,
      total: TOTAL_ACHIEVEMENTS,
      stored: true,
    }
  }

  const isCurrent = season.key === currentSeason().key
  // Pausa/remoção valem só para a temporada em curso (passado é histórico fechado).
  const inactive = isCurrent ? opts.inactiveIds : undefined
  const validInactive = inactive ? [...inactive].filter((id) => ACHIEVEMENTS_BY_ID[id]).length : 0

  const seasonEvents = events.filter((e) => eventInSeason(e, season))
  const eventsXp = seasonEvents.reduce((sum, e) => sum + e.xp, 0)

  const ids = new Set<string>()
  let rewardsXp = 0
  for (const [docId, unlock] of Object.entries(unlocks)) {
    if (!isUnlockInSeason(docId, unlock.unlockedAt, season)) continue
    if (ids.has(unlock.achievementId)) continue
    ids.add(unlock.achievementId)
    rewardsXp += ACHIEVEMENTS_BY_ID[unlock.achievementId]?.xpReward ?? 0
  }

  const unlockedIds = [...ids].filter((id) => !inactive?.has(id))
  const achievements = unlockedIds
    .map((id) => ACHIEVEMENTS_BY_ID[id])
    .filter((a): a is Achievement => Boolean(a))
  const xp = eventsXp + rewardsXp

  return {
    xp,
    unlockedIds,
    achievements,
    tasksCompleted: seasonEvents.length,
    levelEnd: levelFromXp(xp),
    total: TOTAL_ACHIEVEMENTS - validInactive,
  }
}
