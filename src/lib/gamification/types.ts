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
  | 'streak_work'
  | 'category'
  | 'no_deadline'
  | 'no_assignee'
  | 'other_creator'
  | 'night'
  | 'same_day_create'
  | 'perfect_checklist'
  | 'rapid'
  | 'voz_ativa'
  | 'arquiteto'
  | 'sprint_final'
  | 'late_total'
  | 'deleted_total'
  | 'created_total'
  | 'fast_finish'
  | 'radar'
  | 'all'

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
  /** Streak de DIAS ÚTEIS (domingos/feriados não contam nem quebram) — Combo x7/x14/x20. */
  streakWork: number
  category: Record<ContentCategory, number>
  noDeadline: number
  noAssignee: number
  otherCreator: number
  night: number
  sameDayCreate: number
  perfectChecklist: number
  rapid: boolean
  /** Comentários em tarefas criadas por outras pessoas. */
  vozAtiva: number
  /** Tarefas criadas por mim, com descrição e checklist 100% concluído. */
  arquiteto: number
  /** Conclusões no dia de Sprint Final (último dia útil do mês). */
  sprintFinal: number
  /** Conclusões com prazo ultrapassado ("late"). */
  lateTotal: number
  /** Tarefas excluídas por mim na temporada. */
  deletedTotal: number
  /** Tarefas criadas por mim na temporada. */
  createdByMe: number
  /** Tarefas criadas por mim e concluídas em até 24 horas. */
  fastFinish: number
  /** Conclusões de tarefas com título "VERIFICAR INDICAÇÕES". */
  radar: number
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
  /** Título da tarefa no momento da conclusão ('' em eventos antigos). */
  title: string
  assigneeId: string | null
  creatorId: string | null
  checklistTotal: number
  checklistDone: number
  backfilled: boolean
}

/**
 * Forma mínima de tarefa que os contadores baseados em tarefas precisam
 * (comentários, exclusões, criações). `Task` satisfaz estruturalmente.
 * Campos de data aceitam string/number/Timestamp em tempo de execução.
 */
export interface TaskForCounters {
  creatorId: string | null
  description: string
  createdAt: unknown
  deletedAt: unknown
  deletedBy?: string | null
  checklist: { isCompleted?: boolean }[]
  comments: { user: { id: string }; createdAt: unknown }[]
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
  coverUrl: string | null
  /** Zoom da imagem de fundo da página de conquistas (1 = normal). */
  bgZoom: number
  /** Cores pessoais do perfil (banner/XP). null = usar gradiente do sistema. */
  accentFrom: string | null
  accentTo: string | null
  updatedAt: string
}

export interface XpLine {
  label: string
  amount: number
}

export type GamificationMessage =
  | { kind: 'xp'; amount: number; totalXp: number; details: XpLine[] }
  | { kind: 'achievement'; achievement: Achievement }
  | { kind: 'levelup'; from: number; to: number; title: string; icon: string }
