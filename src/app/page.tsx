'use client'

import { useMemo } from 'react'
import { useUser } from '@/context/UserContext'
import { useData } from '@/context/DataContext'
import { 
  Kanban, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Hourglass, 
  Calendar, 
  Plus, 
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'

export default function DashboardPage() {
  const { user } = useUser()
  const { tasks, users, loaded } = useData()

  const visibleTasks = useMemo(() => tasks.filter((t) => !t.deletedAt), [tasks])

  const stats = useMemo(() => {
    const total = visibleTasks.length
    let pending = 0
    let inProgress = 0
    let awaitingApproval = 0
    let done = 0
    let overdue = 0
    const now = new Date()
    visibleTasks.forEach((task) => {
      if (task.status === 'BACKLOG' || task.status === 'TODO') {
        pending++
      } else if (task.status === 'IN_PROGRESS') {
        inProgress++
      } else if (task.status === 'AWAITING_APPROVAL') {
        awaitingApproval++
      } else if (task.status === 'DONE') {
        done++
      }
      if (task.status !== 'DONE' && task.dueDate && new Date(task.dueDate) < now) {
        overdue++
      }
    })
    return { total, pending, inProgress, awaitingApproval, done, overdue }
  }, [visibleTasks])

  const upcomingTasks = useMemo(
    () =>
      visibleTasks
        .filter((t) => t.status !== 'DONE' && t.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 5),
    [visibleTasks]
  )

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'URGENT':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">Urgente</span>
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">Alta</span>
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">Média</span>
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Baixa</span>
    }
  }

  if (!loaded) {
    return (
      <div className="flex flex-col flex-1 h-full items-center justify-center py-20 text-slate-400">
        <Clock className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <p className="text-sm font-medium">Carregando painel...</p>
      </div>
    )
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Painel do Setor de Marketing</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            {getGreeting()}, {user?.name.split(' ')[0]}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Aqui está um resumo das tarefas e entregas de hoje.
          </p>
        </div>
        
        <Link
          href="/kanban?new=true"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Tarefa</span>
        </Link>
      </div>

      {/* Stats Indicators Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'from-blue-500 to-indigo-500', icon: Kanban },
          { label: 'Pendentes', value: stats.pending, color: 'from-slate-500 to-slate-600', icon: Clock },
          { label: 'Em Andamento', value: stats.inProgress, color: 'from-amber-500 to-orange-500', icon: Play },
          { label: 'Aprovação', value: stats.awaitingApproval, color: 'from-violet-500 to-purple-500', icon: Hourglass },
          { label: 'Concluídas', value: stats.done, color: 'from-emerald-500 to-teal-500', icon: CheckCircle2 },
          { label: 'Atrasadas', value: stats.overdue, color: 'from-rose-500 to-red-600', icon: AlertCircle, isAlert: stats.overdue > 0 },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div 
              key={i} 
              className={`p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151b2c] shadow-sm relative overflow-hidden transition hover:-translate-y-1 hover:shadow-md duration-300 ${stat.isAlert ? 'border-red-200 dark:border-red-950 bg-red-50/20 dark:bg-red-950/10' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className={`text-2xl font-bold tracking-tight ${stat.isAlert ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                {stat.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Main Grid: Upcoming deadlines vs Team Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left 2 Columns: Upcoming tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>Próximas Entregas</span>
            </h3>
            <Link href="/kanban" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            {upcomingTasks.length === 0 ? (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                Nenhuma tarefa pendente com prazo de entrega cadastrada.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingTasks.map((task) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()
                  return (
                    <div key={task.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-2 sm:gap-4 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {getPriorityBadge(task.priority)}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            task.status === 'IN_PROGRESS' 
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' 
                              : task.status === 'AWAITING_APPROVAL'
                              ? 'bg-violet-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400'
                              : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {task.status === 'IN_PROGRESS' ? 'Em andamento' : task.status === 'AWAITING_APPROVAL' ? 'Aprovação' : 'A fazer'}
                          </span>
                        </div>
                        <Link href={`/kanban?task=${task.id}`} className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition block truncate pr-4">
                          {task.title}
                        </Link>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {task.dueDate && (
                          <div className="text-right">
                            <span className={`text-xs font-semibold flex items-center gap-1 ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(task.dueDate)}
                            </span>
                            {isOverdue && (
                              <span className="text-[9px] text-red-500 font-bold block uppercase tracking-wider mt-0.5">Atrasada</span>
                            )}
                          </div>
                        )}

                        {task.assignee && (
                          <Avatar name={task.assignee.name} url={task.assignee.avatarUrl} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Team Status */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Colaboradores</span>
            </h3>
            
            <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
              {users.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-xs text-center py-2">
                  Nenhum colaborador encontrado.
                </p>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <Avatar name={u.name} url={u.avatarUrl} size="lg" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{u.name}</h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                        {u.role === 'DESIGNER' ? 'Designer' : 'Gestor de Tráfego'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
