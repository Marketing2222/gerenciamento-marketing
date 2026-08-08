'use client'

import React, { useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import { Plus, Search, Loader2, X } from 'lucide-react'
import TaskCard from '@/components/TaskCard'
import TaskModal from '@/components/TaskModal'
import TaskCreateModal from '@/components/TaskCreateModal'
import { useData } from '@/context/DataContext'
import { useColumns, getColumnBadgeStyle } from '@/context/ColumnsContext'
import { useMobileUI } from '@/context/MobileUIContext'

export default function KanbanPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const { tasks, users, loaded, updateTask } = useData()
  const { columns } = useColumns()
  const { searchOpen, registerAddTask } = useMobileUI()

  const [search, setSearch] = React.useState('')
  const [assigneeFilter, setAssigneeFilter] = React.useState('')
  const [priorityFilter, setPriorityFilter] = React.useState('')

  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null)

  const selectedTask = useMemo(() => tasks.find((t) => t.id === selectedTaskId) || null, [tasks, selectedTaskId])

  const activeTasks = useMemo(() => tasks.filter((t) => !t.deletedAt), [tasks])

  const filteredTasks = useMemo(() => {
    let list = activeTasks
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((t) => t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s))
    }
    if (assigneeFilter) list = list.filter((t) => t.assigneeId === assigneeFilter)
    if (priorityFilter) list = list.filter((t) => t.priority === priorityFilter)
    return list
  }, [activeTasks, search, assigneeFilter, priorityFilter])

  const hasFilters = search || assigneeFilter || priorityFilter

  const filteredUsers = useMemo(() => users, [users])

  React.useEffect(() => {
    if (loaded && activeTasks.length > 0) {
      const newParam = searchParams.get('new')
      const taskParam = searchParams.get('task')

      if (newParam === 'true') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsCreateOpen(true)
        router.replace('/kanban')
      } else if (taskParam) {
        const found = activeTasks.find((t) => t.id === taskParam)
        if (found) {
          setSelectedTaskId(found.id)
        }
        router.replace('/kanban')
      }
    }
  }, [searchParams, activeTasks, loaded, router])

  React.useEffect(() => {
    registerAddTask(setIsCreateOpen)
  }, [registerAddTask])

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

  const getTasksByColumn = (colId: string) => {
    return filteredTasks.filter((t) => t.status === colId)
  }

  const clearFilters = () => {
    setSearch('')
    setAssigneeFilter('')
    setPriorityFilter('')
  }

  return (
    <div className="space-y-3 sm:space-y-4 flex flex-col h-full overflow-hidden">
      {/* Mobile: Search bar (toggleable) */}
      {searchOpen && (
        <div className="md:hidden shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Desktop: Toolbar */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 font-medium"
          />
        </div>

        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-xs text-slate-700 dark:text-slate-300 font-semibold"
        >
          <option value="">Responsáveis</option>
          {filteredUsers.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-xs text-slate-700 dark:text-slate-300 font-semibold"
        >
          <option value="">Prioridades</option>
          <option value="LOW">Baixa</option>
          <option value="MEDIUM">Média</option>
          <option value="HIGH">Alta</option>
          <option value="URGENT">Urgente</option>
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            title="Limpar filtros"
            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Tarefa</span>
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto min-h-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4 md:pb-4 pb-20 md:pb-4">
        {!loaded ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm font-medium">Carregando tarefas...</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-2 sm:gap-3 h-full items-start select-none">
              {columns.map((column) => {
                const colTasks = getTasksByColumn(column.id)
                
                return (
                  <div 
                    key={column.id} 
                    className="flex-shrink-0 w-[48%] sm:flex-1 min-w-0 sm:min-w-[180px] max-h-full flex flex-col rounded-2xl bg-slate-100/60 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800"
                  >
                    {/* Column Header */}
                    <div className="p-2 sm:p-3 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <span {...getColumnBadgeStyle(column)} className="text-[10px] sm:text-xs">
                          {column.title}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1 sm:px-1.5 py-0.5 rounded-md shrink-0">
                          {colTasks.length}
                        </span>
                      </div>

                      <button
                        onClick={() => setIsCreateOpen(true)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Column Cards */}
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 overflow-y-auto p-1.5 sm:p-2 min-h-[100px] sm:min-h-[120px] transition-colors duration-250 ${
                            snapshot.isDraggingOver ? 'bg-blue-500/5 dark:bg-blue-500/3 rounded-b-2xl' : ''
                          }`}
                        >
                          {colTasks.map((task, idx) => (
                            <TaskCard 
                              key={task.id}
                              task={task}
                              index={idx}
                              onClick={(t) => setSelectedTaskId(t.id)}
                            />
                          ))}
                          {provided.placeholder}
                          
                          {colTasks.length === 0 && (
                            <div className="py-4 sm:py-6 text-center text-slate-400 text-[10px] sm:text-[11px] border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                              Solte aqui
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
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
