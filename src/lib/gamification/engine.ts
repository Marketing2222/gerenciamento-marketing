import type { Achievement, Counters, ContentCategory, TaskForCounters, XpEvent } from './types'
import type { SeasonInfo } from './seasons'
import { inSeasonMs } from './seasons'
import { isNonWorkDay, isSprintDate } from './holidays'
import { parseDateOnly } from '@/lib/dates'
import { ACHIEVEMENTS, rarityCollectionTargets } from './achievements'

const VIDEO_KEYS = ['vídeo', 'video', 'reels', 'reel', 'youtube', 'tiktok', 'short', 'gravação', 'gravacao', 'roteiro de vídeo', 'roteiro de video', 'edicao', 'edição']
const POST_KEYS = ['post', 'legenda', 'carrossel', 'copy', 'blog', 'artigo', 'conteúdo', 'conteudo', 'instagram post', 'publicação', 'publicacao']
const TRAFEGO_KEYS = [
  'tráfego', 'trafego', 'anúncio', 'anuncio', 'ads', 'meta ads', 'google ads', 'campanha',
  'impulsionamento', 'lead', 'conversão', 'conversao', 'orçamento', 'orcamento',
  'mídia', 'midia', 'performance', 'funil', 'captação', 'captacao', 'remarketing', 'pixel',
  'criativo', 'landing', 'investimento', 'escala', 'cpc', 'cpm', 'roas',
]

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

/**
 * Streak com tolerância: 1 dia isolado perdido não zera a sequência;
 * 2 dias seguidos sem conclusão quebram. A âncora aceita a última
 * conclusão em hoje, ontem ou 2 dias atrás (hoje ainda pendente não
 * conta como falha — cobre a virada domingo→segunda).
 *
 * mode 'work' (Combo x7/x10/x15): domingos e feriados de São Luís são
 * transparentes — não contam na sequência e não quebram o combo (uma
 * conclusão nesses dias também não soma). A âncora pula esses dias.
 */
function computeStreak(dayKeys: Set<string>, mode: 'calendar' | 'work' = 'calendar'): number {
  if (dayKeys.size === 0) return 0
  const today = new Date()
  const excluded = (d: Date) => mode === 'work' && isNonWorkDay(d)

  // Âncora: última conclusão ainda "recente" (2 dias corridos; no modo
  // work, domingos/feriados são pulados sem consumir a tolerância de
  // 1 dia perdido — hoje pendente nunca conta como falha).
  let anchor: Date | null = null
  let missed = 0
  for (let i = 0; i <= 14; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (excluded(d)) continue
    if (dayKeys.has(localDayKey(d))) {
      anchor = d
      break
    }
    if (i === 0) continue // hoje ainda pendente não conta como falha
    missed++
    if (missed > 1) return 0
  }
  if (!anchor) return 0

  let streak = 0
  let gap = 0
  const cursor = new Date(anchor)
  while (true) {
    if (excluded(cursor)) {
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    if (dayKeys.has(localDayKey(cursor))) {
      streak++
      gap = 0
    } else {
      gap++
      if (gap > 1) break
    }
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

/** Converte data em execução (string ISO, epoch ou Timestamp) para ms. */
function dateMs(v: unknown): number {
  if (typeof v === 'string') {
    const t = Date.parse(v)
    return Number.isFinite(t) ? t : NaN
  }
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: unknown }).toDate === 'function') {
    const t = (v as { toDate: () => Date }).toDate().getTime()
    return Number.isFinite(t) ? t : NaN
  }
  return NaN
}

/** Título normalizado para comparação (caixa/acentos/espaços). */
function normTitle(t: string): string {
  return t.trim().toLowerCase().replace(/\s+/g, ' ')
}

const RADAR_TITLE = 'verificar indicações'

export function computeCounters(
  events: XpEvent[],
  userId: string | null,
  tasks: TaskForCounters[],
  season: SeasonInfo
): Counters {
  const category: Record<ContentCategory, number> = { video: 0, post: 0, trafego: 0, geral: 0 }
  const perDay = new Map<string, number>()
  const dayKeys = new Set<string>()
  let early = 0
  let urgentEarly = 0
  let urgentTotal = 0
  let noDeadline = 0
  let noAssignee = 0
  let otherCreator = 0
  let night = 0
  let sameDayCreate = 0
  let perfectChecklist = 0
  let lateTotal = 0
  let fastFinish = 0
  let sprintFinal = 0
  let radar = 0

  for (const e of events) {
    category[e.contentCategory]++
    // "No prazo" (mesmo dia) também progride os selos de prazo — só "late" fica de fora.
    if (e.dueResult === 'early' || e.dueResult === 'ontime') {
      early++
      if (e.priority === 'URGENT') urgentEarly++
    }
    if (e.dueResult === 'late') lateTotal++
    if (e.priority === 'URGENT') urgentTotal++
    if (!e.dueDate) noDeadline++
    if (!e.assigneeId) noAssignee++
    if (e.creatorId && userId && e.creatorId !== userId) otherCreator++

    // Resolve e Toca: criada por mim e concluída em até 24h.
    if (userId && e.creatorId === userId && !e.backfilled && e.createdAt) {
      const diff = dateMs(e.completedAt) - dateMs(e.createdAt)
      if (Number.isFinite(diff) && diff >= 0 && diff < 24 * 60 * 60 * 1000) fastFinish++
    }

    // Sprint Final: conclusão no último dia útil do mês.
    if (!e.backfilled) {
      const ms = dateMs(e.completedAt)
      if (Number.isFinite(ms) && isSprintDate(new Date(ms))) sprintFinal++
    }

    // Radar Ligado: título exato "VERIFICAR INDICAÇÕES".
    if (e.title && normTitle(e.title) === RADAR_TITLE) radar++

    if (e.backfilled) continue

    const key = dayKey(e.completedAt)
    dayKeys.add(key)
    perDay.set(key, (perDay.get(key) ?? 0) + 1)

    const completed = new Date(e.completedAt)
    const minutes = completed.getHours() * 60 + completed.getMinutes()
    // Janela 18h30–07h30 (inclui os extremos).
    if (minutes >= 18 * 60 + 30 || minutes <= 7 * 60 + 30) night++

    if (e.createdAt && dayKey(e.createdAt) === key) sameDayCreate++
    if (e.checklistTotal > 0 && e.checklistDone >= e.checklistTotal) perfectChecklist++
  }

  let perDayMax = 0
  for (const count of perDay.values()) {
    if (count > perDayMax) perDayMax = count
  }
  // Progresso das diárias mostra SÓ o dia corrente — à meia-noite zera.
  const perDayToday = perDay.get(localDayKey(new Date())) ?? 0

  // ===== Contadores baseados em tarefas (temporada) =====
  let vozAtiva = 0
  let arquiteto = 0
  let deletedTotal = 0
  let createdByMe = 0

  if (userId) {
    for (const t of tasks) {
      const createdMs = dateMs(t.createdAt)
      const createdInSeason = Number.isFinite(createdMs) && inSeasonMs(createdMs, season)

      if (createdInSeason && t.creatorId === userId) {
        createdByMe++
        // Arquiteto: descrição preenchida + checklist 100% concluído.
        if (t.description && t.description.trim() && t.checklist.length > 0) {
          if (t.checklist.every((c) => c.isCompleted === true)) arquiteto++
        }
      }

      // Pro Cesto: excluída por mim dentro da temporada.
      if (t.deletedBy === userId && t.deletedAt) {
        const delMs = dateMs(t.deletedAt)
        if (inSeasonMs(delMs, season)) deletedTotal++
      }

      // Voz Ativa: meus comentários em tarefas criadas por outras pessoas.
      if (t.creatorId && t.creatorId !== userId) {
        for (const c of t.comments) {
          if (c.user.id !== userId) continue
          const cMs = dateMs(c.createdAt)
          if (Number.isFinite(cMs) && inSeasonMs(cMs, season)) vozAtiva++
        }
      }
    }
  }

  return {
    total: events.length,
    early,
    urgentEarly,
    urgentTotal,
    perDayMax,
    perDayToday,
    streak: computeStreak(dayKeys),
    streakWork: computeStreak(dayKeys, 'work'),
    category,
    noDeadline,
    noAssignee,
    otherCreator,
    night,
    sameDayCreate,
    perfectChecklist,
    rapid: computeRapid(events),
    vozAtiva,
    arquiteto,
    sprintFinal,
    lateTotal,
    deletedTotal,
    createdByMe,
    fastFinish,
    radar,
  }
}

export function requirementProgress(a: Achievement, c: Counters): number {
  const req = a.requirement
  switch (req.type) {
    case 'total': return c.total
    case 'early': return c.early
    case 'urgent_early': return c.urgentEarly
    case 'urgent_total': return c.urgentTotal
    case 'per_day': return c.perDayToday
    case 'streak': return c.streak
    case 'streak_work': return c.streakWork
    case 'category': return c.category[req.contentCategory ?? 'geral']
    case 'no_deadline': return c.noDeadline
    case 'no_assignee': return c.noAssignee
    case 'other_creator': return c.otherCreator
    case 'night': return c.night
    case 'same_day_create': return c.sameDayCreate
    case 'perfect_checklist': return c.perfectChecklist
    case 'rapid': return c.rapid ? 1 : 0
    case 'voz_ativa': return c.vozAtiva
    case 'arquiteto': return c.arquiteto
    case 'sprint_final': return c.sprintFinal
    case 'late_total': return c.lateTotal
    case 'deleted_total': return c.deletedTotal
    case 'created_total': return c.createdByMe
    case 'fast_finish': return c.fastFinish
    case 'radar': return c.radar
    case 'rarity_all': return 0 // depende do estado de desbloqueio por raridade
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
    if (a.requirement.type === 'all' || a.requirement.type === 'rarity_all') continue
    if (isUnlocked(a, counters)) {
      unlockedNow.push(a)
      allIds.add(a.id)
    }
  }

  // Coleções de raridade: liberam quando TODAS as conquistas daquela raridade
  // (excluindo a própria coleção e o Complecionista) estiverem desbloqueadas.
  for (const a of pending) {
    if (a.requirement.type !== 'rarity_all') continue
    const targets = rarityCollectionTargets(a)
    if (targets.length > 0 && targets.every((t) => allIds.has(t.id))) {
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
  if (a.requirement.type === 'rarity_all') {
    const unlocked = new Set(unlockedIds)
    return rarityCollectionTargets(a).filter((t) => unlocked.has(t.id)).length
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
