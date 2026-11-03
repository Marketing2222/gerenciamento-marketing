const LEVEL_TITLES = [
  'Recruta',
  'Aprendiz',
  'Agente',
  'Especialista',
  'Estrategista',
  'Comandante',
  'Mestre',
  'Elite',
  'Veterano',
  'Lendário',
]

const PAST_10_TITLES: Record<number, string> = {
  11: 'Mítico',
  12: 'Celestial',
  13: 'Ascendente',
  14: 'Transcendente',
  15: 'Supremo',
}

/**
 * XP necessário para cada nível (nível 1 = 0 XP) — régua MENSAL (o nível
 * zera a cada temporada/mês). Calibrada com dados reais do time:
 *   mês fraco ~1.400  = nv 7
 *   mês bom   ~3.100  = nv 15  (12/15 "fáceis" num mês decente)
 *   mês forte ~6.300  = nv 29  (um mês forte encosta no 30)
 *   nv 30 = 6.500     → possível num mês excelente; recorde ~10.100 passa folgado.
 */
export const LEVEL_THRESHOLDS: number[] = [
  // 1–15 (Supremo): degraus suaves, terminando em 3.000.
  0, 100, 220, 360, 520, 700, 900, 1120, 1360, 1600, 1850, 2100, 2370, 2670, 3000,
  // 16–20: +200 por nível.
  3200, 3400, 3600, 3800, 4000,
  // 21–30: +250 por nível.
  4250, 4500, 4750, 5000, 5250, 5500, 5750, 6000, 6250, 6500,
]

/** Após o nível 30 o limiar cresce +300, +350, +400, ... (progressão ilimitada). */
function thresholdAfter30(level: number): number {
  let xp = LEVEL_THRESHOLDS[29]
  for (let l = 31; l <= level; l++) {
    xp += 300 + 50 * (l - 31)
  }
  return xp
}

export function levelThreshold(level: number): number {
  if (level <= 1) return 0
  if (level <= 30) return LEVEL_THRESHOLDS[level - 1]
  return thresholdAfter30(level)
}

export function levelFromXp(xp: number): number {
  if (xp < 0) return 1
  let level = 1
  while (xp >= levelThreshold(level + 1)) {
    level++
    if (level > 500) break
  }
  return level
}

/** Algarismos romanos para os níveis "Supremo II, III, IV, ...". */
function toRoman(num: number): string {
  const table: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let n = num
  let out = ''
  for (const [value, symbol] of table) {
    while (n >= value) {
      out += symbol
      n -= value
    }
  }
  return out
}

/** Títulos de patente personalizados (configurações → patentes), chave = nível. */
let customRankTitles: Record<number, string> = {}

/** Aplica nomes customizados vindos das configurações (vazio volta ao padrão). */
export function applyCustomRankTitles(names: Record<string, string> | undefined): void {
  const next: Record<number, string> = {}
  for (const [k, v] of Object.entries(names ?? {})) {
    const lvl = Number(k)
    if (Number.isFinite(lvl) && typeof v === 'string' && v.trim()) next[lvl] = v.trim()
  }
  customRankTitles = next
}

/** Título padrão embutido (sem personalização). */
export function defaultTitleForLevel(level: number): string {
  if (level <= LEVEL_TITLES.length) return LEVEL_TITLES[level - 1]
  if (level <= 15) return PAST_10_TITLES[level] ?? 'Supremo'
  return `Supremo ${toRoman(level - 14)}`
}

export function titleForLevel(level: number): string {
  return customRankTitles[level] ?? defaultTitleForLevel(level)
}

export function iconForLevel(level: number): string {
  if (level <= 3) return '🌱'
  if (level <= 6) return '⚔️'
  if (level <= 9) return '🛡️'
  if (level === 10) return '👑'
  if (level === 11) return '🌟'
  if (level === 12) return '💠'
  if (level === 13) return '🔮'
  if (level === 14) return '⚜️'
  return '💫'
}

export function levelProgress(xp: number): {
  level: number
  title: string
  icon: string
  currentLevelXp: number
  nextLevelXp: number
  intoLevel: number
  percent: number
} {
  const level = levelFromXp(xp)
  const currentLevelXp = levelThreshold(level)
  const nextLevelXp = levelThreshold(level + 1)
  const intoLevel = xp - currentLevelXp
  const span = Math.max(1, nextLevelXp - currentLevelXp)
  return {
    level,
    title: titleForLevel(level),
    icon: iconForLevel(level),
    currentLevelXp,
    nextLevelXp,
    intoLevel,
    percent: Math.min(100, Math.round((intoLevel / span) * 100)),
  }
}
