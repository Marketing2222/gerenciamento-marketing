import type { SeasonInfo } from './seasons'

/** Tema de cor por faixa de nível — borda/brilho do card de perfil. */
export interface LevelTheme {
  key: string
  border: string
  shadow: string
  glowFrom: string
  glowTo: string
}

export function levelTheme(level: number): LevelTheme {
  if (level <= 3)
    return {
      key: 'recruta',
      border: 'border-emerald-300 dark:border-emerald-700',
      shadow: 'shadow-[0_14px_44px_-16px_rgba(16,185,129,0.55)]',
      glowFrom: '#10b981',
      glowTo: '#6ee7b7',
    }
  if (level <= 6)
    return {
      key: 'agente',
      border: 'border-sky-300 dark:border-sky-700',
      shadow: 'shadow-[0_14px_44px_-16px_rgba(14,165,233,0.55)]',
      glowFrom: '#0ea5e9',
      glowTo: '#7dd3fc',
    }
  if (level <= 9)
    return {
      key: 'elite',
      border: 'border-violet-300 dark:border-violet-700',
      shadow: 'shadow-[0_14px_44px_-16px_rgba(139,92,246,0.55)]',
      glowFrom: '#8b5cf6',
      glowTo: '#c4b5fd',
    }
  if (level === 10)
    return {
      key: 'lendario',
      border: 'border-amber-400 dark:border-amber-600',
      shadow: 'shadow-[0_14px_44px_-16px_rgba(245,158,11,0.6)]',
      glowFrom: '#f59e0b',
      glowTo: '#fcd34d',
    }
  if (level <= 12)
    return {
      key: 'celestial',
      border: 'border-cyan-300 dark:border-cyan-600',
      shadow: 'shadow-[0_14px_44px_-16px_rgba(34,211,238,0.55)]',
      glowFrom: '#22d3ee',
      glowTo: '#a5f3fc',
    }
  return {
    key: 'cosmico',
    border: 'border-rose-300 dark:border-rose-600',
    shadow: 'shadow-[0_14px_44px_-16px_rgba(244,63,94,0.55)]',
    glowFrom: '#f43f5e',
    glowTo: '#fda4af',
  }
}

/** Acentos sazonais por mês — usados no fundo "aurora" da página. */
export const SEASON_ACCENTS: Record<number, { from: string; to: string }> = {
  1: { from: '#38bdf8', to: '#e0f2fe' }, // Jan — gelo
  2: { from: '#fb7185', to: '#fce7f3' }, // Fev — rosa
  3: { from: '#34d399', to: '#d1fae5' }, // Mar — verde
  4: { from: '#f9a8d4', to: '#f5d0fe' }, // Abr — pastel
  5: { from: '#2dd4bf', to: '#ccfbf1' }, // Mai — água
  6: { from: '#facc15', to: '#fef9c3' }, // Jun — sol
  7: { from: '#fb923c', to: '#ffedd5' }, // Jul — onda
  8: { from: '#a78bfa', to: '#ede9fe' }, // Ago — ameixa
  9: { from: '#d97706', to: '#fef3c7' }, // Set — dourado/folhas
  10: { from: '#f97316', to: '#fed7aa' }, // Out — laranja
  11: { from: '#b91c1c', to: '#fecaca' }, // Nov — vinho
  12: { from: '#059669', to: '#fecaca' }, // Dez — vermelho/verde
}

export function seasonAccent(season: SeasonInfo): { from: string; to: string } {
  return SEASON_ACCENTS[season.month] ?? SEASON_ACCENTS[10]
}
