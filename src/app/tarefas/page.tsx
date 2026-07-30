'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Search, Filter, Loader2, RefreshCw, Calendar, CheckSquare, MessageSquare, Paperclip, ChevronRight, User } from 'lucide-react'
import TaskModal from '@/components/TaskModal'
import TaskCreateModal from '@/components/TaskCreateModal'

import { Task, User as UserType } from '@/types'

const statusLabels: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'A Fazer',
  IN_PROGRESS: 'Em Andamento',
  AWAITING_APPROVAL: 'Aprovação',
  DONE: 'Concluído'
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modals
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const qParams = new URLSearchParams()
      if (search) qParams.append('search', search)
      if (assigneeFilter) qParams.append('assigneeId', assigneeFilter)
      if (priorityFilter) qParams.append('priority', priorityFilter)
      if (statusFilter) qParams.append('status', statusFilter)

      const [resTasks, resUsers] = await Promise.all([
        fetch(`/api/tasks?${qParams.toString()}`),
        fetch('/api/users')
      ])

      const dataTasks = await resTasks.json()
      const dataUsers = await resUsers.json()

      if (dataTasks.success) setTasks(dataTasks.tasks)
      if (dataUsers.success) setUsers(dataUsers.users)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [search, assigneeFilter, priorityFilter, statusFilter])

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'URGENT':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">Urgente</span>
      case 'HIGH':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">Alta</span>
      case 'MEDIUM':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">Média</span>
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Baixa</span>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DONE':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400">Concluído</span>
      case 'AWAITING_APPROVAL':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400">Aprovação</span>
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400">Em Andamento</span>
      case 'TODO':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400">A Fazer</span>
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400">Backlog</span>
    }
  }

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Lista Geral de Tarefas</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Busque, filtre e gerencie todas as demandas em formato de lista.</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Tarefa</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 shrink-0 bg-white dark:bg-[#151b2c] p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar pelo título ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 font-semibold"
          />
        </div>

        {/* Filters Wrapper */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-xs text-slate-700 dark:text-slate-350 font-bold"
          >
            <option value="">Todos os status</option>
            <option value="BACKLOG">Backlog</option>
            <option value="TODO">A Fazer</option>
            <option value="IN_PROGRESS">Em Andamento</option>
            <option value="AWAITING_APPROVAL">Aprovação</option>
            <option value="DONE">Concluído</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-xs text-slate-700 dark:text-slate-350 font-bold"
          >
            <option value="">Todos os responsáveis</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-xs text-slate-700 dark:text-slate-350 font-bold"
          >
            <option value="">Todas as prioridades</option>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            title="Recarregar"
            className="p-2 border border-slate-250 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 dark:text-slate-400 shrink-0 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabular List Container */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm font-medium">Carregando lista...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-sm">
            Nenhuma tarefa localizada com os filtros selecionados.
          </div>
        ) : (
          <div className="min-w-full inline-block align-middle overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-850 select-none">
              <thead className="bg-slate-50/50 dark:bg-slate-900/10">
                <tr className="text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                  <th className="px-6 py-4">Tarefa</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Prioridade</th>
                  <th className="px-6 py-4">Responsável</th>
                  <th className="px-6 py-4">Entrega</th>
                  <th className="px-6 py-4 text-center">Subtarefas</th>
                  <th className="px-6 py-4 text-center">Midias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 bg-transparent text-sm">
                {tasks.map((task) => {
                  const totalItems = task.checklist.length
                  const completedItems = task.checklist.filter(i => i.isCompleted).length
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

                  return (
                    <tr 
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md group-hover:text-blue-600 dark:group-hover:text-blue-450 transition">
                          {task.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(task.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(task.priority)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={task.assignee.avatarUrl}
                              alt="Avatar"
                              className="w-6 h-6 rounded-full object-cover bg-slate-100 border border-slate-200"
                            />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{task.assignee.name.split(' ')[0]}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sem responsável</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.dueDate ? (
                          <span className={`text-xs font-semibold flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                            {isOverdue && <span className="text-[9px] uppercase tracking-wider text-red-500 ml-1">Atrasada</span>}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {totalItems > 0 ? (
                          <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-400">
                            {completedItems}/{totalItems}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-3 text-slate-400">
                          {task.attachments.length > 0 && (
                            <span className="flex items-center gap-0.5 text-xs" title="Anexos">
                              <Paperclip className="w-3.5 h-3.5" />
                              {task.attachments.length}
                            </span>
                          )}
                          {task.comments.length > 0 && (
                            <span className="flex items-center gap-0.5 text-xs" title="Comentários">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {task.comments.length}
                            </span>
                          )}
                          {task.attachments.length === 0 && task.comments.length === 0 && (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Creation Modal */}
      <TaskCreateModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onCreated={loadData}
      />

      {/* Task Details Modal */}
      <TaskModal 
        task={selectedTask}
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        onUpdated={loadData}
      />
    </div>
  )
}
