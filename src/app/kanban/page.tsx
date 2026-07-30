'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import { Plus, Search, Loader2, RefreshCw, X } from 'lucide-react'
import TaskCard from '@/components/TaskCard'
import TaskModal from '@/components/TaskModal'
import TaskCreateModal from '@/components/TaskCreateModal'

import { Task, User } from '@/types'

const COLUMNS = [
  { id: 'BACKLOG', title: 'Backlog', color: 'bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-350' },
  { id: 'TODO', title: 'A Fazer', color: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400' },
  { id: 'IN_PROGRESS', title: 'Em Andamento', color: 'bg-amber-55 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400' },
  { id: 'AWAITING_APPROVAL', title: 'Aguardando Aprovação', color: 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400' },
  { id: 'DONE', title: 'Concluído', color: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' }
]

export default function KanbanPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const hasFilters = search || assigneeFilter || priorityFilter

  const loadData = async () => {
    setLoading(true)
    try {
      const qParams = new URLSearchParams()
      if (search) qParams.append('search', search)
      if (assigneeFilter) qParams.append('assigneeId', assigneeFilter)
      if (priorityFilter) qParams.append('priority', priorityFilter)

      const [resTasks, resUsers] = await Promise.all([
        fetch(`/api/tasks?${qParams.toString()}`),
        fetch('/api/users')
      ])

      const dataTasks = await resTasks.json()
      const dataUsers = await resUsers.json()

      if (dataTasks.success) setTasks(dataTasks.tasks)
      if (dataUsers.success) setUsers(dataUsers.users)
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [search, assigneeFilter, priorityFilter])

  useEffect(() => {
    if (!loading && tasks.length > 0) {
      const newParam = searchParams.get('new')
      const taskParam = searchParams.get('task')

      if (newParam === 'true') {
        setIsCreateOpen(true)
        router.replace('/kanban')
      } else if (taskParam) {
        const found = tasks.find(t => t.id === taskParam)
        if (found) {
          setSelectedTask(found)
        }
        router.replace('/kanban')
      }
    }
  }, [searchParams, tasks, loading])

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const updatedTasks = [...tasks]
    const taskIndex = updatedTasks.findIndex(t => t.id === draggableId)
    if (taskIndex !== -1) {
      const originalStatus = updatedTasks[taskIndex].status
      updatedTasks[taskIndex].status = destination.droppableId
      setTasks(updatedTasks)

      try {
        const res = await fetch(`/api/tasks/${draggableId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: destination.droppableId })
        })
        const data = await res.json()
        if (!data.success) {
          updatedTasks[taskIndex].status = originalStatus
          setTasks(updatedTasks)
        } else {
          loadData()
        }
      } catch (err) {
        console.error(err)
        updatedTasks[taskIndex].status = originalStatus
        setTasks(updatedTasks)
      }
    }
  }

  const getTasksByColumn = (colId: string) => {
    return tasks.filter(t => t.status === colId)
  }

  const clearFilters = () => {
    setSearch('')
    setAssigneeFilter('')
    setPriorityFilter('')
  }

  return (
    <div className="space-y-4 flex flex-col h-full overflow-hidden">
      {/* Toolbar: search + filters + actions — all in one row */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
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

        {/* Assignee Filter */}
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-xs text-slate-700 dark:text-slate-300 font-semibold hidden md:block"
        >
          <option value="">Responsáveis</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-xs text-slate-700 dark:text-slate-300 font-semibold hidden md:block"
        >
          <option value="">Prioridades</option>
          <option value="LOW">Baixa</option>
          <option value="MEDIUM">Média</option>
          <option value="HIGH">Alta</option>
          <option value="URGENT">Urgente</option>
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            title="Limpar filtros"
            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Refresh */}
        <button
          onClick={loadData}
          title="Recarregar"
          className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 shrink-0 transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Nova Tarefa */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Nova Tarefa</span>
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto min-h-0 -mx-8 px-8 pb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm font-medium">Carregando tarefas...</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-3 h-full items-start select-none">
              {COLUMNS.map((column) => {
                const colTasks = getTasksByColumn(column.id)
                
                return (
                  <div 
                    key={column.id} 
                    className="flex-1 min-w-[180px] max-h-full flex flex-col rounded-2xl bg-slate-100/60 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800"
                  >
                    {/* Column Header */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${column.color}`}>
                          {column.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded-md">
                          {colTasks.length}
                        </span>
                      </div>

                      <button
                        onClick={() => setIsCreateOpen(true)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
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
                          className={`flex-1 overflow-y-auto p-2 min-h-[120px] transition-colors duration-250 ${
                            snapshot.isDraggingOver ? 'bg-blue-500/5 dark:bg-blue-500/3 rounded-b-2xl' : ''
                          }`}
                        >
                          {colTasks.map((task, idx) => (
                            <TaskCard 
                              key={task.id}
                              task={task}
                              index={idx}
                              onClick={(t) => setSelectedTask(t)}
                            />
                          ))}
                          {provided.placeholder}
                          
                          {colTasks.length === 0 && (
                            <div className="py-6 text-center text-slate-400 text-[11px] border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
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
        onCreated={loadData}
      />

      <TaskModal 
        task={selectedTask}
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        onUpdated={loadData}
      />
    </div>
  )
}
