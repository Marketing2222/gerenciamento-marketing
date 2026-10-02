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

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

export function completionXpDetails(
  priority: string,
  ctx: DailyBonusContext
): { xp: number; details: { label: string; amount: number }[] } {
  const details: { label: string; amount: number }[] = [
    { label: `Base ${PRIORITY_LABELS[priority] ?? 'Média'}`, amount: baseXpForPriority(priority) },
  ]
  let total = baseXpForPriority(priority)

  if (ctx.dueResult === 'early') {
    details.push({ label: 'Antes do prazo', amount: XP_EARLY })
    total += XP_EARLY
  } else if (ctx.dueResult === 'ontime') {
    details.push({ label: 'No prazo', amount: XP_ON_TIME })
    total += XP_ON_TIME
  }
  if (ctx.alreadyToday === 2) {
    details.push({ label: '3ª conclusão do dia', amount: XP_THIRD_OF_DAY })
    total += XP_THIRD_OF_DAY
  }
  if (ctx.alreadyToday === 4) {
    details.push({ label: '5ª conclusão do dia', amount: XP_FIFTH_OF_DAY })
    total += XP_FIFTH_OF_DAY
  }

  return { xp: Math.min(total, MAX_XP_PER_TASK), details }
}

/**
 * XP da conclusão ao vivo. O teto evita valores absurdos em dados corrompidos.
 */
export function completionXp(priority: string, ctx: DailyBonusContext): number {
  return completionXpDetails(priority, ctx).xp
}

/**
 * XP do backfill: apenas a base (sem bônus de prazo/dia — não havia como verificar).
 */
export function backfillXp(priority: string): number {
  return baseXpForPriority(priority)
}
