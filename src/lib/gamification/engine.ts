import type { Achievement, Counters, ContentCategory, XpEvent } from './types'
import { parseDateOnly } from '@/lib/dates'
import { ACHIEVEMENTS } from './achievements'

const VIDEO_KEYS = ['vídeo', 'video', 'reels', 'reel', 'youtube', 'tiktok', 'short', 'gravação', 'gravacao', 'roteiro de vídeo', 'roteiro de video', 'edicao', 'edição']
const POST_KEYS = ['post', 'legenda', 'carrossel', 'copy', 'blog', 'artigo', 'conteúdo', 'conteudo', 'instagram post', 'publicação', 'publicacao']
const TRAFEGO_KEYS = ['tráfego', 'trafego', 'anúncio', 'anuncio', 'ads', 'meta ads', 'google ads', 'campanha', 'impulsionamento', 'lead', 'conversão', 'conversao', 'orçamento', 'orcamento']

function matchKeys(text: string, keys: string[]): boolean {
  return keys.some((k) => text.includes(k))
}

/** Mapeia o título da coluna anterior (ou o título da tarefa, em backfill) para categoria. */
export function resolveContentCategory(text: string): ContentCategory {
  const t = (text || '').toLowerCase()
  if (matchKeys(t, VIDEO_KEYS)) return 'video'
  if (matchKeys(t, TRAFEGO_KEYS)) return 'trafego'
  if (matchKeys(t, POST_KEYS)) return 'post'
  return 'geral'
}

/** Chave de dia em horário local ("YYYY-MM-DD") — evita o bug de fuso. */
function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dayKey(iso: string): string {
  return localDayKey(new Date(iso))
}

/** Streak de dias consecutivos terminando hoje ou ontem. */
function computeStreak(dayKeys: Set<string>): number {
  if (dayKeys.size === 0) return 0
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let start: Date
  if (dayKeys.has(localDayKey(today))) start = today
  else if (dayKeys.has(localDayKey(yesterday))) start = yesterday
  else return 0

  let streak = 0
  const cursor = new Date(start)
  while (true) {
    if (!dayKeys.has(localDayKey(cursor))) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** 3 conclusões dentro de uma janela de 30 minutos (somente eventos ao vivo). */
function computeRapid(events: XpEvent[]): boolean {
  const times = events
    .filter((e) => !e.backfilled)
    .map((e) => new Date(e.completedAt).getTime())
    .sort((a, b) => a - b)
  for (let i = 0; i + 2 < times.length; i++) {
    if (times[i + 2] - times[i] <= 30 * 60 * 1000) return true
  }
  return false
}

export function computeCounters(events: XpEvent[]): Counters {
  const category: Record<ContentCategory, number> = { video: 0, post: 0, trafego: 0, geral: 0 }
  const perDay = new Map<string, number>()
  const dayKeys = new Set<string>()
  let early = 0
  let urgentEarly = 0
  let urgentTotal = 0
  let noDeadline = 0
  let noAssignee = 0
  let night = 0
  let sameDayCreate = 0
  let perfectChecklist = 0

  for (const e of events) {
    category[e.contentCategory]++
    // "No prazo" (mesmo dia) também progride os selos de prazo — só "late" fica de fora.
    if (e.dueResult === 'early' || e.dueResult === 'ontime') {
      early++
      if (e.priority === 'URGENT') urgentEarly++
    }
    if (e.priority === 'URGENT') urgentTotal++
    if (!e.dueDate) noDeadline++
    if (!e.assigneeId) noAssignee++

    if (e.backfilled) continue

    const key = dayKey(e.completedAt)
    dayKeys.add(key)
    perDay.set(key, (perDay.get(key) ?? 0) + 1)

    const hour = new Date(e.completedAt).getHours()
    if (hour >= 0 && hour < 5) night++

    if (e.createdAt && dayKey(e.createdAt) === key) sameDayCreate++
    if (e.checklistTotal > 0 && e.checklistDone >= e.checklistTotal) perfectChecklist++
  }

  let perDayMax = 0
  for (const count of perDay.values()) {
    if (count > perDayMax) perDayMax = count
  }

  return {
    total: events.length,
    early,
    urgentEarly,
    urgentTotal,
    perDayMax,
    streak: computeStreak(dayKeys),
    category,
    noDeadline,
    noAssignee,
    night,
    sameDayCreate,
    perfectChecklist,
    rapid: computeRapid(events),
  }
}

export function requirementProgress(a: Achievement, c: Counters): number {
  const req = a.requirement
  switch (req.type) {
    case 'total': return c.total
    case 'early': return c.early
    case 'urgent_early': return c.urgentEarly
    case 'urgent_total': return c.urgentTotal
    case 'per_day': return c.perDayMax
    case 'streak': return c.streak
    case 'category': return c.category[req.contentCategory ?? 'geral']
    case 'no_deadline': return c.noDeadline
    case 'no_assignee': return c.noAssignee
    case 'night': return c.night
    case 'same_day_create': return c.sameDayCreate
    case 'perfect_checklist': return c.perfectChecklist
    case 'rapid': return c.rapid ? 1 : 0
    case 'all': return 0 // depende do estado de desbloqueio, não dos contadores de eventos
  }
}

export function isUnlocked(a: Achievement, c: Counters): boolean {
  return requirementProgress(a, c) >= a.requirement.value
}

/**
 * Avalia quais conquistas devem ser desbloqueadas dado o conjunto atual de
 * desbloqueios + contadores de eventos. Trata a conquista "all" (platina)
 * separadamente: só libera quando TODAS as outras estiverem desbloqueadas.
 */
export function evaluateAchievements(alreadyUnlockedIds: string[], counters: Counters): Achievement[] {
  const allIds = new Set(alreadyUnlockedIds)
  const pending = ACHIEVEMENTS.filter((a) => !allIds.has(a.id))
  const unlockedNow: Achievement[] = []

  for (const a of pending) {
    if (a.requirement.type === 'all') continue
    if (isUnlocked(a, counters)) {
      unlockedNow.push(a)
      allIds.add(a.id)
    }
  }

  const meta = pending.find((a) => a.requirement.type === 'all')
  if (meta) {
    const others = [...allIds].filter((id) => id !== meta.id).length
    if (others >= meta.requirement.value) {
      unlockedNow.push(meta)
      allIds.add(meta.id)
    }
  }

  return unlockedNow
}

/** Progresso para exibição (a platina conta as outras desbloqueadas). */
export function achievementProgress(a: Achievement, c: Counters, unlockedIds: string[]): number {
  if (a.requirement.type === 'all') {
    return unlockedIds.filter((id) => id !== a.id).length
  }
  return requirementProgress(a, c)
}

/** Comparação de datas de prazo sem depender de fuso (usa apenas a parte de data). */
export function dueResultFor(dueDate: string | null, completedAtIso: string): 'early' | 'ontime' | 'late' | 'none' {
  if (!dueDate) return 'none'
  const due = parseDateOnly(dueDate)
  if (isNaN(due.getTime())) return 'none'
  const completedKey = localDayKey(new Date(completedAtIso))
  const dueKey = localDayKey(due)
  if (completedKey < dueKey) return 'early'
  if (completedKey === dueKey) return 'ontime'
  return 'late'
}
