import { ACHIEVEMENTS } from './achievements'

/**
 * Registros OFICIAIS de temporadas anteriores à histórico real do app
 * (a gamificação só começou a computar em Ago/2026, e T06/T07 são anteriores
 * a isso). Os números foram informados por Leonardo e são autoritativos:
 * substituem o cálculo por eventos nas telas de resumo/perfil/ranking.
 * `levelEnd` é fixo — NÃO é derivado da curva de XP.
 */
export interface StoredSeasonRecord {
  /** Dono do registro (só Leonardo tem temporadas oficiais). */
  uid: string
  /** Número da temporada (T06 = 6 → Jun/2026). */
  season: number
  /** XP ganho na temporada. */
  xp: number
  /** Tarefas concluídas na temporada. */
  tasks: number
  /** Conquistas desbloqueadas (escolhidas) na temporada. */
  achievementIds: string[]
  /** Nível final registrado (ex.: T10 fecha no 29). */
  levelEnd: number
}

/** Leonardo Araujo — dono dos registros de T06–T10. */
export const HISTORY_OWNER_ID = '8d97e0ce-7ca8-43ad-87d8-7c012d5dc77f'

const ALL_IDS = ACHIEVEMENTS.map((a) => a.id)

/** Conquistas fora da lista = não conquistadas naquela temporada. */
function pick(excluded: string[]): string[] {
  const out = new Set(excluded)
  return ALL_IDS.filter((id) => !out.has(id))
}

// T06–T09: registros anteriores ao app (informados por Leonardo) — deixa de
// fora as 5 coleções de raridade + Complecionista e as duas lendárias mais
// difíceis (T07/T09 ainda sem Combo x15; T07 sem Imbatível).
const T06_EXCLUDED = [
  'completionist',
  'comunista',
  'raros_mesmo',
  'epic_games',
  'eu_sou_a_lenda',
  'day_25',
  'resolve_toca',
]
const T07_EXCLUDED = [...T06_EXCLUDED, 'streak_30', 'early_50']
const T09_EXCLUDED = [...T06_EXCLUDED, 'streak_30']
// T10: baseado nos 42 desbloqueios REAIS de Out/2026 (todos incluídos) + a
// 43ª escolhida (sprint_final — ele trabalhou na última sexta útil de out).
const T10_EXCLUDED = [
  'completionist',
  'comunista',
  'epic_games',
  'eu_sou_a_lenda',
  'day_25',
  'no_deadline_10',
]

export const STORED_SEASONS: StoredSeasonRecord[] = [
  { uid: HISTORY_OWNER_ID, season: 6, xp: 9700, tasks: 59, achievementIds: pick(T06_EXCLUDED), levelEnd: 27 },
  { uid: HISTORY_OWNER_ID, season: 7, xp: 8700, tasks: 52, achievementIds: pick(T07_EXCLUDED), levelEnd: 25 },
  { uid: HISTORY_OWNER_ID, season: 8, xp: 9995, tasks: 63, achievementIds: pick(T06_EXCLUDED), levelEnd: 28 },
  { uid: HISTORY_OWNER_ID, season: 9, xp: 9915, tasks: 62, achievementIds: pick(T09_EXCLUDED), levelEnd: 28 },
  { uid: HISTORY_OWNER_ID, season: 10, xp: 10110, tasks: 65, achievementIds: pick(T10_EXCLUDED), levelEnd: 29 },
]

/** Registro oficial de uma temporada para um usuário (ou null). */
export function storedSeasonFor(
  uid: string | null | undefined,
  season: number
): StoredSeasonRecord | null {
  if (!uid) return null
  return STORED_SEASONS.find((r) => r.uid === uid && r.season === season) ?? null
}

/** Todos os registros oficiais de um usuário (T06–T10 de Leonardo). */
export function storedSeasonsFor(uid: string | null | undefined): StoredSeasonRecord[] {
  if (!uid) return []
  return STORED_SEASONS.filter((r) => r.uid === uid)
}

/** Número da temporada → ano/mês (época T01 = Janeiro/2026). */
export function seasonInfoFromNumber(n: number): { year: number; month: number } {
  const idx = n - 1
  return { year: 2026 + Math.floor(idx / 12), month: (idx % 12) + 1 }
}
