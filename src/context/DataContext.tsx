'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { useUser } from '@/context/UserContext'
import {
  subscribeUsers,
  subscribeTasks,
  subscribeRoles,
  subscribeQuickLinks,
  subscribeQuickLinkCategories,
  createTask,
  updateTaskFields,
  updateTaskOrders as firestoreUpdateTaskOrders,
  softDeleteTask,
  restoreTask,
  permanentDeleteTask,
  emptyTrash,
  addComment,
  addChecklistItem,
  toggleChecklistItem,
  renameChecklistItem,
  deleteChecklistItem,
  reorderChecklistItem,
  addAttachment,
  deleteAttachment,
  updateUser,
  createUser,
  deleteUser as firestoreDeleteUser,
  seedDatabase,
  deleteComment as firestoreDeleteComment,
  addRole as firestoreAddRole,
  updateRole as firestoreUpdateRole,
  deleteRole as firestoreDeleteRole,
  addQuickLink as firestoreAddQuickLink,
  updateQuickLink as firestoreUpdateQuickLink,
  deleteQuickLink as firestoreDeleteQuickLink,
  reorderQuickLinks as firestoreReorderQuickLinks,
  addQuickLinkCategory as firestoreAddQuickLinkCategory,
  updateQuickLinkCategory as firestoreUpdateQuickLinkCategory,
  deleteQuickLinkCategory as firestoreDeleteQuickLinkCategory,
} from '@/lib/firestore'
import { isFirebaseConfigured } from '@/lib/firebaseClient'
import { useColumns } from '@/context/ColumnsContext'
import { recordConclusion } from '@/lib/gamification/store'
import { resolveContentCategory } from '@/lib/gamification/engine'
import type { ContentCategory } from '@/lib/gamification/types'
import type { Task, User } from '@/types'
import type { Role, QuickLink, QuickLinkCategory } from '@/lib/firestore'
import { uploadFile, uploadAvatar, uploadLogo } from '@/lib/storage'

interface NewTaskInput {
  title: string
  description?: string
  priority?: string
  status?: string
  dueDate?: string | null
  assigneeId?: string | null
  assignee?: User | null
  isFixed?: boolean
  checklist?: { title: string }[]
  attachments?: { name: string; type: string; url: string }[]
}

interface DataContextType {
  tasks: Task[]
  users: User[]
  roles: Role[]
  quickLinks: QuickLink[]
  quickLinkCategories: QuickLinkCategory[]
  loaded: boolean
  // CRUD
  addTask: (input: NewTaskInput) => Promise<void>
  updateTask: (
    id: string,
    patch: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'dueDate' | 'assigneeId' | 'assignee'>>
  ) => Promise<void>
  updateTaskOrders: (updates: { id: string; order: number }[]) => Promise<void>
  moveToTrash: (id: string) => Promise<void>
  restore: (id: string) => Promise<void>
  deleteForever: (id: string) => Promise<void>
  clearTrash: () => Promise<void>
  // Sub-recursos
  addComment: (id: string, content: string) => Promise<void>
  removeComment: (taskId: string, commentId: string) => Promise<void>
  addCheckItem: (id: string, title: string) => Promise<void>
  toggleCheck: (id: string, itemId: string, completed: boolean) => Promise<void>
  renameCheckItem: (id: string, itemId: string, title: string) => Promise<void>
  removeCheckItem: (id: string, itemId: string) => Promise<void>
  reorderChecklist: (id: string, sourceIndex: number, destIndex: number) => Promise<void>
  addFileAttachment: (id: string, name: string, type: string, url: string) => Promise<void>
  removeAttachment: (id: string, attachmentId: string) => Promise<void>
  // Usuários / uploads / seed
  saveProfile: (id: string, patch: { name?: string; role?: string; avatarUrl?: string; pin?: string }) => Promise<void>
  addUser: (input: { name: string; role: string; avatarUrl?: string; pin?: string }) => Promise<void>
  removeUser: (id: string) => Promise<void>
  uploadAvatar: (file: File) => Promise<string>
  uploadGeneral: (file: File) => Promise<string>
  uploadLogo: (file: File) => Promise<string>
  seed: () => Promise<void>
  addRole: (name: string) => Promise<void>
  updateRole: (id: string, name: string) => Promise<void>
  removeRole: (id: string) => Promise<void>
  addQuickLink: (name: string, url: string, iconUrl: string, categoryId: string, username: string, password: string) => Promise<void>
  updateQuickLink: (id: string, name: string, url: string, iconUrl: string, categoryId: string, username: string, password: string) => Promise<void>
  removeQuickLink: (id: string) => Promise<void>
  reorderQuickLinks: (orderedIds: string[]) => Promise<void>
  addQuickLinkCategory: (name: string) => Promise<void>
  updateQuickLinkCategory: (id: string, name: string) => Promise<void>
  removeQuickLinkCategory: (id: string) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const { columns } = useColumns()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([])
  const [quickLinkCategories, setQuickLinkCategories] = useState<QuickLinkCategory[]>([])
  const [loaded, setLoaded] = useState(false)

  // O usuário logado é capturado para ser usado dentro de callbacks.
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoaded(true)
      return
    }
    let active = true
    const unsubUsers = subscribeUsers((list) => {
      if (active) setUsers(list)
    })
    const unsubTasks = subscribeTasks((list) => {
      if (active) {
        setTasks(list)
        setLoaded(true)
      }
    })
    const unsubRoles = subscribeRoles((list) => {
      if (active) setRoles(list)
    })
    const unsubQuickLinks = subscribeQuickLinks((list) => {
      if (active) setQuickLinks(list)
    })
    const unsubQuickLinkCategories = subscribeQuickLinkCategories((list) => {
      if (active) setQuickLinkCategories(list)
    })
    return () => {
      active = false
      unsubUsers()
      unsubTasks()
      unsubRoles()
      unsubQuickLinks()
      unsubQuickLinkCategories()
    }
  }, [])

  // Resolver assignee e comment users com dados frescos da lista de usuários
  const resolvedTasks = useMemo(() => {
    return tasks.map((task) => {
      const currentAssignee = task.assigneeId
        ? users.find((u) => u.id === task.assigneeId) || task.assignee
        : task.assignee
      const resolvedComments = task.comments.map((c) => {
        const freshUser = users.find((u) => u.id === c.user.id)
        return freshUser ? { ...c, user: freshUser } : c
      })
      const resolvedLogs = task.activityLogs.map((log) => {
        const freshUser = users.find((u) => u.id === log.user.id)
        return freshUser ? { ...log, user: { ...freshUser } } : log
      })
      return { ...task, assignee: currentAssignee || null, comments: resolvedComments, activityLogs: resolvedLogs }
    })
  }, [tasks, users])

  const addTask = useCallback(async (input: NewTaskInput) => {
    await createTask({ ...input, creator: user })
  }, [user])

  const updateTask = useCallback(
    async (id: string, patch: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'dueDate' | 'assigneeId' | 'assignee' | 'isFixed'>>) => {
      let resolvedPatch: Parameters<typeof updateTaskFields>[1] = { ...patch }
      if (patch.assigneeId !== undefined) {
        const found = users.find((u) => u.id === patch.assigneeId)
        resolvedPatch = { ...patch, assignee: found || null }
      }

      const prevTask = tasks.find((t) => t.id === id)
      const prevStatus = prevTask?.status
      const willComplete = patch.status === 'DONE' && prevStatus !== 'DONE' && prevTask !== undefined

      await updateTaskFields(id, resolvedPatch)

      if (willComplete && prevTask && user) {
        // Gamificação: dispara em fire-and-forget — nunca bloqueia/derruba a mutação.
        const prevColumnTitle = columns.find((c) => c.id === prevStatus)?.title
        let contentCategory: ContentCategory = prevColumnTitle ? resolveContentCategory(prevColumnTitle) : 'geral'
        if (contentCategory === 'geral') contentCategory = resolveContentCategory(prevTask.title)
        void recordConclusion(
          {
            userId: user.id,
            taskId: id,
            priority: prevTask.priority,
            dueDate: prevTask.dueDate,
            createdAt: prevTask.createdAt,
            title: prevTask.title,
            assigneeId: prevTask.assigneeId,
            creatorId: prevTask.creatorId,
            checklistTotal: prevTask.checklist.length,
            checklistDone: prevTask.checklist.filter((c) => c.isCompleted).length,
            contentCategory,
          },
          tasks
        ).catch((err) => console.error('[gamification] recordConclusion', err))
      }
    },
    [users, tasks, columns, user]
  )

  const updateTaskOrders = useCallback(async (updates: { id: string; order: number }[]) => {
    await firestoreUpdateTaskOrders(updates)
  }, [])

  const moveToTrash = useCallback(async (id: string) => {
    await softDeleteTask(id, user?.id ?? null)
  }, [user])

  const restore = useCallback(async (id: string) => {
    await restoreTask(id)
  }, [])

  const deleteForever = useCallback(async (id: string) => {
    await permanentDeleteTask(id)
  }, [])

  const clearTrash = useCallback(async () => {
    await emptyTrash()
  }, [])

  const addCommentToTask = useCallback(
    async (id: string, content: string) => {
      await addComment(id, content, user)
    },
    [user]
  )

  const addCheckItem = useCallback(async (id: string, title: string) => {
    await addChecklistItem(id, title)
  }, [])

  const toggleCheck = useCallback(async (id: string, itemId: string, completed: boolean) => {
    await toggleChecklistItem(id, itemId, completed)
  }, [])

  const removeCheckItem = useCallback(async (id: string, itemId: string) => {
    await deleteChecklistItem(id, itemId)
  }, [])

  const renameCheckItem = useCallback(async (id: string, itemId: string, title: string) => {
    await renameChecklistItem(id, itemId, title)
  }, [])

  const reorderChecklist = useCallback(async (id: string, sourceIndex: number, destIndex: number) => {
    await reorderChecklistItem(id, sourceIndex, destIndex)
  }, [])

  const removeComment = useCallback(async (taskId: string, commentId: string) => {
    await firestoreDeleteComment(taskId, commentId)
  }, [])

  const addAttachmentToTask = useCallback(async (id: string, name: string, type: string, url: string) => {
    await addAttachment(id, name, type, url)
  }, [])

  const removeAttachmentFromTask = useCallback(async (id: string, attachmentId: string) => {
    await deleteAttachment(id, attachmentId)
  }, [])

  const saveProfile = useCallback(async (id: string, patch: { name?: string; role?: string; avatarUrl?: string; pin?: string }) => {
    await updateUser(id, patch)
  }, [])

  const addUser = useCallback(async (input: { name: string; role: string; avatarUrl?: string; pin?: string }) => {
    await createUser(input)
  }, [])

  const removeUser = useCallback(async (id: string) => {
    await firestoreDeleteUser(id)
  }, [])

  const seed = useCallback(async () => {
    await seedDatabase(users, tasks)
  }, [users, tasks])

  const addRole = useCallback(async (name: string) => {
    await firestoreAddRole(name)
  }, [])

  const updateRole = useCallback(async (id: string, name: string) => {
    await firestoreUpdateRole(id, name)
  }, [])

  const removeRole = useCallback(async (id: string) => {
    await firestoreDeleteRole(id)
  }, [])

  const addQuickLink = useCallback(async (name: string, url: string, iconUrl: string, categoryId: string, username: string, password: string) => {
    await firestoreAddQuickLink(name, url, iconUrl, categoryId, username, password)
  }, [])

  const updateQuickLink = useCallback(async (id: string, name: string, url: string, iconUrl: string, categoryId: string, username: string, password: string) => {
    await firestoreUpdateQuickLink(id, name, url, iconUrl, categoryId, username, password)
  }, [])

  const removeQuickLink = useCallback(async (id: string) => {
    await firestoreDeleteQuickLink(id)
  }, [])

  const reorderQuickLinks = useCallback(async (orderedIds: string[]) => {
    await firestoreReorderQuickLinks(orderedIds)
  }, [])

  const addQuickLinkCategory = useCallback(async (name: string) => {
    await firestoreAddQuickLinkCategory(name)
  }, [])

  const updateQuickLinkCategory = useCallback(async (id: string, name: string) => {
    await firestoreUpdateQuickLinkCategory(id, name)
  }, [])

  const removeQuickLinkCategory = useCallback(async (id: string) => {
    await firestoreDeleteQuickLinkCategory(id)
  }, [])

  const value: DataContextType = {
    tasks: resolvedTasks,
    users,
    roles,
    quickLinks,
    quickLinkCategories,
    loaded,
    addTask,
    updateTask,
    updateTaskOrders,
    moveToTrash,
    restore,
    deleteForever,
    clearTrash,
    addComment: addCommentToTask,
    removeComment,
    addCheckItem,
    toggleCheck,
    renameCheckItem,
    removeCheckItem,
    reorderChecklist,
    addFileAttachment: addAttachmentToTask,
    removeAttachment: removeAttachmentFromTask,
    saveProfile,
    addUser,
    removeUser,
    uploadAvatar: (f) => uploadAvatar(f),
    uploadGeneral: (f) => uploadFile(f),
    uploadLogo: (f) => uploadLogo(f),
    seed,
    addRole,
    updateRole,
    removeRole,
    addQuickLink,
    updateQuickLink,
    removeQuickLink,
    reorderQuickLinks,
    addQuickLinkCategory,
    updateQuickLinkCategory,
    removeQuickLinkCategory,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}