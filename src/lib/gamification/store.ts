import { db, isFirebaseConfigured, waitForConfig } from '@/lib/firebaseClient'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import type { AchievementUnlock, ContentCategory, UserProgress, XpEvent } from './types'
import { ACHIEVEMENTS_BY_ID } from './achievements'
import {
  achievementProgress,
  computeCounters,
  dueResultFor,
  evaluateAchievements,
  resolveContentCategory,
} from './engine'
import { backfillXp, completionXpDetails } from './xp'
import { levelFromXp, titleForLevel, iconForLevel } from './levels'
import {
  currentSeason,
  eventInSeason,
  isUnlockInSeason,
  parseUnlockDocId,
  unlockDocId,
} from './seasons'
import { gamificationBus } from './bus'

const USERS = 'gamification_users'
const META = 'gamification_meta'

// ===== Caminhos =====

async function userRef(uid: string) {
  return doc(await db(), USERS, uid)
}
async function eventsCol(uid: string) {
  return collection(await db(), USERS, uid, 'events')
}
async function eventRef(uid: string, taskId: string) {
  return doc(await db(), USERS, uid, 'events', taskId)
}
async function unlocksCol(uid: string) {
  return collection(await db(), USERS, uid, 'achievements')
}
async function unlockRef(uid: string, achId: string) {
  return doc(await db(), USERS, uid, 'achievements', achId)
}

function nowIso(): string {
  return new Date().toISOString()
}

function toProgress(uid: string, raw: Record<string, unknown>): UserProgress {
  return {
    userId: uid,
    totalXp: typeof raw.totalXp === 'number' ? raw.totalXp : 0,
    level: typeof raw.level === 'number' ? raw.level : 1,
    newAchievements: typeof raw.newAchievements === 'number' ? raw.newAchievements : 0,
    coverUrl: typeof raw.coverUrl === 'string' && raw.coverUrl ? raw.coverUrl : null,
    bgZoom: typeof raw.bgZoom === 'number' && raw.bgZoom > 0 ? raw.bgZoom : 1,
    accentFrom: typeof raw.accentFrom === 'string' && raw.accentFrom ? raw.accentFrom : null,
    accentTo: typeof raw.accentTo === 'string' && raw.accentTo ? raw.accentTo : null,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
  }
}

function toXpEvent(id: string, raw: Record<string, unknown>): XpEvent {
  return {
    id,
    taskId: typeof raw.taskId === 'string' ? raw.taskId : id,
    xp: typeof raw.xp === 'number' ? raw.xp : 0,
    priority: typeof raw.priority === 'string' ? raw.priority : 'MEDIUM',
    contentCategory: (raw.contentCategory as ContentCategory) ?? 'geral',
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : new Date(0).toISOString(),
    dueDate: typeof raw.dueDate === 'string' ? raw.dueDate : null,
    dueResult: (raw.dueResult as XpEvent['dueResult']) ?? 'none',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    assigneeId: typeof raw.assigneeId === 'string' ? raw.assigneeId : null,
    creatorId: typeof raw.creatorId === 'string' ? raw.creatorId : null,
    checklistTotal: typeof raw.checklistTotal === 'number' ? raw.checklistTotal : 0,
    checklistDone: typeof raw.checklistDone === 'number' ? raw.checklistDone : 0,
    backfilled: raw.backfilled === true,
  }
}

// ===== Assinaturas em tempo real =====

export function subscribeProgress(uid: string, callback: (p: UserProgress | null) => void): () => void {
  if (!isFirebaseConfigured()) {
    callback(null)
    return () => {}
  }
  let unsub: (() => void) | null = null
  void (async () => {
    waitForConfig()
    unsub = onSnapshot(await userRef(uid), (snap) => {
      callback(snap.exists() ? toProgress(uid, snap.data()) : null)
    })
  })()
  return () => {
    unsub?.()
  }
}

export function subscribeUnlocks(uid: string, callback: (map: Record<string, AchievementUnlock>) => void): () => void {
  if (!isFirebaseConfigured()) {
    callback({})
    return () => {}
  }
  let unsub: (() => void) | null = null
  void (async () => {
    waitForConfig()
    unsub = onSnapshot(await unlocksCol(uid), (snap) => {
      const map: Record<string, AchievementUnlock> = {}
      snap.docs.forEach((d) => {
        const raw = d.data()
        map[d.id] = {
          // Doc prefixado "{2026-10}_{achId}" → achievementId normalizado.
          achievementId: parseUnlockDocId(d.id).achievementId,
          unlockedAt: typeof raw.unlockedAt === 'string' ? raw.unlockedAt : '',
          progress: typeof raw.progress === 'number' ? raw.progress : 0,
        }
      })
      callback(map)
    })
  })()
  return () => {
    unsub?.()
  }
}

export async function resetNewAchievements(uid: string): Promise<void> {
  if (!isFirebaseConfigured()) return
  waitForConfig()
  const ref = await userRef(uid)
  const snap = await getDoc(ref)
  if (snap.exists() && (snap.data().newAchievements ?? 0) > 0) {
    await setDoc(ref, { newAchievements: 0, updatedAt: nowIso() }, { merge: true })
  }
}

/** Salva (ou remove, com null) a foto de capa do card de perfil do usuário. */
export async function saveCoverUrl(uid: string, url: string | null): Promise<void> {
  if (!isFirebaseConfigured()) return
  waitForConfig()
  const ref = await userRef(uid)
  await setDoc(ref, { coverUrl: url, updatedAt: nowIso() }, { merge: true })
}

/** Salva as cores pessoais do perfil (banner + barra de XP). */
export async function saveProfileAccent(uid: string, from: string, to: string): Promise<void> {
  if (!isFirebaseConfigured()) return
  waitForConfig()
  const ref = await userRef(uid)
  await setDoc(ref, { accentFrom: from, accentTo: to, updatedAt: nowIso() }, { merge: true })
}

/** Salva o zoom da imagem de fundo da página de conquistas. */
export async function saveProfileBgZoom(uid: string, zoom: number): Promise<void> {
  if (!isFirebaseConfigured()) return
  waitForConfig()
  const ref = await userRef(uid)
  await setDoc(ref, { bgZoom: zoom, updatedAt: nowIso() }, { merge: true })
}

export function subscribeEvents(uid: string, callback: (events: XpEvent[]) => void): () => void {
  if (!isFirebaseConfigured()) {
    callback([])
    return () => {}
  }
  let unsub: (() => void) | null = null
  void (async () => {
    waitForConfig()
    unsub = onSnapshot(await eventsCol(uid), (snap) => {
      callback(snap.docs.map((d) => toXpEvent(d.id, d.data())))
    })
  })()
  return () => {
    unsub?.()
  }
}

async function listEvents(uid: string): Promise<XpEvent[]> {
  const snap = await getDocs(await eventsCol(uid))
  return snap.docs.map((d) => toXpEvent(d.id, d.data()))
}

function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ===== Registro de conclusão (ao vivo) =====

export interface ConclusionInput {
  userId: string
  taskId: string
  priority: string
  dueDate: string | null
  createdAt: string
  assigneeId: string | null
  creatorId: string | null
  checklistTotal: number
  checklistDone: number
  contentCategory: ContentCategory
}

/**
 * Registra a conclusão de uma tarefa: XP + conquistas.
 * Dedup por doc id determinístico (taskId) em transação — XP conta 1x por tarefa.
 * Silencioso quando o evento já existir (reconclusão/edições).
 */
export async function recordConclusion(input: ConclusionInput): Promise<void> {
  if (!isFirebaseConfigured() || !input.userId || !input.taskId) return
  waitForConfig()

  const existing = await listEvents(input.userId)
  if (existing.some((e) => e.id === input.taskId)) return

  const season = currentSeason()
  const seasonEvents = existing.filter((e) => eventInSeason(e, season))
  const completedAt = nowIso()
  const dueResult = dueResultFor(input.dueDate, completedAt)
  const todayKey = localDayKey(new Date())
  const alreadyToday = seasonEvents.filter(
    (e) => !e.backfilled && localDayKey(new Date(e.completedAt)) === todayKey
  ).length

  const { xp, details } = completionXpDetails(input.priority, { alreadyToday, dueResult })
  const event: XpEvent = {
    id: input.taskId,
    taskId: input.taskId,
    xp,
    priority: input.priority,
    contentCategory: input.contentCategory,
    completedAt,
    dueDate: input.dueDate,
    dueResult,
    createdAt: input.createdAt,
    assigneeId: input.assigneeId,
    creatorId: input.creatorId,
    checklistTotal: input.checklistTotal,
    checklistDone: input.checklistDone,
    backfilled: false,
  }

  // Progresso da TEMPORADA atual: contadores, conquistas e nível zeram todo mês.
  const counters = computeCounters([...seasonEvents, event], input.userId)
  const unlocksSnap = await getDocs(await unlocksCol(input.userId))
  const currentUnlockIds = new Set<string>()
  unlocksSnap.docs.forEach((d) => {
    const unlockedAt = typeof d.data().unlockedAt === 'string' ? d.data().unlockedAt : ''
    if (isUnlockInSeason(d.id, unlockedAt, season)) {
      currentUnlockIds.add(parseUnlockDocId(d.id).achievementId)
    }
  })
  const unlockedIdList = [...currentUnlockIds]
  const newlyUnlocked = evaluateAchievements(unlockedIdList, counters)
  const achievementXp = newlyUnlocked.reduce((sum, a) => sum + a.xpReward, 0)

  // Nível da temporada: XP (eventos + recompensas) do mês atual.
  const seasonEventsXp = seasonEvents.reduce((sum, e) => sum + e.xp, 0)
  const seasonRewardsXp = unlockedIdList.reduce((sum, id) => sum + (ACHIEVEMENTS_BY_ID[id]?.xpReward ?? 0), 0)
  const seasonXpAfter = seasonEventsXp + seasonRewardsXp + xp + achievementXp
  const levelBefore = levelFromXp(seasonEventsXp + seasonRewardsXp)
  const levelAfter = levelFromXp(seasonXpAfter)

  // Holder (e não `let`) para que o TS não estreite para `never` após a transação.
  const outcome: { value: { seasonXp: number; levelBefore: number; levelAfter: number } | null } = { value: null }
  const evRef = await eventRef(input.userId, input.taskId)
  const uRef = await userRef(input.userId)

  await runTransaction(await db(), async (tx) => {
    const evSnap = await tx.get(evRef)
    if (evSnap.exists()) return

    const uSnap = await tx.get(uRef)
    const prev = uSnap.exists() ? uSnap.data() : null
    const prevTotal = typeof prev?.totalXp === 'number' ? prev.totalXp : 0
    const prevNew = typeof prev?.newAchievements === 'number' ? prev.newAchievements : 0
    const totalXp = prevTotal + xp + achievementXp

    tx.set(evRef, { ...event })
    tx.set(
      uRef,
      {
        userId: input.userId,
        totalXp,
        level: levelAfter,
        newAchievements: prevNew + newlyUnlocked.length,
        updatedAt: nowIso(),
      },
      { merge: true }
    )
    for (const a of newlyUnlocked) {
      // Doc prefixado pela temporada → o mesmo desbloqueio pode recorrer em meses seguintes.
      const aRef = await unlockRef(input.userId, unlockDocId(season.key, a.id))
      tx.set(aRef, {
        achievementId: a.id,
        unlockedAt: nowIso(),
        progress: achievementProgress(a, counters, unlockedIdList),
      })
    }
    outcome.value = { seasonXp: seasonXpAfter, levelBefore, levelAfter }
  })

  const res = outcome.value
  if (!res) return

  gamificationBus.emit({ kind: 'xp', amount: xp, totalXp: res.seasonXp, details })
  for (const a of newlyUnlocked) {
    gamificationBus.emit({ kind: 'achievement', achievement: a })
  }
  if (res.levelAfter > res.levelBefore) {
    gamificationBus.emit({
      kind: 'levelup',
      from: res.levelBefore,
      to: res.levelAfter,
      title: titleForLevel(res.levelAfter),
      icon: iconForLevel(res.levelAfter),
    })
  }
}

// ===== Reconciliação de conquistas da temporada =====

/**
 * Reavalia as conquistas da temporada atual contra os eventos já existentes.
 * Roda 1x ao carregar a página: cobre conclusões feitas antes do deploy/reset,
 * a virada do mês (eventos do dia 1º antes de qualquer nova conclusão) e
 * desbloqueios cujo doc legado pertence a outra temporada.
 * Emite toast para cada conquista escrita. Idempotente (transação re-checa).
 */
export async function reconcileSeasonUnlocks(uid: string, seasonEvents: XpEvent[]): Promise<void> {
  if (!isFirebaseConfigured() || !uid) return
  waitForConfig()

  const season = currentSeason()
  const counters = computeCounters(seasonEvents, uid)

  const unlocksSnap = await getDocs(await unlocksCol(uid))
  const freshIds = new Set<string>()
  unlocksSnap.docs.forEach((d) => {
    const raw = d.data()
    const unlockedAt = typeof raw.unlockedAt === 'string' ? raw.unlockedAt : ''
    if (isUnlockInSeason(d.id, unlockedAt, season)) freshIds.add(parseUnlockDocId(d.id).achievementId)
  })

  const pending = evaluateAchievements([...freshIds], counters)
  if (pending.length === 0) return

  const uRef = await userRef(uid)
  const holder: { written: typeof pending } = { written: [] }

  await runTransaction(await db(), async (tx) => {
    // TODAS as leituras antes de qualquer escrita (regra do Firestore).
    const uSnap = await tx.get(uRef)
    const toWrite: typeof pending = []
    for (const a of pending) {
      const aRef = await unlockRef(uid, unlockDocId(season.key, a.id))
      const snap = await tx.get(aRef)
      if (!snap.exists()) toWrite.push(a)
    }
    if (toWrite.length === 0) return

    const now = nowIso()
    for (const a of toWrite) {
      const aRef = await unlockRef(uid, unlockDocId(season.key, a.id))
      tx.set(aRef, {
        achievementId: a.id,
        unlockedAt: now,
        progress: achievementProgress(a, counters, [...freshIds]),
      })
      freshIds.add(a.id)
    }

    const seasonXp =
      seasonEvents.reduce((sum, e) => sum + e.xp, 0) +
      [...freshIds].reduce((sum, id) => sum + (ACHIEVEMENTS_BY_ID[id]?.xpReward ?? 0), 0)
    const xpSum = toWrite.reduce((sum, a) => sum + a.xpReward, 0)

    const prev = uSnap.exists() ? uSnap.data() : null
    const prevTotal = typeof prev?.totalXp === 'number' ? prev.totalXp : 0
    const prevNew = typeof prev?.newAchievements === 'number' ? prev.newAchievements : 0
    tx.set(
      uRef,
      {
        totalXp: prevTotal + xpSum,
        level: levelFromXp(seasonXp),
        newAchievements: prevNew + toWrite.length,
        updatedAt: now,
      },
      { merge: true }
    )
    holder.written = toWrite
  })

  for (const a of holder.written) {
    gamificationBus.emit({ kind: 'achievement', achievement: a })
  }
}

// ===== Backfill (rodar 1x para tarefas já concluídas) =====

/**
 * Converte campos de data do Firestore cru para ISO: aceita string, número
 * (epoch ms) ou Firestore Timestamp (duck-typed via toDate()). As tarefas
 * gravam createdAt/dueDate como Timestamp, não string.
 */
function toIsoVal(v: unknown): string | null {
  if (!v) return null
  if (typeof v === 'string') return v
  if (typeof v === 'number') return Number.isFinite(v) ? new Date(v).toISOString() : null
  if (typeof v === 'object') {
    const cand = v as { toDate?: unknown }
    if (typeof cand.toDate === 'function') {
      const d = (cand.toDate as () => Date)()
      const t = d?.getTime?.()
      return Number.isFinite(t) ? new Date(t as number).toISOString() : null
    }
  }
  return null
}

interface RawTask {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
  assigneeId: string | null
  creatorId: string | null
  checklist: { isCompleted?: boolean; completed?: boolean }[]
}

export async function runBackfillIfNeeded(): Promise<void> {
  if (!isFirebaseConfigured()) return
  waitForConfig()

  const metaRef = doc(await db(), META, 'global')
  const meta = await getDoc(metaRef)
  if (meta.exists()) return

  const tasksSnap = await getDocs(collection(await db(), 'tasks'))
  const doneTasks = tasksSnap.docs
    .map((d) => {
      const raw = d.data() as Partial<RawTask>
      return {
        id: d.id,
        title: typeof raw.title === 'string' ? raw.title : '',
        status: typeof raw.status === 'string' ? raw.status : '',
        priority: typeof raw.priority === 'string' ? raw.priority : 'MEDIUM',
        dueDate: toIsoVal(raw.dueDate),
        createdAt: toIsoVal(raw.createdAt) ?? nowIso(),
        assigneeId: typeof raw.assigneeId === 'string' ? raw.assigneeId : null,
        creatorId: typeof raw.creatorId === 'string' ? raw.creatorId : null,
        checklist: Array.isArray(raw.checklist)
          ? (raw.checklist as { isCompleted?: boolean; completed?: boolean }[])
          : [],
      } satisfies RawTask
    })
    .filter((t) => t.status === 'DONE')

  const byUser = new Map<string, RawTask[]>()
  for (const t of doneTasks) {
    const uid = t.assigneeId ?? t.creatorId
    if (!uid) continue
    const list = byUser.get(uid)
    if (list) list.push(t)
    else byUser.set(uid, [t])
  }

  for (const [uid, tasks] of byUser) {
    const existing = await listEvents(uid)
    const existingIds = new Set(existing.map((e) => e.id))
    const newEvents: XpEvent[] = tasks
      .filter((t) => !existingIds.has(t.id))
      .map((t) => ({
        id: t.id,
        taskId: t.id,
        xp: backfillXp(t.priority),
        priority: t.priority,
        contentCategory: resolveContentCategory(t.title),
        completedAt: t.createdAt,
        dueDate: t.dueDate,
        dueResult: 'none',
        createdAt: t.createdAt,
        assigneeId: t.assigneeId,
        creatorId: t.creatorId,
        checklistTotal: t.checklist.length,
        checklistDone: t.checklist.filter((c) => c.isCompleted === true || c.completed === true).length,
        backfilled: true,
      }))

    const allEvents = [...existing, ...newEvents]
    if (allEvents.length === 0) continue

    const counters = computeCounters(allEvents, uid)
    const unlocksSnap = await getDocs(await unlocksCol(uid))
    const unlockedIdList = unlocksSnap.docs.map((d) => parseUnlockDocId(d.id).achievementId)
    const newlyUnlocked = evaluateAchievements(unlockedIdList, counters)
    const allUnlockedIds = [...unlockedIdList, ...newlyUnlocked.map((a) => a.id)]

    const eventsXp = allEvents.reduce((sum, e) => sum + e.xp, 0)
    const rewardsXp = allUnlockedIds.reduce((sum, id) => sum + (ACHIEVEMENTS_BY_ID[id]?.xpReward ?? 0), 0)
    const totalXp = eventsXp + rewardsXp
    const level = levelFromXp(totalXp)

    const batch = writeBatch(await db())
    for (const e of newEvents) {
      batch.set(await eventRef(uid, e.id), { ...e })
    }
    for (const a of newlyUnlocked) {
      batch.set(await unlockRef(uid, a.id), {
        achievementId: a.id,
        unlockedAt: nowIso(),
        progress: achievementProgress(a, counters, unlockedIdList),
      })
    }
    batch.set(
      await userRef(uid),
      {
        userId: uid,
        totalXp,
        level,
        newAchievements: 0,
        updatedAt: nowIso(),
      },
      { merge: true }
    )
    await batch.commit()
  }

  await setDoc(metaRef, { backfilledAt: nowIso(), version: 1 })
}
