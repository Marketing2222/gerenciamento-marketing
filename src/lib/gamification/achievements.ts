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

export const ACHIEVEMENTS: Achievement[] = [
  // ===== Produtividade =====
  ach('first_task', 'Primeira Missão', 'Concluir sua primeira tarefa.', '🎯', 'comum', 'produtividade', 25,
    { type: 'total', value: 1 }),
  ach('tasks_5', 'Primeiro Objetivo', 'Concluir 5 tarefas.', '📌', 'comum', 'produtividade', 50,
    { type: 'total', value: 5 }),
  ach('tasks_10', 'Em Ação', 'Concluir 10 tarefas.', '⚡', 'rara', 'produtividade', 75,
    { type: 'total', value: 10 }),
  ach('tasks_25', 'Executor', 'Concluir 25 tarefas.', '🔧', 'rara', 'produtividade', 100,
    { type: 'total', value: 25 }),
  ach('tasks_50', 'Veterano', 'Concluir 50 tarefas.', '🎖️', 'epica', 'produtividade', 150,
    { type: 'total', value: 50 }),
  ach('tasks_100', 'Foco de Aço', 'Concluir 100 tarefas.', '🛡️', 'epica', 'produtividade', 200,
    { type: 'total', value: 100 }),
  ach('tasks_250', 'Obsessão', 'Concluir 250 tarefas.', '👑', 'lendaria', 'produtividade', 400,
    { type: 'total', value: 250 }),
  ach('tasks_500', 'Lenda Viva', 'Concluir 500 tarefas.', '🏛️', 'lendaria', 'produtividade', 700,
    { type: 'total', value: 500 }),
  ach('tasks_1000', 'Além dos Limites', 'Concluir 1000 tarefas.', '🚀', 'lendaria', 'produtividade', 1000,
    { type: 'total', value: 1000 }),

  // ===== Velocidade =====
  ach('early_1', 'Pontual', 'Concluir 1 tarefa antes do prazo.', '⏱️', 'comum', 'velocidade', 25,
    { type: 'early', value: 1 }),
  ach('early_10', 'Velocista', 'Concluir 10 tarefas antes do prazo.', '⚡', 'rara', 'velocidade', 100,
    { type: 'early', value: 10 }),
  ach('early_25', 'Prazo Mestre', 'Concluir 25 tarefas antes do prazo.', '⏩', 'epica', 'velocidade', 150,
    { type: 'early', value: 25 }),
  ach('early_50', 'Imbatível', 'Concluir 50 tarefas antes do prazo.', '🏆', 'lendaria', 'velocidade', 300,
    { type: 'early', value: 50 }),
  ach('urgent_early_1', 'Contra o Relógio', 'Concluir uma tarefa urgente antes do prazo.', '⌛', 'rara', 'velocidade', 75,
    { type: 'urgent_early', value: 1 }),
  ach('day_3', 'Trio do Dia', 'Concluir 3 tarefas em um único dia.', '🔢', 'comum', 'velocidade', 50,
    { type: 'per_day', value: 3 }),
  ach('day_5', 'Turbo', 'Concluir 5 tarefas em um único dia.', '🏎️', 'rara', 'velocidade', 100,
    { type: 'per_day', value: 5 }),
  ach('day_10', 'Sem Freio', 'Concluir 10 tarefas em um único dia.', '🌪️', 'epica', 'velocidade', 200,
    { type: 'per_day', value: 10 }),
  ach('day_25', 'Avassalador', 'Concluir 25 tarefas em um único dia.', '☄️', 'lendaria', 'velocidade', 400,
    { type: 'per_day', value: 25 }),

  // ===== Consistência =====
  ach('streak_3', 'Combo x3', 'Concluir tarefas por 3 dias consecutivos.', '🔗', 'comum', 'consistencia', 50,
    { type: 'streak', value: 3 }),
  ach('streak_7', 'Combo x7', 'Concluir tarefas por 7 dias consecutivos.', '🔥', 'rara', 'consistencia', 125,
    { type: 'streak', value: 7 }),
  ach('streak_14', 'Combo x14', 'Concluir tarefas por 14 dias consecutivos.', '💪', 'rara', 'consistencia', 200,
    { type: 'streak', value: 14 }),
  ach('streak_30', 'Combo x30', 'Concluir tarefas por 30 dias consecutivos.', '🌟', 'epica', 'consistencia', 300,
    { type: 'streak', value: 30 }),
  ach('streak_100', 'Combo x100', 'Concluir tarefas por 100 dias consecutivos.', '💎', 'lendaria', 'consistencia', 750,
    { type: 'streak', value: 100 }),

  // ===== Vídeos =====
  ach('video_1', 'Primeiro Take', 'Concluir sua primeira tarefa de vídeo.', '🎬', 'comum', 'videos', 25,
    { type: 'category', value: 1, contentCategory: 'video' }),
  ach('video_5', 'Cineasta', 'Concluir 5 tarefas de vídeo.', '🎥', 'comum', 'videos', 50,
    { type: 'category', value: 5, contentCategory: 'video' }),
  ach('video_10', 'Diretor', 'Concluir 10 tarefas de vídeo.', '🎞️', 'rara', 'videos', 75,
    { type: 'category', value: 10, contentCategory: 'video' }),
  ach('video_50', 'Blockbuster', 'Concluir 50 tarefas de vídeo.', '🍿', 'epica', 'videos', 200,
    { type: 'category', value: 50, contentCategory: 'video' }),
  ach('video_150', 'Lenda do Cinema', 'Concluir 150 tarefas de vídeo.', '🌟', 'lendaria', 'videos', 500,
    { type: 'category', value: 150, contentCategory: 'video' }),

  // ===== Posts =====
  ach('post_1', 'Primeiro Post', 'Concluir sua primeira tarefa de post.', '✍️', 'comum', 'posts', 25,
    { type: 'category', value: 1, contentCategory: 'post' }),
  ach('post_5', 'Colunista', 'Concluir 5 tarefas de post.', '📝', 'comum', 'posts', 50,
    { type: 'category', value: 5, contentCategory: 'post' }),
  ach('post_25', 'Criador', 'Concluir 25 tarefas de post.', '🖌️', 'rara', 'posts', 100,
    { type: 'category', value: 25, contentCategory: 'post' }),
  ach('post_100', 'Máquina de Conteúdo', 'Concluir 100 tarefas de post.', '🤖', 'lendaria', 'posts', 300,
    { type: 'category', value: 100, contentCategory: 'post' }),
  ach('post_250', 'Editor-Chefe', 'Concluir 250 tarefas de post.', '📰', 'lendaria', 'posts', 500,
    { type: 'category', value: 250, contentCategory: 'post' }),

  // ===== Tráfego =====
  ach('traf_1', 'Primeira Campanha', 'Concluir sua primeira tarefa de tráfego pago.', '📈', 'comum', 'trafego', 25,
    { type: 'category', value: 1, contentCategory: 'trafego' }),
  ach('traf_10', 'Estrategista', 'Concluir 10 tarefas de tráfego pago.', '🧭', 'rara', 'trafego', 100,
    { type: 'category', value: 10, contentCategory: 'trafego' }),
  ach('traf_25', 'Gestor de Mídia', 'Concluir 25 tarefas de tráfego pago.', '💰', 'epica', 'trafego', 150,
    { type: 'category', value: 25, contentCategory: 'trafego' }),
  ach('traf_50', 'Império de Anúncios', 'Concluir 50 tarefas de tráfego pago.', '📡', 'lendaria', 'trafego', 300,
    { type: 'category', value: 50, contentCategory: 'trafego' }),

  // ===== Outros =====
  ach('no_deadline_10', 'Livre como o Vento', 'Concluir 10 tarefas sem prazo definido.', '🕊️', 'comum', 'produtividade', 50,
    { type: 'no_deadline', value: 10 }),

  // ===== Secretas =====
  ach('ghost', 'Fantasma', 'Concluir 10 tarefas sem responsável atribuído.', '👻', 'rara', 'secretas', 75,
    { type: 'no_assignee', value: 10 }, true),
  ach('night_owl', 'Madrugador', 'Concluir uma tarefa entre 0h e 5h da manhã.', '🌙', 'epica', 'secretas', 100,
    { type: 'night', value: 1 }, true),
  ach('rapid_3', 'Relâmpago', 'Concluir 3 tarefas em menos de 30 minutos.', '⚡', 'rara', 'secretas', 75,
    { type: 'rapid', value: 1 }, true),
  ach('urgent_10', 'Emergência Máxima', 'Concluir 10 tarefas urgentes.', '🚨', 'epica', 'secretas', 150,
    { type: 'urgent_total', value: 10 }, true),
  ach('same_day_create', 'Criada e Concluída', 'Concluir uma tarefa no mesmo dia em que ela foi criada.', '📅', 'comum', 'secretas', 25,
    { type: 'same_day_create', value: 1 }, true),
  ach('perfect_checklist', 'Perfeccionista', 'Concluir uma tarefa com o checklist 100% completo.', '✅', 'rara', 'secretas', 75,
    { type: 'perfect_checklist', value: 1 }, true),
  ach('streak_60', 'Combo Infinito', 'Concluir tarefas por 60 dias consecutivos.', '💫', 'lendaria', 'secretas', 500,
    { type: 'streak', value: 60 }, true),
]

export const ACHIEVEMENTS_BY_ID: Record<string, Achievement> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a])
)

export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length
