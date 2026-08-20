'use client'

import { useRef, useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { Play, CheckCircle2, MessageSquare, MoreHorizontal, ChevronDown } from 'lucide-react'

import { Task } from '@/types'
import Avatar from '@/components/Avatar'
import { useColumns } from '@/context/ColumnsContext'
import { useData } from '@/context/DataContext'
import { useUser } from '@/context/UserContext'

interface TaskCardProps {
  task: Task
  index: number
  onOpenDetail: (task: Task) => void
  columnColor?: string
}

const DONE_COLUMN_ID = 'DONE'
const IN_PROGRESS_COLUMN_ID = 'IN_PROGRESS'

const getPriorityColors = (prio: string) => {
  switch (prio) {
    case 'URGENT': return 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
    case 'HIGH':   return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
    case 'MEDIUM': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
    default:       return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
  }
}

const getPriorityLabel = (prio: string) => {
  switch (prio) {
    case 'URGENT': return 'Urgente'
    case 'HIGH':   return 'Alta'
    case 'MEDIUM': return 'Média'
    default:       return 'Baixa'
  }
}

export default function TaskCard({ task, index, onOpenDetail, columnColor }: TaskCardProps) {
  const { summary } = useColumns()
  const { updateTask, addComment } = useData()
  const { user } = useUser()

  const [showPriority, setShowPriority] = useState(true)
  const [showComment, setShowComment] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isActing, setIsActing] = useState(false)

  const clickedRef = useRef(false)

  const isPlaying = task.assigneeId === user?.id
  const isDone = task.status === DONE_COLUMN_ID

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isActing || !user) return
    setIsActing(true)
    try {
      if (isPlaying) {
        // Desmarcar: remove responsável
        await updateTask(task.id, { assigneeId: null })
      } else {
        // Assumir: seta responsável e muda status para Em Andamento
        await updateTask(task.id, { assigneeId: user.id, status: IN_PROGRESS_COLUMN_ID })
      }
    } finally {
      setIsActing(false)
    }
  }

  const handleCheck = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isActing) return
    setIsActing(true)
    try {
      if (isDone) {
        // Se já tá concluído e clicou no check, volta para A Fazer
        await updateTask(task.id, { status: 'TODO' })
      } else {
        await updateTask(task.id, { status: DONE_COLUMN_ID })
      }
    } finally {
      setIsActing(false)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    await addComment(task.id, commentText.trim())
    setCommentText('')
    setShowComment(false)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`rounded-xl bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md group mb-2 select-none overflow-hidden
            ${snapshot.isDragging ? 'dragging-card ring-2 ring-blue-400/40 relative z-[9999]' : 'transition-[box-shadow,border-color] duration-150 hover:border-slate-300 dark:hover:border-slate-700'}
            ${columnColor ? 'border-l-[3px]' : ''}
          `}
          style={{
            ...provided.draggableProps.style,
            ...(columnColor ? { borderLeftColor: columnColor } : {}),
          }}
        >
          {/* Card Body */}
          <div
            className="p-3 cursor-pointer"
            onClick={() => onOpenDetail(task)}
          >
            {/* Top row: priority toggle + avatar */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                {summary.showPriority && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowPriority(v => !v) }}
                    className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md transition ${getPriorityColors(task.priority)}`}
                    title="Mostrar/Recolher prioridade"
                  >
                    {showPriority && getPriorityLabel(task.priority)}
                    <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showPriority ? 'rotate-0' : '-rotate-90'}`} />
                  </button>
                )}
                {task.dueDate && summary.showDueDate && (
                  <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
                    {formatDate(task.dueDate)}
                  </span>
                )}
              </div>
              {summary.showAssignee && task.assignee && (
                <Avatar
                  name={task.assignee.name}
                  url={task.assignee.avatarUrl}
                  size="sm"
                  className="shrink-0 border-2 border-white dark:border-slate-800 shadow-sm"
                />
              )}
            </div>

            {/* Title */}
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-[13px] leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition mb-1">
              {task.title}
            </h4>

            {/* Checklist summary */}
            {summary.showChecklist && task.checklist.length > 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1 rounded-full transition-all"
                    style={{ width: `${(task.checklist.filter(i => i.isCompleted).length / task.checklist.length) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 font-medium shrink-0">
                  {task.checklist.filter(i => i.isCompleted).length}/{task.checklist.length}
                </span>
              </div>
            )}
          </div>

          {/* Inline comment box */}
          {showComment && (
            <form
              onSubmit={handleCommentSubmit}
              onClick={e => e.stopPropagation()}
              className="px-3 pb-2"
            >
              <input
                autoFocus
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Escreva um comentário..."
                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                onKeyDown={e => { if (e.key === 'Escape') setShowComment(false) }}
              />
              <div className="flex gap-1.5 mt-1.5 justify-end">
                <button type="button" onClick={() => setShowComment(false)} className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded transition">Cancelar</button>
                <button type="submit" className="text-[10px] px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-semibold">Enviar</button>
              </div>
            </form>
          )}

          {/* Action buttons footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="flex items-center gap-1">
              {/* Play */}
              <button
                onClick={handlePlay}
                title="Marcar como Em Andamento"
                disabled={isActing}
                className={`p-1.5 rounded-lg transition ${
                  isPlaying
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-500'
                }`}
              >
                <Play className="w-3.5 h-3.5" fill={isPlaying ? 'currentColor' : 'none'} />
              </button>

              {/* Check */}
              <button
                onClick={handleCheck}
                title="Marcar como Concluído"
                disabled={isActing}
                className={`p-1.5 rounded-lg transition ${
                  isDone
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-500'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>

              {/* Comment */}
              <button
                onClick={e => { e.stopPropagation(); setShowComment(v => !v) }}
                title="Comentar"
                className={`p-1.5 rounded-lg transition relative ${
                  showComment
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {task.comments.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
                    {task.comments.length > 9 ? '9+' : task.comments.length}
                  </span>
                )}
              </button>

              {/* Ellipsis / Full detail */}
              <button
                onClick={e => { e.stopPropagation(); onOpenDetail(task) }}
                title="Ver detalhes"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Comments count summary */}
            {summary.showComments && task.comments.length > 0 && !showComment && (
              <span className="text-[9px] text-slate-400 font-medium">{task.comments.length} coment.</span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}
