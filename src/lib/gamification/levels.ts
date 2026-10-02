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
 * XP necessário para cada nível (nível 1 = 0 XP) até o nível 15 (Supremo).
 * Curva mensal: mês fraco ~1.500 = nv 7, mês bom ~4.000 = nv 11,
 * mês forte ~7.500 = nv 15, mês perfeito ~8.500 = nv 16.
 */
export const LEVEL_THRESHOLDS: number[] = [
  0, 100, 260, 470, 730, 1050, 1430, 1880, 2400, 3000, 3700, 4500, 5400, 6400, 7500,
]

/** Após o nível 15 o limiar cresce: +1200, +1300, +1400, ... (progressão ilimitada). */
function thresholdAfter15(level: number): number {
  let xp = LEVEL_THRESHOLDS[14]
  for (let l = 16; l <= level; l++) {
    xp += 1200 + 100 * (l - 16)
  }
  return xp
}

export function levelThreshold(level: number): number {
  if (level <= 1) return 0
  if (level <= 15) return LEVEL_THRESHOLDS[level - 1]
  return thresholdAfter15(level)
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

export function titleForLevel(level: number): string {
  if (level <= LEVEL_TITLES.length) return LEVEL_TITLES[level - 1]
  if (level <= 15) return PAST_10_TITLES[level] ?? 'Supremo'
  return `Supremo ${toRoman(level - 14)}`
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
