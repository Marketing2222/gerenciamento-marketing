'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { useUser } from '@/context/UserContext'
import {
  subscribeUsers,
  subscribeTasks,
  createTask,
  updateTaskFields,
  softDeleteTask,
  restoreTask,
  permanentDeleteTask,
  emptyTrash,
  addComment,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  reorderChecklistItem,
  addAttachment,
  deleteAttachment,
  updateUser,
  createUser,
  deleteUser as firestoreDeleteUser,
  seedDatabase,
  deleteComment as firestoreDeleteComment,
} from '@/lib/firestore'
import { isFirebaseConfigured } from '@/lib/firebaseClient'
import type { Task, User } from '@/types'
import { uploadFile, uploadAvatar, uploadLogo } from '@/lib/storage'

interface NewTaskInput {
  title: string
  description?: string
  priority?: string
  status?: string
  dueDate?: string | null
  assigneeId?: string | null
  assignee?: User | null
  checklist?: { title: string }[]
  attachments?: { name: string; type: string; url: string }[]
}

interface DataContextType {
  tasks: Task[]
  users: User[]
  loaded: boolean
  // CRUD
  addTask: (input: NewTaskInput) => Promise<void>
  updateTask: (
    id: string,
    patch: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'dueDate' | 'assigneeId' | 'assignee'>>
  ) => Promise<void>
  moveToTrash: (id: string) => Promise<void>
  restore: (id: string) => Promise<void>
  deleteForever: (id: string) => Promise<void>
  clearTrash: () => Promise<void>
  // Sub-recursos
  addComment: (id: string, content: string) => Promise<void>
  removeComment: (taskId: string, commentId: string) => Promise<void>
  addCheckItem: (id: string, title: string) => Promise<void>
  toggleCheck: (id: string, itemId: string, completed: boolean) => Promise<void>
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
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
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
    return () => {
      active = false
      unsubUsers()
      unsubTasks()
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
    async (id: string, patch: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'dueDate' | 'assigneeId' | 'assignee'>>) => {
      let resolvedPatch: Parameters<typeof updateTaskFields>[1] = { ...patch }
      if (patch.assigneeId !== undefined) {
        const found = users.find((u) => u.id === patch.assigneeId)
        resolvedPatch = { ...patch, assignee: found || null }
      }
      await updateTaskFields(id, resolvedPatch)
    },
    [users]
  )

  const moveToTrash = useCallback(async (id: string) => {
    await softDeleteTask(id)
  }, [])

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

  const value: DataContextType = {
    tasks: resolvedTasks,
    users,
    loaded,
    addTask,
    updateTask,
    moveToTrash,
    restore,
    deleteForever,
    clearTrash,
    addComment: addCommentToTask,
    removeComment,
    addCheckItem,
    toggleCheck,
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