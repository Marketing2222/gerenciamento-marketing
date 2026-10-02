import { db, isFirebaseConfigured, waitForConfig } from '@/lib/firebaseClient'
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import type { Rarity } from './types'

export interface GamificationSettings {
  gradientFrom: string
  gradientTo: string
  /** Chave de ícone → data URL (base64). Chaves: ach_*, rarity_*, rank_* */
  icons: Record<string, string>
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

export const iconKeys = {
  achievement: (id: string) => `ach_${id}`,
  rarity: (r: Rarity) => `rarity_${r}`,
  rank: (level: number) => `rank_${level}`,
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

function localGradient(): GamificationSettings {
  if (typeof window === 'undefined') {
    return { gradientFrom: DEFAULT_GRADIENT.from, gradientTo: DEFAULT_GRADIENT.to, icons: {}, ...DEFAULT_PAGE_THEME }
  }
  try {
    return {
      gradientFrom: localStorage.getItem('mkt-g-from') || DEFAULT_GRADIENT.from,
      gradientTo: localStorage.getItem('mkt-g-to') || DEFAULT_GRADIENT.to,
      icons: JSON.parse(localStorage.getItem('mkt-g-icons') || '{}'),
      transparencyEnabled: localStorage.getItem('mkt-g-transp-on') !== '0',
      transparencyColor: localStorage.getItem('mkt-g-transp-color') || DEFAULT_PAGE_THEME.transparencyColor,
      pageBg: localStorage.getItem('mkt-g-page-bg') || '',
      pageText: localStorage.getItem('mkt-g-page-text') || '',
    }
  } catch {
    return { gradientFrom: DEFAULT_GRADIENT.from, gradientTo: DEFAULT_GRADIENT.to, icons: {}, ...DEFAULT_PAGE_THEME }
  }
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
  let pageTheme = { ...DEFAULT_PAGE_THEME }

  const emit = () => callback({ gradientFrom: gradient.from, gradientTo: gradient.to, icons, ...pageTheme })

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
