import type { Achievement } from './types'

const ach = (
  id: string,
  name: string,
  description: string,
  icon: string,
  rarity: Achievement['rarity'],
  category: Achievement['category'],
  xpReward: number,
  requirement: Achievement['requirement'],
  secret = false
): Achievement => ({ id, name, description, icon, rarity, category, secret, xpReward, requirement })

/**
 * 38 conquistas para progressão MENSAL (reseta a cada temporada).
 * Meta da temporada: 50 tarefas/mês. Recompensas: comum 25–50, rara 60–100,
 * épica 90–150, lendária 200–300, platina 400.
 *
 * ATENÇÃO: os ids são históricos (uploads de ícone usam `ach_{id}`) e podem
 * não bater com o valor atual — ex.: `post_25` é o Criador com value 5 e
 * `streak_30` é o Combo x20. Nunca renomear ids existentes.
 */
export const ACHIEVEMENTS: Achievement[] = [
  // ===== Produtividade =====
  ach('first_task', 'Primeira Missão', 'Concluir sua primeira tarefa.', '🎯', 'comum', 'produtividade', 30,
    { type: 'total', value: 1 }),
  ach('tasks_5', 'Primeiro Objetivo', 'Concluir 5 tarefas.', '📌', 'comum', 'produtividade', 45,
    { type: 'total', value: 5 }),
  ach('tasks_10', 'Em Ação', 'Concluir 10 tarefas.', '⚡', 'rara', 'produtividade', 70,
    { type: 'total', value: 10 }),
  ach('tasks_25', 'Executor', 'Concluir 25 tarefas.', '🔧', 'rara', 'produtividade', 90,
    { type: 'total', value: 25 }),
  ach('tasks_50', 'Veterano', 'Concluir 50 tarefas — a meta do mês.', '🎖️', 'epica', 'produtividade', 150,
    { type: 'total', value: 50 }),

  // ===== Velocidade =====
  ach('early_1', 'Pontual', 'Concluir 1 tarefa antes do prazo.', '⏱️', 'comum', 'velocidade', 30,
    { type: 'early', value: 1 }),
  ach('early_10', 'Velocista', 'Concluir 5 tarefas antes do prazo.', '⚡', 'rara', 'velocidade', 60,
    { type: 'early', value: 5 }),
  ach('early_25', 'Prazo Mestre', 'Concluir 15 tarefas antes do prazo.', '⏩', 'epica', 'velocidade', 120,
    { type: 'early', value: 15 }),
  ach('early_50', 'Imbatível', 'Concluir 25 tarefas antes do prazo.', '🏆', 'lendaria', 'velocidade', 250,
    { type: 'early', value: 25 }),
  ach('urgent_early_1', 'Contra o Relógio', 'Concluir uma tarefa urgente antes do prazo.', '⌛', 'rara', 'velocidade', 75,
    { type: 'urgent_early', value: 1 }),
  ach('day_3', 'Trio do Dia', 'Concluir 3 tarefas em um único dia.', '🔢', 'comum', 'velocidade', 40,
    { type: 'per_day', value: 3 }),
  ach('day_5', 'Turbo', 'Concluir 5 tarefas em um único dia.', '🏎️', 'rara', 'velocidade', 70,
    { type: 'per_day', value: 5 }),
  ach('day_10', 'Sem Freio', 'Concluir 10 tarefas em um único dia.', '🌪️', 'epica', 'velocidade', 130,
    { type: 'per_day', value: 10 }),
  ach('day_25', 'Avassalador', 'Concluir 15 tarefas em um único dia.', '☄️', 'lendaria', 'velocidade', 220,
    { type: 'per_day', value: 15 }),

  // ===== Consistência =====
  ach('streak_3', 'Combo x3', 'Concluir tarefas por 3 dias consecutivos.', '🔗', 'comum', 'consistencia', 35,
    { type: 'streak', value: 3 }),
  ach('streak_7', 'Combo x7', 'Concluir tarefas por 7 dias consecutivos.', '🔥', 'rara', 'consistencia', 70,
    { type: 'streak', value: 7 }),
  ach('streak_14', 'Combo x14', 'Concluir tarefas por 14 dias consecutivos.', '💪', 'epica', 'consistencia', 130,
    { type: 'streak', value: 14 }),
  ach('streak_30', 'Combo x20', 'Concluir tarefas por 20 dias consecutivos.', '🌟', 'lendaria', 'consistencia', 260,
    { type: 'streak', value: 20 }),

  // ===== Vídeos =====
  ach('video_1', 'Primeiro Take', 'Concluir sua primeira tarefa de vídeo.', '🎬', 'comum', 'videos', 30,
    { type: 'category', value: 1, contentCategory: 'video' }),
  ach('video_5', 'Cineasta', 'Concluir 5 tarefas de vídeo.', '🎥', 'rara', 'videos', 70,
    { type: 'category', value: 5, contentCategory: 'video' }),
  ach('video_50', 'Blockbuster', 'Concluir 10 tarefas de vídeo.', '🍿', 'epica', 'videos', 120,
    { type: 'category', value: 10, contentCategory: 'video' }),
  ach('video_150', 'Lenda do Cinema', 'Concluir 15 tarefas de vídeo.', '🌟', 'lendaria', 'videos', 250,
    { type: 'category', value: 15, contentCategory: 'video' }),

  // ===== Posts =====
  ach('post_1', 'Primeiro Post', 'Concluir sua primeira tarefa de post.', '✍️', 'comum', 'posts', 30,
    { type: 'category', value: 1, contentCategory: 'post' }),
  ach('post_25', 'Criador', 'Concluir 5 tarefas de post.', '🖌️', 'rara', 'posts', 70,
    { type: 'category', value: 5, contentCategory: 'post' }),
  ach('post_100', 'Máquina de Conteúdo', 'Concluir 15 tarefas de post.', '🤖', 'epica', 'posts', 120,
    { type: 'category', value: 15, contentCategory: 'post' }),
  ach('post_250', 'Editor-Chefe', 'Concluir 20 tarefas de post.', '📰', 'lendaria', 'posts', 250,
    { type: 'category', value: 20, contentCategory: 'post' }),

  // ===== Tráfego =====
  ach('traf_1', 'Primeira Campanha', 'Concluir sua primeira tarefa de tráfego pago.', '📈', 'comum', 'trafego', 30,
    { type: 'category', value: 1, contentCategory: 'trafego' }),
  ach('traf_25', 'Gestor de Mídia', 'Concluir 3 tarefas de tráfego pago.', '💰', 'rara', 'trafego', 70,
    { type: 'category', value: 3, contentCategory: 'trafego' }),
  ach('traf_50', 'Império de Anúncios', 'Concluir 5 tarefas de tráfego pago.', '📡', 'epica', 'trafego', 120,
    { type: 'category', value: 5, contentCategory: 'trafego' }),

  // ===== Outros =====
  ach('no_deadline_10', 'Livre como o Vento', 'Concluir 10 tarefas sem prazo definido.', '🕊️', 'comum', 'produtividade', 45,
    { type: 'no_deadline', value: 10 }),

  // ===== Secretas =====
  ach('ghost', 'Fantasma', 'Concluir 10 tarefas sem responsável atribuído.', '👻', 'rara', 'secretas', 70,
    { type: 'no_assignee', value: 10 }, true),
  ach('night_owl', 'Madrugador', 'Concluir uma tarefa entre 0h e 5h da manhã.', '🌙', 'epica', 'secretas', 120,
    { type: 'night', value: 1 }, true),
  ach('rapid_3', 'Relâmpago', 'Concluir 3 tarefas em menos de 30 minutos.', '⚡', 'rara', 'secretas', 65,
    { type: 'rapid', value: 1 }, true),
  ach('urgent_10', 'Emergência Máxima', 'Concluir 10 tarefas urgentes.', '🚨', 'epica', 'secretas', 130,
    { type: 'urgent_total', value: 10 }, true),
  ach('same_day_create', 'Criada e Concluída', 'Concluir uma tarefa no mesmo dia em que ela foi criada.', '📅', 'comum', 'secretas', 25,
    { type: 'same_day_create', value: 1 }, true),
  ach('perfect_checklist', 'Perfeccionista', 'Concluir uma tarefa com o checklist 100% completo.', '✅', 'rara', 'secretas', 70,
    { type: 'perfect_checklist', value: 1 }, true),
  ach('streak_60', 'Combo Infinito', 'Concluir tarefas por 30 dias consecutivos.', '💫', 'lendaria', 'secretas', 280,
    { type: 'streak', value: 30 }, true),

  // ===== Platina: exige as outras 37 =====
  ach('completionist', 'Complecionista', 'Desbloquear todas as outras 37 conquistas.', '🏆', 'lendaria', 'secretas', 400,
    { type: 'all', value: 37 }, false),
]

export const ACHIEVEMENTS_BY_ID: Record<string, Achievement> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a])
)

export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length
