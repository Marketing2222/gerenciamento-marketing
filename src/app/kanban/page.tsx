'use client'

import React, { useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { Plus, Loader2, X, Columns2 } from 'lucide-react'
import TaskCard from '@/components/TaskCard'
import TaskModal from '@/components/TaskModal'
import { StrictModeDroppable } from '@/components/StrictModeDroppable'
import { useData } from '@/context/DataContext'
import { useColumns } from '@/context/ColumnsContext'
import { useMobileUI } from '@/context/MobileUIContext'
import { useKanbanFilter } from '@/context/KanbanFilterContext'
import { useTheme } from '@/context/ThemeContext'
import { isSprintDate } from '@/lib/gamification/holidays'
import type { Task } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const WEEKDAY_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function parseDateParts(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { year: y, month: m - 1, day: d }
}

function getWeekOfMonth(dateStr: string, targetMonth?: number, targetYear?: number) {
  const { year, month, day } = parseDateParts(dateStr)
  const m = targetMonth ?? month
  const y = targetYear ?? year
  const firstDay = new Date(y, m, 1).getDay()
  return Math.ceil((day + firstDay) / 7)
}

function formatDayHeader(dateStr: string) {
  const { year, month, day } = parseDateParts(dateStr)
  const d = new Date(year, month, day)
  return {
    weekday: WEEKDAY_PT[d.getDay()],
    date: d.getDate(),
    full: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
  }
}

/** Busca por título sem depender de acento/caixa ("vídeo" encontra "Video"). */
function normSearch(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// ─── Drag-to-scroll hook ─────────────────────────────────────────────────────
function useDragScroll(isDraggingCard: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!ref.current) return
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault()
      ref.current.scrollLeft += e.deltaY
    }
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (isDraggingCard) return
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
  }, [isDraggingCard])

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

  return { ref, onWheel, onMouseDown, onMouseMove, onMouseUp, onMouseLeave }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function KanbanPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setTheme } = useTheme()

  // Tema claro é o padrão do kanban (conquistas força o escuro).
  React.useEffect(() => {
    setTheme('light')
  }, [setTheme])

  const { tasks, loaded, updateTask, updateTaskOrders } = useData()
  const { columns } = useColumns()
  const { registerAddTask } = useMobileUI()
  const {
    assigneeFilter,
    priorityFilter,
    weekFilter,
    dayFilter,
    filterMonth,
    filterYear,
    filterMonthActive,
    search,
    isCreateOpen,
    setIsCreateOpen,
  } = useKanbanFilter()

  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null)
  // ── Modo lado a lado: 2ª tarefa aberta + escolha no próprio kanban ─────────
  const [selectedTaskId2, setSelectedTaskId2] = React.useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [pickerSlot, setPickerSlot] = React.useState<'left' | 'right'>('right')
  const [isDraggingCard, setIsDraggingCard] = React.useState(false)
  const selectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskId) || null, [tasks, selectedTaskId])
  const selectedTask2 = useMemo(() => tasks.find(t => t.id === selectedTaskId2) || null, [tasks, selectedTaskId2])
  const bothOpen = selectedTask !== null && selectedTask2 !== null
  const activeTasks = useMemo(() => tasks.filter(t => !t.deletedAt), [tasks])

  // Modo criação ocupa a tela inteira → fecha a 2ª tarefa e o seletor
  React.useEffect(() => {
    if (isCreateOpen) {
      setSelectedTaskId2(null)
      setPickerOpen(false)
    }
  }, [isCreateOpen])

  // Escolher no kanban: preenche o slot vazio; com os 2 abertos, troca o slot escolhido
  const handlePickTask = React.useCallback((t: Task) => {
    if (!selectedTask) setSelectedTaskId(t.id)
    else if (!selectedTaskId2) setSelectedTaskId2(t.id)
    else if (pickerSlot === 'left') setSelectedTaskId(t.id)
    else setSelectedTaskId2(t.id)
    setPickerOpen(false)
  }, [selectedTask, selectedTaskId2, pickerSlot])

  // ESC cancela a escolha no kanban — em fase de captura e com stopPropagation,
  // para que os listeners de ESC dos TaskModal escondidos (fase de bolha) não rodem.
  React.useEffect(() => {
    if (!pickerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setPickerOpen(false)
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [pickerOpen])
  // Hoje é o dia de Sprint Final (último dia útil do mês)?
  const sprintToday = useMemo(() => isSprintDate(new Date()), [])

  const dragScroll = useDragScroll(isDraggingCard)

  // Apply filters
  const filteredTasks = useMemo(() => {
    let list = activeTasks
    if (assigneeFilter) list = list.filter(t => t.isFixed || t.assigneeId === assigneeFilter)
    if (priorityFilter) list = list.filter(t => t.isFixed || t.priority === priorityFilter)
    if (dayFilter) {
      list = list.filter(t => {
        if (t.isFixed) return true
        if (!t.dueDate) return false
        const taskDate = t.dueDate.split('T')[0]
        return taskDate === dayFilter
      })
    } else if (weekFilter) {
      const w = Number(weekFilter)
      list = list.filter(t => {
        if (t.isFixed) return true
        if (!t.dueDate) return false
        const taskDate = t.dueDate.split('T')[0]
        const { month: taskMonth, year: taskYear } = parseDateParts(taskDate)
        if (taskYear !== filterYear || taskMonth !== filterMonth) return false
        return getWeekOfMonth(taskDate, filterMonth, filterYear) === w
      })
    } else if (filterMonthActive) {
      list = list.filter(t => {
        if (t.isFixed) return true
        if (!t.dueDate) return false
        const { month: taskMonth, year: taskYear } = parseDateParts(t.dueDate.split('T')[0])
        return taskMonth === filterMonth && taskYear === filterYear
      })
    }
    // Busca por título (aplica a todas, inclusive fixas — é "encontrar", não filtrar)
    if (search.trim()) {
      const q = normSearch(search.trim())
      list = list.filter(t => normSearch(t.title).includes(q))
    }
    return list
  }, [activeTasks, assigneeFilter, priorityFilter, weekFilter, dayFilter, filterMonth, filterYear, filterMonthActive, search])

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
  }, [searchParams, loaded, activeTasks, setIsCreateOpen, router])

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
    if (pickerOpen) return // modo escolha: nada é movido
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

    // Sequential: first change status (if cross-column), then update orders
    const doDrag = async () => {
      try {
        if (srcColId !== destColId) {
          await updateTask(draggableId, { status: destColId })
        }
        if (updates.length > 0) {
          await updateTaskOrders(updates)
        }
      } catch (err) {
        console.error('Drag-and-drop error:', err)
      }
    }
    doDrag()
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

  const hasActiveFilter = assigneeFilter || priorityFilter || weekFilter || dayFilter || filterMonthActive || search.trim()
  // Column count for dynamic sizing: aim for 6 visible at 100% zoom
  const colCount = columns.length

  return (
    <div className="flex flex-col h-full">
      {/* Faixa de escolha — o kanban fica livre pra clicar no card desejado */}
      {pickerOpen && (
        <div className="shrink-0 mb-2">
          <div className="flex items-center gap-3 bg-blue-600 text-white rounded-xl px-4 py-2.5 shadow-lg shadow-blue-500/30">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <Columns2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black truncate">
                {bothOpen
                  ? 'Escolha no kanban a tarefa para trocar'
                  : 'Escolha no kanban a tarefa para abrir ao lado'}
              </p>
              <p className="text-[10px] text-blue-100 truncate">
                Clique no card desejado • dá pra usar a busca do cabeçalho • ESC cancela
              </p>
            </div>

            {/* Com as 2 abertas: qual slot o clique substitui */}
            {bothOpen && (
              <div className="flex items-center gap-1.5 shrink-0">
                {([['left', selectedTask?.title], ['right', selectedTask2?.title]] as const).map(([slot, title]) => {
                  const active = pickerSlot === slot
                  return (
                    <button
                      key={slot}
                      onClick={() => setPickerSlot(slot)}
                      title={title || ''}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black border transition cursor-pointer max-w-[150px] ${
                        active
                          ? 'bg-white text-blue-700 border-white'
                          : 'border-blue-300/60 text-blue-100 hover:bg-blue-500/40'
                      }`}
                    >
                      <span className={`px-1 py-0.5 rounded ${active ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'}`}>
                        {slot === 'left' ? '1ª' : '2ª'}
                      </span>
                      <span className="truncate">{title}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <button
              onClick={() => setPickerOpen(false)}
              title="Cancelar escolha (ESC)"
              className="p-2 rounded-lg text-blue-100 hover:text-white hover:bg-white/15 transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sprint Final — dia do último dia útil do mês */}
      {sprintToday && (
        <div className="shrink-0 mb-2">
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-1.5">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              🏁 Sprint Final — hoje é o último dia útil do mês! Conclua tarefas para desbloquear a conquista Sprint Final (5 conclusões no dia).
            </span>
          </div>
        </div>
      )}

      {/* Filter indicator */}
      {hasActiveFilter && (
        <div className="shrink-0 mb-2">
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-1.5">
            <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
              Filtro ativo
              {dayFilter && ` • ${formatDayHeader(dayFilter).full}`}
              {weekFilter && ` • Semana ${weekFilter}`}
              {!dayFilter && !weekFilter && filterMonthActive && ` • ${MONTH_PT[filterMonth]}`}
              {assigneeFilter && ' • Responsável'}
              {priorityFilter && ' • Prioridade'}
              {search.trim() && ` • Busca: "${search.trim()}"`}
            </span>
          </div>
        </div>
      )}

      {/* Kanban Board — drag to scroll */}
      <div
        ref={dragScroll.ref}
        onWheel={dragScroll.onWheel}
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
          <DragDropContext
            onDragStart={() => setIsDraggingCard(true)}
            onDragEnd={(result) => {
              setIsDraggingCard(false)
              handleDragEnd(result)
            }}
          >
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
                              {search.trim() ? 'Sem resultados' : 'Solte aqui'}
                            </div>
                          ) : (
                            colTasks.map((task, index) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                onOpenDetail={t => {
                                  // Modo escolha: o clique preenche o slot vazio/troca o escolhido
                                  if (pickerOpen) { handlePickTask(t); return }
                                  setSelectedTaskId(t.id)
                                }}
                                picking={pickerOpen}
                                pickBlocked={pickerOpen && (task.id === selectedTaskId || task.id === selectedTaskId2)}
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

      {/* Modo escolha no kanban: os modais ficam escondidos (display:none) —
          componente montado, portanto edições não salvas e sub-estados são
          preservados; o ESC deles é interceptado pelo listener em fase de
          captura da página (stopPropagation). */}
      <div style={{ display: pickerOpen ? 'none' : 'contents' }}>
        <TaskModal
          task={selectedTask || null}
          isOpen={selectedTask !== null || isCreateOpen}
          onClose={() => { setSelectedTaskId(null); setIsCreateOpen(false) }}
          initialStatus="TODO"
          splitSide={bothOpen ? 'left' : undefined}
        />

        {/* 2ª tarefa — lado a lado (50/50) quando há 2 abertas; caso contrário,
            renderiza centralizada sozinha (ao fechar a 1ª, ela "re-centra") */}
        <TaskModal
          task={selectedTask2}
          isOpen={selectedTask2 !== null}
          onClose={() => setSelectedTaskId2(null)}
          splitSide={bothOpen ? 'right' : undefined}
        />
      </div>

      {/* Botão + flutuante (só em tela larga): abre a 2ª tarefa ao lado;
          com as 2 abertas, fica no canto para trocar uma delas; escondido
          enquanto o modo escolha está ativo (a faixa tem o próprio ✕) */}
      {(selectedTask || selectedTask2) && !isCreateOpen && !pickerOpen && (
        <button
          onClick={() => setPickerOpen(true)}
          title={bothOpen ? 'Trocar uma das tarefas abertas' : 'Abrir outra tarefa ao lado'}
          className={`fixed z-[99999] hidden min-[1400px]:flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition cursor-pointer ${
            bothOpen ? 'top-2 right-2' : 'right-4 top-1/2 -translate-y-1/2'
          }`}
        >
          <Plus className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
