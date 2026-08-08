'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Calendar, MessageSquare, Paperclip, CheckSquare, Clock } from 'lucide-react'

import { Task } from '@/types'
import Avatar from '@/components/Avatar'
import { useColumns } from '@/context/ColumnsContext'

interface TaskCardProps {
  task: Task
  index: number
  onClick: (task: Task) => void
}

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
  const { summary } = useColumns()
  const totalChecklist = task.checklist.length
  const completedChecklist = task.checklist.filter(item => item.isCompleted).length
  
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
  const isClose = task.dueDate && !isOverdue && (new Date(task.dueDate).getTime() - new Date().getTime() < 48 * 60 * 60 * 1000) && task.status !== 'DONE'

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const getPriorityColors = (prio: string) => {
    switch (prio) {
      case 'URGENT':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
      case 'MEDIUM':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20'
    }
  }

  const getPriorityLabel = (prio: string) => {
    switch (prio) {
      case 'URGENT': return 'Urgente'
      case 'HIGH': return 'Alta'
      case 'MEDIUM': return 'Média'
      default: return 'Baixa'
    }
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`p-2.5 sm:p-4 rounded-xl bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group cursor-grab active:cursor-grabbing select-none mb-2 sm:mb-3 ${
            snapshot.isDragging ? 'dragging-card' : ''
          } ${isOverdue ? 'border-l-4 border-l-red-500' : ''} ${isClose ? 'border-l-4 border-l-amber-500' : ''}`}
        >
          {/* Priority tag */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            {summary.showPriority && (
              <span className={`text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md ${getPriorityColors(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
            )}

            {isOverdue && (
              <span className="flex items-center gap-0.5 text-[7px] sm:text-[9px] text-red-500 dark:text-red-400 font-extrabold uppercase tracking-wider">
                <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                Atrasado
              </span>
            )}
            {isClose && !isOverdue && (
              <span className="flex items-center gap-0.5 text-[7px] sm:text-[9px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider">
                <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                Próximo
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug mb-2 sm:mb-3 line-clamp-3">
            {task.title}
          </h4>

          {/* Card Footer */}
          <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800 text-slate-400">
            <div className="flex items-center gap-2 sm:gap-3">
              {summary.showChecklist && totalChecklist > 0 && (
                <div 
                  className={`flex items-center gap-0.5 sm:gap-1 font-semibold ${
                    completedChecklist === totalChecklist 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  title={`Checklist: ${completedChecklist}/${totalChecklist}`}
                >
                  <CheckSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="text-[8px] sm:text-[10px]">{completedChecklist}/{totalChecklist}</span>
                </div>
              )}

              {summary.showAttachments && task.attachments.length > 0 && (
                <div className="flex items-center gap-0.5 sm:gap-1" title="Anexos">
                  <Paperclip className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="text-[8px] sm:text-[10px]">{task.attachments.length}</span>
                </div>
              )}

              {summary.showComments && task.comments.length > 0 && (
                <div className="flex items-center gap-0.5 sm:gap-1" title="Comentários">
                  <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="text-[8px] sm:text-[10px]">{task.comments.length}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {summary.showDueDate && task.dueDate && (
                <span 
                  className={`text-[8px] sm:text-[10px] font-bold flex items-center gap-0.5 ${
                    isOverdue 
                      ? 'text-red-500' 
                      : isClose 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  title={`Data de Entrega: ${new Date(task.dueDate).toLocaleDateString('pt-BR')}`}
                >
                  <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {formatDate(task.dueDate)}
                </span>
              )}

              {summary.showAssignee && (
                task.assignee ? (
                  <Avatar
                    name={task.assignee.name}
                    url={task.assignee.avatarUrl}
                    size="sm"
                    className="border border-slate-200 dark:border-slate-800"
                  />
                ) : (
                  <div 
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[7px] sm:text-[8px] font-bold text-slate-400"
                    title="Sem responsável"
                  >
                    —
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
