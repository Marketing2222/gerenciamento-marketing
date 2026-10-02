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

// ===== Docs de desbloqueio com reset por temporada =====

/**
 * Doc novo: id "{YYYY-MM}_{achId}" (ex.: "2026-11_first_task").
 * Doc legado (sem prefixo): id puro = achievementId.
 */
const UNLOCK_DOC_RE = /^(\d{4}-\d{2})_(.+)$/

export function parseUnlockDocId(docId: string): { seasonKey: string | null; achievementId: string } {
  const m = UNLOCK_DOC_RE.exec(docId)
  return m ? { seasonKey: m[1], achievementId: m[2] } : { seasonKey: null, achievementId: docId }
}

export function unlockDocId(seasonKey: string, achievementId: string): string {
  return `${seasonKey}_${achievementId}`
}

export function inSeasonMs(ms: number, season: SeasonInfo): boolean {
  return Number.isFinite(ms) && ms >= season.startMs && ms <= season.endMs
}

export function eventInSeason(e: XpEvent, season: SeasonInfo): boolean {
  return inSeasonMs(ts(e.completedAt), season)
}

/**
 * O desbloqueio conta para a temporada atual?
 * - Doc prefixado: vale a temporada do prefixo (histórico imutável).
 * - Doc legado: conta se `unlockedAt` cair dentro da temporada.
 */
export function isUnlockInSeason(docId: string, unlockedAt: string, season: SeasonInfo): boolean {
  const { seasonKey } = parseUnlockDocId(docId)
  if (seasonKey) return seasonKey === season.key
  return inSeasonMs(ts(unlockedAt), season)
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
    const xpEarned =
      seasonEvs.reduce((s, e) => s + e.xp, 0) +
      seasonUnls.reduce((s, u) => s + u.xp, 0)
    return {
      info,
      xpEarned,
      tasksCompleted: seasonEvs.length,
      achievements: seasonUnls.map((u) => u.unlock),
      // Com o reset mensal, toda temporada começa no nível 1 e fecha com o
      // XP ganho na própria temporada (não acumula carreira).
      levelStart: 1,
      levelEnd: levelFromXp(xpEarned),
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
