import type { GamificationMessage } from './types'

type Listener = (msg: GamificationMessage) => void

const listeners = new Set<Listener>()

/**
 * Ponte simples entre a camada de dados (que registra conclusões)
 * e a camada de UI (que mostra toasts). Módulo-level de propósito:
 * DataContext e GamificationContext não têm relação de nesting.
 */
export const gamificationBus = {
  emit(msg: GamificationMessage): void {
    listeners.forEach((l) => {
      try {
        l(msg)
      } catch (err) {
        console.error('[gamification] listener error', err)
      }
    })
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
