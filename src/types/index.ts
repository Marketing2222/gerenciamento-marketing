export interface User {
  id: string
  name: string
  avatarUrl: string
  role: string
}

export interface ChecklistItem {
  id: string
  title: string
  isCompleted: boolean
}

export interface Attachment {
  id: string
  name: string
  type: string
  url: string
  createdAt: string
}

export interface Comment {
  id: string
  content: string
  createdAt: string
  user: User
}

export interface ActivityLog {
  id: string
  action: string
  createdAt: string
  user: {
    id: string
    name: string
    avatarUrl: string
  }
}

export interface Task {
  id: string
  title: string
  description: string
  priority: string
  status: string
  dueDate: string | null
  createdAt: string
  deletedAt: string | null
  assigneeId: string | null
  creatorId: string | null
  assignee: User | null
  creator: User | null
  checklist: ChecklistItem[]
  attachments: Attachment[]
  comments: Comment[]
  activityLogs: ActivityLog[]
}
