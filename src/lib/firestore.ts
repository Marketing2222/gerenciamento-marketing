import { db, isFirebaseConfigured } from '@/lib/firebaseClient'
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  Timestamp,
} from 'firebase/firestore'
import type { User, Task, ChecklistItem, Attachment, Comment, ActivityLog } from '@/types'

// ===== Helpers =====

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

function toIso(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  if (typeof value === 'string') return value
  if (typeof value === 'number') return new Date(value).toISOString()
  return null
}

interface FireDoc {
  id: string
  data(): Record<string, unknown>
  exists(): boolean
}

function toStr(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function toArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function toObj<T>(v: unknown): T | null {
  return v && typeof v === 'object' ? (v as T) : null
}

function toTaskData(d: FireDoc): Task {
  const docData = d.data()
  return {
    id: d.id,
    title: toStr(docData.title),
    description: toStr(docData.description),
    priority: toStr(docData.priority, 'MEDIUM'),
    status: toStr(docData.status, 'TODO'),
    dueDate: toIso(docData.dueDate),
    createdAt: toIso(docData.createdAt) || '',
    deletedAt: toIso(docData.deletedAt),
    assigneeId: docData.assigneeId ? toStr(docData.assigneeId) : null,
    creatorId: docData.creatorId ? toStr(docData.creatorId) : null,
    assignee: toObj<User>(docData.assignee),
    creator: toObj<User>(docData.creator),
    checklist: toArray<ChecklistItem>(docData.checklist),
    attachments: toArray<Attachment>(docData.attachments),
    comments: toArray<Comment>(docData.comments),
    activityLogs: toArray<ActivityLog>(docData.activityLogs),
  }
}

function toUserData(d: FireDoc): User {
  const docData = d.data()
  return {
    id: d.id,
    name: toStr(docData.name),
    role: toStr(docData.role),
    avatarUrl: toStr(docData.avatarUrl),
  }
}

function usersCol() {
  return collection(db(), 'users')
}
function tasksCol() {
  return collection(db(), 'tasks')
}
function taskDoc(id: string) {
  return doc(db(), 'tasks', id)
}

// ===== Assinaturas em tempo real =====

export function subscribeUsers(callback: (users: User[]) => void): () => void {
  if (!isFirebaseConfigured()) {
    callback([])
    return () => {}
  }
  const q = query(usersCol())
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => toUserData(d as unknown as FireDoc)))
  })
}

export function subscribeTasks(callback: (tasks: Task[]) => void): () => void {
  if (!isFirebaseConfigured()) {
    callback([])
    return () => {}
  }
  const q = query(tasksCol())
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => toTaskData(d as unknown as FireDoc)))
  })
}

// ===== Escritas - Usuários =====

export async function createUser(input: {
  name: string
  role: string
  avatarUrl?: string
  pin?: string
}): Promise<User> {
  const id = generateId()
  await setDoc(doc(usersCol(), id), {
    name: input.name,
    role: input.role,
    avatarUrl: input.avatarUrl || '',
    pin: input.pin || '',
  })
  return { id, name: input.name, role: input.role, avatarUrl: input.avatarUrl || '' }
}

export async function updateUser(
  id: string,
  patch: { name?: string; role?: string; avatarUrl?: string; pin?: string }
): Promise<void> {
  const partial: Record<string, unknown> = {}
  if (patch.name !== undefined) partial.name = patch.name
  if (patch.role !== undefined) partial.role = patch.role
  if (patch.avatarUrl !== undefined) partial.avatarUrl = patch.avatarUrl
  if (patch.pin !== undefined) partial.pin = patch.pin
  await updateDoc(doc(usersCol(), id), partial)
}

// ===== Tarefas =====

export async function createTask(input: {
  title: string
  description?: string
  priority?: string
  status?: string
  dueDate?: string | null
  assigneeId?: string | null
  assignee?: User | null
  creator: User | null
  checklist?: { title: string }[]
  attachments?: { name: string; type: string; url: string }[]
}): Promise<void> {
  const now = Timestamp.now()
  const taskId = generateId()
  const data: Record<string, unknown> = {
    title: input.title,
    description: input.description || '',
    priority: input.priority || 'MEDIUM',
    status: input.status || 'TODO',
    createdAt: now,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    deletedAt: null,
    assigneeId: input.assigneeId || null,
    creatorId: input.creator?.id || null,
    assignee: input.assignee || null,
    creator: input.creator
      ? { id: input.creator.id, name: input.creator.name, avatarUrl: input.creator.avatarUrl, role: input.creator.role }
      : null,
    checklist: (input.checklist || []).map((c) => ({
      id: generateId(),
      title: c.title,
      isCompleted: false,
    })),
    attachments: (input.attachments || []).map((a) => ({
      id: generateId(),
      name: a.name,
      type: a.type,
      url: a.url,
      createdAt: now,
    })),
    comments: [],
    activityLogs: input.creator
      ? [
          {
            id: generateId(),
            action: 'Criou a tarefa',
            user: { id: input.creator.id, name: input.creator.name, avatarUrl: input.creator.avatarUrl, role: input.creator.role },
            createdAt: now,
          },
        ]
      : [],
  }
  await setDoc(doc(tasksCol(), taskId), data)
}

export async function updateTaskFields(
  taskId: string,
  patch: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'dueDate' | 'assigneeId' | 'assignee' | 'deletedAt'>>
): Promise<void> {
  const partial: Record<string, unknown> = {}
  if (patch.title !== undefined) partial.title = patch.title
  if (patch.description !== undefined) partial.description = patch.description
  if (patch.priority !== undefined) partial.priority = patch.priority
  if (patch.status !== undefined) partial.status = patch.status
  if (patch.dueDate !== undefined) partial.dueDate = patch.dueDate ? new Date(patch.dueDate) : null
  if (patch.assigneeId !== undefined) {
    partial.assigneeId = patch.assigneeId
    partial.assignee = patch.assignee || null
  }
  if (patch.deletedAt !== undefined) partial.deletedAt = patch.deletedAt ? new Date(patch.deletedAt) : null
  await updateDoc(taskDoc(taskId), partial)
}

export async function softDeleteTask(taskId: string): Promise<void> {
  await updateDoc(taskDoc(taskId), { deletedAt: new Date() })
}

export async function restoreTask(taskId: string): Promise<void> {
  await updateDoc(taskDoc(taskId), { deletedAt: null })
}

export async function permanentDeleteTask(taskId: string): Promise<void> {
  await deleteDoc(taskDoc(taskId))
}

export async function emptyTrash(): Promise<void> {
  const snap = await getDocs(query(tasksCol()))
  for (const d of snap.docs) {
    const docData = d.data()
    if (docData.deletedAt) {
      await deleteDoc(doc(tasksCol(), d.id))
    }
  }
}

// Lê o array atual de um sub-recurso da tarefa.
async function readList<T>(taskId: string, key: string): Promise<T[]> {
  const taskRef = taskDoc(taskId)
  const snap = await getDoc(taskRef)
  if (!snap.exists()) return []
  return (snap.data()?.[key] || []) as T[]
}

async function writeList(taskId: string, key: string, list: unknown[]): Promise<void> {
  await updateDoc(taskDoc(taskId), { [key]: list })
}

function logObj(action: string, user: User | null): ActivityLog {
  return {
    id: generateId(),
    action,
    user: { id: user?.id || '', name: user?.name || 'Sistema', avatarUrl: user?.avatarUrl || '' },
    createdAt: new Date().toISOString(),
  }
}

export async function addComment(taskId: string, content: string, user: User | null): Promise<void> {
  const current = await readList<Comment>(taskId, 'comments')
  const comment: Comment = {
    id: generateId(),
    content,
    user: user
      ? { id: user.id, name: user.name, avatarUrl: user.avatarUrl, role: user.role }
      : { id: '', name: 'Desconhecido', avatarUrl: '', role: '' },
    createdAt: new Date().toISOString(),
  }
  await writeList(taskId, 'comments', [...current, comment])
  const logs = await readList<ActivityLog>(taskId, 'activityLogs')
  await writeList(taskId, 'activityLogs', [...logs, logObj('Adicionou um comentário', user)])
}

export async function addChecklistItem(taskId: string, title: string): Promise<void> {
  const current = await readList<ChecklistItem>(taskId, 'checklist')
  await writeList(taskId, 'checklist', [...current, { id: generateId(), title, isCompleted: false }])
}

export async function toggleChecklistItem(taskId: string, itemId: string, isCompleted: boolean): Promise<void> {
  const current = await readList<ChecklistItem>(taskId, 'checklist')
  const updated = current.map((it) => (it.id === itemId ? { ...it, isCompleted } : it))
  await writeList(taskId, 'checklist', updated)
}

export async function deleteChecklistItem(taskId: string, itemId: string): Promise<void> {
  const current = await readList<ChecklistItem>(taskId, 'checklist')
  await writeList(taskId, 'checklist', current.filter((it) => it.id !== itemId))
}

export async function addAttachment(taskId: string, name: string, type: string, url: string): Promise<void> {
  const current = await readList<Attachment>(taskId, 'attachments')
  const att: Attachment = { id: generateId(), name, type, url, createdAt: new Date().toISOString() }
  await writeList(taskId, 'attachments', [...current, att])
}

export async function deleteAttachment(taskId: string, attachmentId: string): Promise<void> {
  const current = await readList<Attachment>(taskId, 'attachments')
  await writeList(taskId, 'attachments', current.filter((a) => a.id !== attachmentId))
}

// ===== Seed =====

export async function seedDatabase(currentUsers: User[], currentTasks: Task[]): Promise<{ users: User[]; tasks: string[] }> {
  for (const u of currentUsers) {
    await deleteDoc(doc(usersCol(), u.id))
  }
  for (const t of currentTasks) {
    await deleteDoc(taskDoc(t.id))
  }

  const designer = await createUser({ name: 'Lucas Mendes', role: 'DESIGNER', pin: '1234' })
  const manager = await createUser({ name: 'Thiago Silva', role: 'TRAFFIC_MANAGER', pin: '1234' })

  const taskIds: string[] = []
  const now = Timestamp.now()

  // Tarefa 1
  const t1 = generateId()
  await setDoc(doc(tasksCol(), t1), {
    title: 'Criar criativos para campanha de Dia dos Pais',
    description: '<p>Desenvolver 3 variações de criativos estáticos e 1 animação em vídeo para a campanha de Dia dos Pais.</p>',
    priority: 'HIGH',
    status: 'TODO',
    createdAt: now,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    deletedAt: null,
    assigneeId: designer.id,
    creatorId: manager.id,
    assignee: { id: designer.id, name: designer.name, role: designer.role, avatarUrl: designer.avatarUrl },
    creator: { id: manager.id, name: manager.name, role: manager.role, avatarUrl: manager.avatarUrl },
    checklist: [
      { id: generateId(), title: 'Criar conceito visual', isCompleted: false },
      { id: generateId(), title: 'Desenvolver criativos estáticos (Feed/Stories)', isCompleted: false },
      { id: generateId(), title: 'Exportar vídeo de 15s', isCompleted: false },
    ],
    attachments: [{ id: generateId(), name: 'Figma - Referências e Layouts', type: 'LINK', url: 'https://figma.com/file/exemplo', createdAt: now }],
    comments: [],
    activityLogs: [
      { id: generateId(), action: 'Criou a tarefa e atribuiu a Lucas Mendes', user: { id: manager.id, name: manager.name, avatarUrl: manager.avatarUrl, role: manager.role }, createdAt: now },
    ],
  })
  taskIds.push(t1)

  // Tarefa 2
  const t2 = generateId()
  await setDoc(doc(tasksCol(), t2), {
    title: 'Subir campanha de tráfego pago - Lançamento Produto X',
    description: '<p>Configurar conjuntos de anúncios no Meta Ads e Google Ads com foco em conversão para a landing page.</p>',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    createdAt: now,
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    deletedAt: null,
    assigneeId: manager.id,
    creatorId: designer.id,
    assignee: { id: manager.id, name: manager.name, role: manager.role, avatarUrl: manager.avatarUrl },
    creator: { id: designer.id, name: designer.name, role: designer.role, avatarUrl: designer.avatarUrl },
    checklist: [
      { id: generateId(), title: 'Configurar pixel de conversão', isCompleted: false },
      { id: generateId(), title: 'Criar públicos personalizados', isCompleted: false },
      { id: generateId(), title: 'Subir anúncios no Meta Ads', isCompleted: true },
      { id: generateId(), title: 'Subir anúncios no Google Ads', isCompleted: false },
    ],
    attachments: [{ id: generateId(), name: 'Meta Ads Manager', type: 'LINK', url: 'https://adsmanager.facebook.com', createdAt: now }],
    comments: [],
    activityLogs: [
      { id: generateId(), action: 'Criou a tarefa', user: { id: designer.id, name: designer.name, avatarUrl: designer.avatarUrl, role: designer.role }, createdAt: now },
      { id: generateId(), action: 'Alterou o status para Em Andamento', user: { id: manager.id, name: manager.name, avatarUrl: manager.avatarUrl, role: manager.role }, createdAt: now },
    ],
  })
  taskIds.push(t2)

  // Tarefa 3
  const t3 = generateId()
  await setDoc(doc(tasksCol(), t3), {
    title: 'Identidade visual do novo cliente Y',
    description: '<p>Definição de tipografia, paleta de cores primárias e secundárias, e logotipo principal do cliente Y.</p>',
    priority: 'MEDIUM',
    status: 'AWAITING_APPROVAL',
    createdAt: now,
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    deletedAt: null,
    assigneeId: designer.id,
    creatorId: designer.id,
    assignee: { id: designer.id, name: designer.name, role: designer.role, avatarUrl: designer.avatarUrl },
    creator: { id: designer.id, name: designer.name, role: designer.role, avatarUrl: designer.avatarUrl },
    checklist: [
      { id: generateId(), title: 'Pesquisa de referências', isCompleted: true },
      { id: generateId(), title: 'Desenho do logo principal', isCompleted: true },
      { id: generateId(), title: 'Guia de estilo da marca', isCompleted: true },
    ],
    attachments: [],
    comments: [
      { id: generateId(), content: 'Identidade finalizada. Thiago, por favor revise para aprovação final.', user: { id: designer.id, name: designer.name, avatarUrl: designer.avatarUrl, role: designer.role }, createdAt: now },
    ],
    activityLogs: [
      { id: generateId(), action: 'Criou a tarefa e marcou como aguardando aprovação', user: { id: designer.id, name: designer.name, avatarUrl: designer.avatarUrl, role: designer.role }, createdAt: now },
    ],
  })
  taskIds.push(t3)

  return { users: [designer, manager], tasks: taskIds }
}