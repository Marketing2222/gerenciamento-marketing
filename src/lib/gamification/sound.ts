/**
 * Efeitos sonoros gerados por código (Web Audio API) — sem arquivos de áudio.
 * Volumes baixos de propósito: efeitos sutis, não intrusive.
 */

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!audioCtx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      audioCtx = new AC()
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

function blip(freq: number, at: number, dur: number, vol: number, type: OscillatorType = 'sine'): void {
  const ctx = getCtx()
  if (!ctx) return
  const t0 = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

/** XP ganho — clique curto e suave. */
export function playXpSound(): void {
  blip(660, 0, 0.1, 0.05)
}

/** Conquista desbloqueada — pequeno "pling" de duas notas. */
export function playAchievementSound(): void {
  blip(784, 0, 0.14, 0.08)
  blip(988, 0.1, 0.2, 0.08)
}

/** Level up — arpejo ascendente curto. */
export function playLevelUpSound(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((f, i) => blip(f, i * 0.08, 0.22, 0.07))
}
