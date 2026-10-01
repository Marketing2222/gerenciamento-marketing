export type Rarity = 'comum' | 'rara' | 'epica' | 'lendaria'

export type AchCategory =
  | 'produtividade'
  | 'velocidade'
  | 'consistencia'
  | 'videos'
  | 'posts'
  | 'trafego'
  | 'secretas'

export type ContentCategory = 'video' | 'post' | 'trafego' | 'geral'

export type RequirementType =
  | 'total'
  | 'early'
  | 'urgent_early'
  | 'urgent_total'
  | 'per_day'
  | 'streak'
  | 'category'
  | 'no_deadline'
  | 'no_assignee'
  | 'night'
  | 'same_day_create'
  | 'perfect_checklist'
  | 'rapid'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: Rarity
  category: AchCategory
  secret: boolean
  xpReward: number
  requirement: {
    type: RequirementType
    value: number
    contentCategory?: ContentCategory
  }
}

export interface Counters {
  total: number
  early: number
  urgentEarly: number
  urgentTotal: number
  perDayMax: number
  streak: number
  category: Record<ContentCategory, number>
  noDeadline: number
  noAssignee: number
  night: number
  sameDayCreate: number
  perfectChecklist: number
  rapid: boolean
}

export interface XpEvent {
  id: string
  taskId: string
  xp: number
  priority: string
  contentCategory: ContentCategory
  completedAt: string
  dueDate: string | null
  dueResult: 'early' | 'ontime' | 'late' | 'none'
  createdAt: string
  assigneeId: string | null
  checklistTotal: number
  checklistDone: number
  backfilled: boolean
}

export interface AchievementUnlock {
  achievementId: string
  unlockedAt: string
  progress: number
}

export interface UserProgress {
  userId: string
  totalXp: number
  level: number
  newAchievements: number
  updatedAt: string
}

export type GamificationMessage =
  | { kind: 'xp'; amount: number; totalXp: number }
  | { kind: 'achievement'; achievement: Achievement }
  | { kind: 'levelup'; from: number; to: number; title: string; icon: string }
