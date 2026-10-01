const BASE_XP: Record<string, number> = {
  LOW: 10,
  MEDIUM: 20,
  HIGH: 35,
  URGENT: 50,
}

export const XP_ON_TIME = 10
export const XP_EARLY = 15
export const XP_THIRD_OF_DAY = 20
export const XP_FIFTH_OF_DAY = 40
export const MAX_XP_PER_TASK = 150

export function baseXpForPriority(priority: string): number {
  return BASE_XP[priority] ?? BASE_XP.MEDIUM
}

export interface DailyBonusContext {
  /** Quantas tarefas já foram concluídas hoje (antes desta). */
  alreadyToday: number
  dueResult: 'early' | 'ontime' | 'late' | 'none'
}

/**
 * XP da conclusão ao vivo. O teto evita valores absurdos em dados corrompidos.
 */
export function completionXp(priority: string, ctx: DailyBonusContext): number {
  let xp = baseXpForPriority(priority)
  if (ctx.dueResult === 'early') xp += XP_EARLY
  else if (ctx.dueResult === 'ontime') xp += XP_ON_TIME
  if (ctx.alreadyToday === 2) xp += XP_THIRD_OF_DAY
  if (ctx.alreadyToday === 4) xp += XP_FIFTH_OF_DAY
  return Math.min(xp, MAX_XP_PER_TASK)
}

/**
 * XP do backfill: apenas a base (sem bônus de prazo/dia — não havia como verificar).
 */
export function backfillXp(priority: string): number {
  return baseXpForPriority(priority)
}
