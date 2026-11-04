import { db, isFirebaseConfigured, waitForConfig } from '@/lib/firebaseClient'
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { defaultTitleForLevel } from './levels'
import type { Rarity } from './types'

export interface GamificationSettings {
  gradientFrom: string
  gradientTo: string
  /** Chave de ícone → data URL (base64). Chaves: ach_*, rarity_*, rank_*, xp */
  icons: Record<string, string>
  /** Nome customizado de conquista (achievementId → nome). Vazio = padrão. */
  names: Record<string, string>
  /** Nome customizado de patente (level como string → nome). Vazio = padrão. */
  rankNames: Record<string, string>
  /** Quantidade de patentes exibidas (mín. 15; permite adicionar acima). */
  rankCount: number
  /** Quantidade de colunas do grid de conquistas (3 ou 4). */
  achColumns: number
  /** Camada de transparência sobre a capa do perfil (conquistas). */
  transparencyEnabled: boolean
  /** Cor da transparência (ex.: #ffffff). */
  transparencyColor: string
  /** Cor de fundo da página de conquistas ('' = usar padrão do tema). */
  pageBg: string
  /** Cor dos textos da página de conquistas ('' = usar padrão do tema). */
  pageText: string
}

export const DEFAULT_GRADIENT = { from: '#f59e0b', to: '#f97316' }

export const DEFAULT_PAGE_THEME = {
  transparencyEnabled: true,
  transparencyColor: '#ffffff',
  pageBg: '',
  pageText: '',
}

/** Patentes exibidas/ganhas upload: níveis 1..15. */
export const RANK_LEVELS = 15

/** Máximo de patentes (acrescentáveis nas configurações). */
export const RANK_MAX_LEVELS = 30

/** Colunas do grid de conquistas — padrão 3 (opção de 3 ou 4 nas configurações). */
export const ACH_COLUMNS_DEFAULT = 3

function clampAchColumns(n: unknown): number {
  return n === 4 ? 4 : ACH_COLUMNS_DEFAULT
}

export const iconKeys = {
  achievement: (id: string) => `ach_${id}`,
  rarity: (r: Rarity) => `rarity_${r}`,
  rank: (level: number) => `rank_${level}`,
  xp: 'xp_icon',
}

async function settingsRef() {
  return doc(await db(), 'gamification_settings', 'global')
}
async function iconsCol() {
  return collection(await db(), 'gamification_settings', 'global', 'icons')
}
async function iconRef(key: string) {
  return doc(await db(), 'gamification_settings', 'global', 'icons', key)
}

function clampRankCount(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : RANK_LEVELS
  return Math.min(RANK_MAX_LEVELS, Math.max(RANK_LEVELS, v))
}

function localGradient(): GamificationSettings {
  if (typeof window === 'undefined') {
    return { gradientFrom: DEFAULT_GRADIENT.from, gradientTo: DEFAULT_GRADIENT.to, icons: {}, names: {}, rankNames: {}, rankCount: RANK_LEVELS, achColumns: ACH_COLUMNS_DEFAULT, ...DEFAULT_PAGE_THEME }
  }
  try {
    return {
      gradientFrom: localStorage.getItem('mkt-g-from') || DEFAULT_GRADIENT.from,
      gradientTo: localStorage.getItem('mkt-g-to') || DEFAULT_GRADIENT.to,
      icons: JSON.parse(localStorage.getItem('mkt-g-icons') || '{}'),
      names: JSON.parse(localStorage.getItem('mkt-g-names') || '{}'),
      rankNames: JSON.parse(localStorage.getItem('mkt-g-rank-names') || '{}'),
      rankCount: clampRankCount(Number(localStorage.getItem('mkt-g-rank-count') || RANK_LEVELS)),
      achColumns: clampAchColumns(Number(localStorage.getItem('mkt-g-ach-cols') || ACH_COLUMNS_DEFAULT)),
      transparencyEnabled: localStorage.getItem('mkt-g-transp-on') !== '0',
      transparencyColor: localStorage.getItem('mkt-g-transp-color') || DEFAULT_PAGE_THEME.transparencyColor,
      pageBg: localStorage.getItem('mkt-g-page-bg') || '',
      pageText: localStorage.getItem('mkt-g-page-text') || '',
    }
  } catch {
    return { gradientFrom: DEFAULT_GRADIENT.from, gradientTo: DEFAULT_GRADIENT.to, icons: {}, names: {}, rankNames: {}, rankCount: RANK_LEVELS, achColumns: ACH_COLUMNS_DEFAULT, ...DEFAULT_PAGE_THEME }
  }
}

/** Nome exibido da conquista (customizado nas configurações, senão o padrão). */
export function achievementName(a: { id: string; name: string }, names?: Record<string, string>): string {
  const custom = names?.[a.id]?.trim()
  return custom || a.name
}

/**
 * Assina documento de gradiente + subcoleção de ícones e emite um único objeto.
 * Cada ícone é um doc próprio (data URL de ~30–80 KB) para não estourar o
 * limite de 1 MB por documento do Firestore.
 */
export function subscribeSettings(callback: (s: GamificationSettings) => void): () => void {
  if (!isFirebaseConfigured()) {
    callback(localGradient())
    return () => {}
  }
  let unsubSettings: (() => void) | null = null
  let unsubIcons: (() => void) | null = null
  let gradient = { ...DEFAULT_GRADIENT }
  let icons: Record<string, string> = {}
  let names: Record<string, string> = {}
  let rankNames: Record<string, string> = {}
  let rankCount = RANK_LEVELS
  let achColumns = ACH_COLUMNS_DEFAULT
  let pageTheme = { ...DEFAULT_PAGE_THEME }

  const emit = () => callback({ gradientFrom: gradient.from, gradientTo: gradient.to, icons, names, rankNames, rankCount, achColumns, ...pageTheme })

  void (async () => {
    waitForConfig()
    unsubSettings = onSnapshot(await settingsRef(), (snap) => {
      const d = snap.exists() ? snap.data() : null
      gradient = {
        from: typeof d?.gradientFrom === 'string' ? d.gradientFrom : DEFAULT_GRADIENT.from,
        to: typeof d?.gradientTo === 'string' ? d.gradientTo : DEFAULT_GRADIENT.to,
      }
      pageTheme = {
        transparencyEnabled: typeof d?.transparencyEnabled === 'boolean' ? d.transparencyEnabled : DEFAULT_PAGE_THEME.transparencyEnabled,
        transparencyColor: typeof d?.transparencyColor === 'string' ? d.transparencyColor : DEFAULT_PAGE_THEME.transparencyColor,
        pageBg: typeof d?.pageBg === 'string' ? d.pageBg : '',
        pageText: typeof d?.pageText === 'string' ? d.pageText : '',
      }
      names = {}
      if (d?.customNames && typeof d.customNames === 'object') {
        for (const [id, n] of Object.entries(d.customNames as Record<string, unknown>)) {
          if (typeof n === 'string' && n.trim()) names[id] = n
        }
      }
      rankNames = {}
      if (d?.customRankNames && typeof d.customRankNames === 'object') {
        for (const [lvl, n] of Object.entries(d.customRankNames as Record<string, unknown>)) {
          if (typeof n === 'string' && n.trim()) rankNames[lvl] = n
        }
      }
      rankCount = clampRankCount(d?.rankCount)
      achColumns = clampAchColumns(d?.achColumns)
      emit()
    })
    unsubIcons = onSnapshot(await iconsCol(), (snap) => {
      icons = {}
      snap.docs.forEach((d) => {
        const url = d.data().url
        if (typeof url === 'string' && url) icons[d.id] = url
      })
      emit()
    })
  })()

  return () => {
    unsubSettings?.()
    unsubIcons?.()
  }
}

export async function saveGradient(from: string, to: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mkt-g-from', from)
    localStorage.setItem('mkt-g-to', to)
  }
  if (!isFirebaseConfigured()) return
  waitForConfig()
  await setDoc(await settingsRef(), { gradientFrom: from, gradientTo: to }, { merge: true })
}

export interface PageThemePatch {
  transparencyEnabled?: boolean
  transparencyColor?: string
  pageBg?: string
  pageText?: string
}

export async function savePageTheme(patch: PageThemePatch): Promise<void> {
  if (typeof window !== 'undefined') {
    if (patch.transparencyEnabled !== undefined) localStorage.setItem('mkt-g-transp-on', patch.transparencyEnabled ? '1' : '0')
    if (patch.transparencyColor !== undefined) localStorage.setItem('mkt-g-transp-color', patch.transparencyColor)
    if (patch.pageBg !== undefined) localStorage.setItem('mkt-g-page-bg', patch.pageBg)
    if (patch.pageText !== undefined) localStorage.setItem('mkt-g-page-text', patch.pageText)
  }
  if (!isFirebaseConfigured()) return
  waitForConfig()
  await setDoc(await settingsRef(), patch, { merge: true })
}

export async function saveIcon(key: string, url: string): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const icons = JSON.parse(localStorage.getItem('mkt-g-icons') || '{}')
      icons[key] = url
      localStorage.setItem('mkt-g-icons', JSON.stringify(icons))
    } catch {
      /* ignore */
    }
  }
  if (!isFirebaseConfigured()) return
  waitForConfig()
  await setDoc(await iconRef(key), { url, updatedAt: new Date().toISOString() })
}

export async function clearIcon(key: string): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const icons = JSON.parse(localStorage.getItem('mkt-g-icons') || '{}')
      delete icons[key]
      localStorage.setItem('mkt-g-icons', JSON.stringify(icons))
    } catch {
      /* ignore */
    }
  }
  if (!isFirebaseConfigured()) return
  waitForConfig()
  await deleteDoc(await iconRef(key))
}

/** Salva nome customizado de conquista ('' volta ao nome padrão). */
export async function saveAchievementName(id: string, name: string): Promise<void> {
  const clean = name.trim()
  if (typeof window !== 'undefined') {
    try {
      const names = JSON.parse(localStorage.getItem('mkt-g-names') || '{}')
      if (clean) names[id] = clean
      else delete names[id]
      localStorage.setItem('mkt-g-names', JSON.stringify(names))
    } catch {
      /* ignore */
    }
  }
  if (!isFirebaseConfigured()) return
  waitForConfig()
  await setDoc(await settingsRef(), { customNames: { [id]: clean } }, { merge: true })
}

/** Salva nome customizado de patente ('' volta ao nome padrão). */
export async function saveRankName(level: number, name: string): Promise<void> {
  const clean = name.trim()
  const key = String(level)
  if (typeof window !== 'undefined') {
    try {
      const rankNames = JSON.parse(localStorage.getItem('mkt-g-rank-names') || '{}')
      if (clean) rankNames[key] = clean
      else delete rankNames[key]
      localStorage.setItem('mkt-g-rank-names', JSON.stringify(rankNames))
    } catch {
      /* ignore */
    }
  }
  if (!isFirebaseConfigured()) return
  waitForConfig()
  await setDoc(await settingsRef(), { customRankNames: { [key]: clean } }, { merge: true })
}

/** Salva a quantidade de patentes exibidas (mín. 15, máx. RANK_MAX_LEVELS). */
export async function saveRankCount(count: number): Promise<void> {
  const clean = clampRankCount(count)
  if (typeof window !== 'undefined') {
    localStorage.setItem('mkt-g-rank-count', String(clean))
  }
  if (!isFirebaseConfigured()) return
  waitForConfig()
  await setDoc(await settingsRef(), { rankCount: clean }, { merge: true })
}

/** Salva a quantidade de colunas do grid de conquistas (3 ou 4). */
export async function saveAchievementsColumns(columns: number): Promise<void> {
  const clean = clampAchColumns(columns)
  if (typeof window !== 'undefined') {
    localStorage.setItem('mkt-g-ach-cols', String(clean))
  }
  if (!isFirebaseConfigured()) return
  waitForConfig()
  await setDoc(await settingsRef(), { achColumns: clean }, { merge: true })
}

/** Nome exibido da patente (customizado nas configurações, senão o padrão). */
export function rankTitle(level: number, rankNames?: Record<string, string>): string {
  const custom = rankNames?.[String(level)]?.trim()
  return custom || defaultTitleForLevel(level)
}
