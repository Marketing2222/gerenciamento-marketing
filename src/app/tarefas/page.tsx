'use client'

import React, { useMemo, useState } from 'react'
import { Plus, Search, Loader2, Calendar, Paperclip, MessageSquare } from 'lucide-react'
import TaskModal from '@/components/TaskModal'
import TaskCreateModal from '@/components/TaskCreateModal'
import Avatar from '@/components/Avatar'
import { useData } from '@/context/DataContext'

export default function TasksPage() {
  const { tasks, users, loaded } = useData()

  // Filtros
  const [search, setSearch] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modals
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const selectedTask = useMemo(() => tasks.find((t) => t.id === selectedTaskId) || null, [tasks, selectedTaskId])

  const filteredTasks = useMemo(() => {
    let list = tasks.filter((t) => !t.deletedAt)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((t) => t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s))
    }
    if (assigneeFilter) list = list.filter((t) => t.assigneeId === assigneeFilter)
    if (priorityFilter) list = list.filter((t) => t.priority === priorityFilter)
    if (statusFilter) list = list.filter((t) => t.status === statusFilter)
    return list
  }, [tasks, search, assigneeFilter, priorityFilter, statusFilter])

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
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Ideia</span>
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
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 font-semibold"
          />
        </div>

        {/* Filters Wrapper */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-xs text-slate-700 dark:text-slate-300 font-bold"
          >
            <option value="">Todos os status</option>
            <option value="BACKLOG">Ideia</option>
            <option value="TODO">A Fazer</option>
            <option value="IN_PROGRESS">Em Andamento</option>
            <option value="AWAITING_APPROVAL">Aprovação</option>
            <option value="DONE">Concluído</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-xs text-slate-700 dark:text-slate-300 font-bold"
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
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-xs text-slate-700 dark:text-slate-300 font-bold"
          >
            <option value="">Todas as prioridades</option>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
      </div>

      {/* Tabular List Container */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm min-h-0">
        {!loaded ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm font-medium">Carregando lista...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-sm">
            Nenhuma tarefa localizada com os filtros selecionados.
          </div>
        ) : (
          <>
            {/* Desktop: Table */}
            <div className="hidden md:block min-w-full inline-block align-middle overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 select-none">
                <thead className="bg-slate-50/50 dark:bg-slate-900/10">
                  <tr className="text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Tarefa</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Prioridade</th>
                    <th className="px-6 py-4">Responsável</th>
                    <th className="px-6 py-4">Entrega</th>
                    <th className="px-6 py-4 text-center">Subtarefas</th>
                    <th className="px-6 py-4 text-center">Midias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-transparent text-sm">
                  {filteredTasks.map((task) => {
                    const totalItems = task.checklist.length
                    const completedItems = task.checklist.filter(i => i.isCompleted).length
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

                    return (
                      <tr 
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                            {task.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(task.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(task.priority)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={task.assignee.name} url={task.assignee.avatarUrl} size="sm" />
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

            {/* Mobile: Card list */}
            <div className="md:hidden p-3 space-y-3">
              {filteredTasks.map((task) => {
                const totalItems = task.checklist.length
                const completedItems = task.checklist.filter(i => i.isCompleted).length
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
                  >
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate mb-2">
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                      {isOverdue && (
                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Atrasada</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-3">
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <Avatar name={task.assignee.name} url={task.assignee.avatarUrl} size="sm" />
                            <span className="font-medium">{task.assignee.name.split(' ')[0]}</span>
                          </div>
                        ) : (
                          <span className="italic">Sem responsável</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {totalItems > 0 && (
                          <span className="font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-400">
                            {completedItems}/{totalItems}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : ''}`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {task.attachments.length > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Paperclip className="w-3 h-3" />
                            {task.attachments.length}
                          </span>
                        )}
                        {task.comments.length > 0 && (
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="w-3 h-3" />
                            {task.comments.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Task Creation Modal */}
      <TaskCreateModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onCreated={() => {}}
      />

      {/* Task Details Modal */}
      <TaskModal 
        task={selectedTask}
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  )
}
