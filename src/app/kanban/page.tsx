'use client'

import React, { useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { Plus, Loader2 } from 'lucide-react'
import TaskCard from '@/components/TaskCard'
import TaskModal from '@/components/TaskModal'
import { StrictModeDroppable } from '@/components/StrictModeDroppable'
import { useData } from '@/context/DataContext'
import { useColumns } from '@/context/ColumnsContext'
import { useMobileUI } from '@/context/MobileUIContext'
import { useKanbanFilter } from '@/context/KanbanFilterContext'
import type { Task } from '@/types'

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

  const { tasks, loaded, updateTask, updateTaskOrders } = useData()
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

  // Persist migrated orders for tasks that don't have one yet
  React.useEffect(() => {
    if (!loaded || tasks.length === 0) return
    const tasksNeedingOrder = tasks.filter(t => t.order === 0 && !t.deletedAt)
    if (tasksNeedingOrder.length === 0) return

    const orderCounters: Record<string, number> = {}
    columns.forEach(col => { orderCounters[col.id] = 1 })

    // Count existing orders per column to avoid conflicts
    tasks.forEach(t => {
      if (t.order > 0 && !t.deletedAt) {
        const col = t.status
        if (!orderCounters[col]) orderCounters[col] = 1
        if (t.order >= orderCounters[col]) {
          orderCounters[col] = t.order + 1
        }
      }
    })

    const updates = tasksNeedingOrder.map(t => {
      if (!orderCounters[t.status]) orderCounters[t.status] = 1
      return { id: t.id, order: orderCounters[t.status]++ }
    })

    if (updates.length > 0) {
      updateTaskOrders(updates).catch(console.error)
    }
  }, [loaded, tasks, columns, updateTaskOrders])

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const srcColId = source.droppableId
    const destColId = destination.droppableId

    // Get tasks for source and destination columns, sorted by order
    const srcTasks = tasks
      .filter(t => t.status === srcColId && !t.deletedAt)
      .sort((a, b) => a.order - b.order)
    const destTasks = srcColId === destColId
      ? srcTasks
      : tasks
          .filter(t => t.status === destColId && !t.deletedAt)
          .sort((a, b) => a.order - b.order)

    // Find the dragged task
    const draggedTask = srcTasks.find(t => t.id === draggableId)
    if (!draggedTask) return

    // Remove from source
    const srcWithout = srcTasks.filter(t => t.id !== draggableId)

    // Insert at destination
    let destWithDragged: Task[]
    if (srcColId === destColId) {
      destWithDragged = [...srcWithout]
      destWithDragged.splice(destination.index, 0, draggedTask)
    } else {
      destWithDragged = [...destTasks]
      destWithDragged.splice(destination.index, 0, draggedTask)
    }

    // Calculate new orders
    const updates: { id: string; order: number }[] = []

    if (srcColId === destColId) {
      destWithDragged.forEach((task, idx) => {
        const newOrder = idx + 1
        if (task.order !== newOrder) {
          updates.push({ id: task.id, order: newOrder })
        }
      })
    } else {
      srcWithout.forEach((task, idx) => {
        const newOrder = idx + 1
        if (task.order !== newOrder) {
          updates.push({ id: task.id, order: newOrder })
        }
      })
      destWithDragged.forEach((task, idx) => {
        const newOrder = idx + 1
        if (task.order !== newOrder) {
          updates.push({ id: task.id, order: newOrder })
        }
      })
    }

    // Fire-and-forget: don't await to avoid re-render during DnD cleanup
    if (srcColId !== destColId) {
      updateTask(draggableId, { status: destColId }).catch(console.error)
    }
    if (updates.length > 0) {
      updateTaskOrders(updates).catch(console.error)
    }
  }

  // Tasks grouped: colId → tasks[] (flat, sorted by order)
  const tasksByColumn = useMemo(() => {
    const result: Record<string, Task[]> = {}
    columns.forEach(col => { result[col.id] = [] })

    // Lazy migration: assign order to tasks that don't have one
    const orderCounters: Record<string, number> = {}
    columns.forEach(col => { orderCounters[col.id] = 1 })
    const migratedOrders = new Map<string, number>()
    const sortedByOrder = [...filteredTasks].sort((a, b) => {
      const aOrder = a.order !== 0 ? a.order : (migratedOrders.get(a.id) ?? (orderCounters[a.status]++))
      const bOrder = b.order !== 0 ? b.order : (migratedOrders.get(b.id) ?? (orderCounters[b.status]++))
      if (a.order === 0 && !migratedOrders.has(a.id)) migratedOrders.set(a.id, aOrder)
      if (b.order === 0 && !migratedOrders.has(b.id)) migratedOrders.set(b.id, bOrder)
      if (a.order === 0 && b.order === 0) return aOrder - bOrder
      if (a.order === 0) return 1
      if (b.order === 0) return -1
      return a.order - b.order
    })
    sortedByOrder.forEach(task => {
      const colId = task.status
      if (!result[colId]) result[colId] = []
      result[colId].push(task)
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
                const colTasks = tasksByColumn[column.id] || []
                const totalCount = colTasks.length

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
                          {colTasks.length === 0 ? (
                            <div className="py-4 text-center text-slate-400 text-[10px] border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                              Solte aqui
                            </div>
                          ) : (
                            colTasks.map((task, index) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                onOpenDetail={t => setSelectedTaskId(t.id)}
                                columnColor={column.bgColor || column.customColor}
                              />
                            ))
                          )}

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

      <TaskModal
        task={selectedTask || null}
        isOpen={selectedTask !== null || isCreateOpen}
        onClose={() => { setSelectedTaskId(null); setIsCreateOpen(false) }}
        initialStatus="TODO"
      />
    </div>
  )
}
