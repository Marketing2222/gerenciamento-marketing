import type { AchievementUnlock, XpEvent } from './types'
import { ACHIEVEMENTS_BY_ID } from './achievements'
import { levelFromXp } from './levels'

/**
 * Temporadas contínuas: T01 = Janeiro/2026, cada mês é uma temporada
 * (dia 01 até o último dia do mês, calendário local). Nunca recomeça:
 * Janeiro/2027 = T13, Fevereiro/2027 = T14, ...
 */
export const SEASON_EPOCH = { year: 2026, month: 1 }

export interface SeasonInfo {
  key: string // '2026-10'
  number: number // 10
  label: string // 'T10'
  year: number
  month: number // 1-12
  startMs: number
  endMs: number
}

export interface SeasonSummary {
  info: SeasonInfo
  xpEarned: number
  tasksCompleted: number
  achievements: AchievementUnlock[]
  levelStart: number
  levelEnd: number
}

export function seasonNumber(year: number, month: number): number {
  return (year - SEASON_EPOCH.year) * 12 + month
}

export function seasonInfo(year: number, month: number): SeasonInfo {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const end = new Date(year, month, 0, 23, 59, 59, 999)
  const number = seasonNumber(year, month)
  return {
    key: `${year}-${String(month).padStart(2, '0')}`,
    number,
    label: `T${String(number).padStart(2, '0')}`,
    year,
    month,
    startMs: start.getTime(),
    endMs: end.getTime(),
  }
}

export function currentSeason(now: Date = new Date()): SeasonInfo {
  return seasonInfo(now.getFullYear(), now.getMonth() + 1)
}

function ts(iso: string): number {
  const v = Date.parse(iso)
  return Number.isFinite(v) ? v : NaN
}

/**
 * Resumo de todas as temporadas com atividade, da época (Jan/2026) até a
 * temporada atual (inclusive — sempre presente, mesmo sem dados).
 * Temporadas passadas nunca mudam (datas fechadas); a atual fica ao vivo.
 */
export function buildSeasonSummaries(
  events: XpEvent[],
  unlocks: Record<string, AchievementUnlock>,
  now: Date = new Date()
): SeasonSummary[] {
  const evs: { ms: number; xp: number }[] = []
  for (const e of events) {
    const ms = ts(e.completedAt)
    if (Number.isFinite(ms)) evs.push({ ms, xp: e.xp })
  }
  const unls: { ms: number; xp: number; unlock: AchievementUnlock }[] = []
  for (const u of Object.values(unlocks)) {
    const ms = ts(u.unlockedAt)
    if (!Number.isFinite(ms)) continue
    const reward = ACHIEVEMENTS_BY_ID[u.achievementId]?.xpReward ?? 0
    unls.push({ ms, xp: reward, unlock: u })
  }

  const xpAt = (ms: number): number =>
    evs.reduce((s, e) => (e.ms <= ms ? s + e.xp : s), 0) +
    unls.reduce((s, u) => (u.ms <= ms ? s + u.xp : s), 0)

  const cur = currentSeason(now)
  const months: SeasonInfo[] = []
  let y = SEASON_EPOCH.year
  let m = SEASON_EPOCH.month
  while (y < cur.year || (y === cur.year && m <= cur.month)) {
    months.push(seasonInfo(y, m))
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }

  const summaries: SeasonSummary[] = months.map((info) => {
    const inRange = (ms: number) => ms >= info.startMs && ms <= info.endMs
    const seasonEvs = evs.filter((e) => inRange(e.ms))
    const seasonUnls = unls.filter((u) => inRange(u.ms))
    return {
      info,
      xpEarned: seasonEvs.reduce((s, e) => s + e.xp, 0),
      tasksCompleted: seasonEvs.length,
      achievements: seasonUnls.map((u) => u.unlock),
      levelStart: levelFromXp(xpAt(info.startMs - 1)),
      levelEnd: levelFromXp(xpAt(info.endMs)),
    }
  })

  // Mostra só da primeira temporada com atividade até a atual;
  // sem nenhuma atividade, mostra apenas a temporada atual.
  let first = -1
  for (let i = 0; i < summaries.length; i++) {
    const s = summaries[i]
    if (s.tasksCompleted > 0 || s.achievements.length > 0) {
      first = i
      break
    }
  }
  if (first === -1) return summaries.slice(-1)
  return summaries.slice(first)
}
