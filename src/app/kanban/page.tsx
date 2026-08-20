'use client'

import React, { useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { Plus, Loader2 } from 'lucide-react'
import TaskCard from '@/components/TaskCard'
import TaskModal from '@/components/TaskModal'
import TaskCreateModal from '@/components/TaskCreateModal'
import { StrictModeDroppable } from '@/components/StrictModeDroppable'
import { useData } from '@/context/DataContext'
import { useColumns } from '@/context/ColumnsContext'
import { useMobileUI } from '@/context/MobileUIContext'
import { useKanbanFilter } from '@/context/KanbanFilterContext'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const WEEKDAY_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getWeekOfMonth(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00')
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  return Math.ceil((date.getDate() + firstDay) / 7)
}

function formatDayHeader(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return {
    weekday: WEEKDAY_PT[d.getDay()],
    date: d.getDate(),
    full: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
  }
}

// ─── Drag-to-scroll hook ─────────────────────────────────────────────────────
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only trigger on the board background, not on cards/buttons
    const target = e.target as HTMLElement
    if (target.closest('[data-rfd-draggable-context-id]') || target.closest('button') || target.closest('a') || target.closest('input')) {
      return
    }
    if (!ref.current) return
    isDragging.current = true
    startX.current = e.pageX - ref.current.offsetLeft
    scrollLeft.current = ref.current.scrollLeft
    ref.current.style.cursor = 'grabbing'
    ref.current.style.userSelect = 'none'
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !ref.current) return
    e.preventDefault()
    const x = e.pageX - ref.current.offsetLeft
    const walk = (x - startX.current) * 1.5
    ref.current.scrollLeft = scrollLeft.current - walk
  }, [])

  const onMouseUp = useCallback(() => {
    isDragging.current = false
    if (ref.current) {
      ref.current.style.cursor = ''
      ref.current.style.userSelect = ''
    }
  }, [])

  const onMouseLeave = useCallback(() => {
    isDragging.current = false
    if (ref.current) {
      ref.current.style.cursor = ''
      ref.current.style.userSelect = ''
    }
  }, [])

  return { ref, onMouseDown, onMouseMove, onMouseUp, onMouseLeave }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function KanbanPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const { tasks, loaded, updateTask } = useData()
  const { columns } = useColumns()
  const { registerAddTask } = useMobileUI()
  const {
    assigneeFilter,
    priorityFilter,
    weekFilter,
    dayFilter,
    isCreateOpen,
    setIsCreateOpen,
  } = useKanbanFilter()

  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null)
  const selectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskId) || null, [tasks, selectedTaskId])
  const activeTasks = useMemo(() => tasks.filter(t => !t.deletedAt), [tasks])

  const dragScroll = useDragScroll()

  // Apply filters
  const filteredTasks = useMemo(() => {
    let list = activeTasks
    if (assigneeFilter) list = list.filter(t => t.assigneeId === assigneeFilter)
    if (priorityFilter) list = list.filter(t => t.priority === priorityFilter)
    if (dayFilter) {
      list = list.filter(t => t.dueDate && t.dueDate.startsWith(dayFilter))
    } else if (weekFilter) {
      const w = Number(weekFilter)
      list = list.filter(t => t.dueDate && getWeekOfMonth(t.dueDate) === w)
    }
    return list
  }, [activeTasks, assigneeFilter, priorityFilter, weekFilter, dayFilter])

  // Open via URL params
  React.useEffect(() => {
    if (loaded && activeTasks.length > 0) {
      const newParam = searchParams.get('new')
      const taskParam = searchParams.get('task')
      if (newParam === 'true') {
        setIsCreateOpen(true)
        router.replace('/kanban')
      } else if (taskParam) {
        const found = activeTasks.find(t => t.id === taskParam)
        if (found) setSelectedTaskId(found.id)
        router.replace('/kanban')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loaded])

  React.useEffect(() => {
    registerAddTask(setIsCreateOpen)
  }, [registerAddTask, setIsCreateOpen])

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return
    try {
      await updateTask(draggableId, { status: destination.droppableId })
    } catch (err) {
      console.error(err)
    }
  }

  // Tasks grouped: colId → dayISO → tasks[]
  const tasksByColumnAndDay = useMemo(() => {
    const result: Record<string, Record<string, typeof filteredTasks>> = {}
    columns.forEach(col => { result[col.id] = {} })
    filteredTasks.forEach(task => {
      const colId = task.status
      if (!result[colId]) result[colId] = {}
      const day = task.dueDate ? task.dueDate.split('T')[0] : '__no_date__'
      if (!result[colId][day]) result[colId][day] = []
      result[colId][day].push(task)
    })
    return result
  }, [filteredTasks, columns])

  const hasActiveFilter = assigneeFilter || priorityFilter || weekFilter || dayFilter
  // Column count for dynamic sizing: aim for 6 visible at 100% zoom
  const colCount = columns.length

  return (
    <div className="flex flex-col h-full">
      {/* Filter indicator */}
      {hasActiveFilter && (
        <div className="shrink-0 mb-2">
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-1.5">
            <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
              Filtro ativo
              {weekFilter && ` • Semana ${weekFilter}`}
              {dayFilter && ` • ${formatDayHeader(dayFilter).full}`}
              {assigneeFilter && ' • Responsável'}
              {priorityFilter && ' • Prioridade'}
            </span>
          </div>
        </div>
      )}

      {/* Kanban Board — drag to scroll */}
      <div
        ref={dragScroll.ref}
        onMouseDown={dragScroll.onMouseDown}
        onMouseMove={dragScroll.onMouseMove}
        onMouseUp={dragScroll.onMouseUp}
        onMouseLeave={dragScroll.onMouseLeave}
        className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin"
        style={{ scrollbarWidth: 'thin' }}
      >
        {!loaded ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm font-medium">Carregando tarefas...</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div
              className="flex gap-2 h-full items-stretch select-none"
              style={{
                // Each column takes roughly 1/6th of the viewport minus some spacing
                minWidth: colCount > 6 ? `${colCount * 220}px` : undefined,
              }}
            >
              {columns.map(column => {
                const colDayMap = tasksByColumnAndDay[column.id] || {}
                const sortedDays = Object.keys(colDayMap).sort((a, b) => {
                  if (a === '__no_date__') return 1
                  if (b === '__no_date__') return -1
                  return a.localeCompare(b)
                })
                const totalCount = filteredTasks.filter(t => t.status === column.id).length

                return (
                  <div
                    key={column.id}
                    className="flex-1 min-w-[180px] max-h-full flex flex-col rounded-2xl bg-slate-100/60 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800"
                  >
                    {/* Column Header */}
                    <div
                      className="px-2.5 py-2 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between rounded-t-2xl"
                      style={{ backgroundColor: (column.bgColor || column.customColor || '#3b82f6') + '18' }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
                          style={{
                            backgroundColor: column.bgColor || column.customColor || '#3b82f6',
                            color: column.labelColor || '#ffffff',
                          }}
                        >
                          {column.title}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1 py-0.5 rounded-md">
                          {totalCount}
                        </span>
                      </div>
                      <button
                        onClick={() => setIsCreateOpen(true)}
                        className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Column Body */}
                    <StrictModeDroppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 p-1.5 min-h-[80px] overflow-y-auto transition-colors duration-150 ${
                            snapshot.isDraggingOver ? 'bg-blue-500/5 dark:bg-blue-500/10 rounded-b-2xl' : ''
                          }`}
                        >
                          {sortedDays.length === 0 && (
                            <div className="py-4 text-center text-slate-400 text-[10px] border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                              Solte aqui
                            </div>
                          )}

                          {sortedDays.map(day => {
                            const dayTasks = colDayMap[day]
                            const dayInfo = day !== '__no_date__' ? formatDayHeader(day) : null
                            return (
                              <div key={day} className="mb-2">
                                {dayInfo && (
                                  <div className="flex items-center gap-1 mb-1 px-0.5">
                                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider">
                                      {dayInfo.weekday} {dayInfo.date}
                                    </span>
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                                  </div>
                                )}
                                {dayTasks.map((task, idx) => (
                                  <TaskCard
                                    key={task.id}
                                    task={task}
                                    index={idx}
                                    onOpenDetail={t => setSelectedTaskId(t.id)}
                                    columnColor={column.bgColor || column.customColor}
                                  />
                                ))}
                              </div>
                            )
                          })}

                          {provided.placeholder}
                        </div>
                      )}
                    </StrictModeDroppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
        )}
      </div>

      <TaskCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {}}
      />
      <TaskModal
        task={selectedTask}
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  )
}
