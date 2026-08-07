'use client'

import React, { useMemo, useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react'
import TaskModal from '@/components/TaskModal'
import TaskCreateModal from '@/components/TaskCreateModal'
import Avatar from '@/components/Avatar'
import { useData } from '@/context/DataContext'

type ViewMode = 'MONTH' | 'WEEK' | 'DAY'

export default function CalendarPage() {
  const { tasks, loaded } = useData()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('MONTH')

  // Modals
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const selectedTask = useMemo(() => tasks.find((t) => t.id === selectedTaskId) || null, [tasks, selectedTaskId])

  const tasksWithDate = useMemo(
    () => tasks.filter((t) => !t.deletedAt && t.dueDate !== null),
    [tasks]
  )

  // Helpers de Data
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const navigateDate = (direction: 'prev' | 'next') => {
    const value = direction === 'next' ? 1 : -1
    const newDate = new Date(currentDate)

    if (viewMode === 'MONTH') {
      newDate.setMonth(currentDate.getMonth() + value)
    } else if (viewMode === 'WEEK') {
      newDate.setDate(currentDate.getDate() + value * 7)
    } else {
      newDate.setDate(currentDate.getDate() + value)
    }
    setCurrentDate(newDate)
  }

  const navigateToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDayClick = () => {
    setIsCreateOpen(true)
  }

  // RENDER MONTH VIEW
  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const totalDays = getDaysInMonth(year, month)
    const firstDayIndex = getFirstDayOfMonth(year, month)

    const prevMonthDays = getDaysInMonth(year, month - 1)
    const daysArray: { date: Date; isCurrentMonth: boolean }[] = []

    // Dias do mês anterior (para preencher o grid)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      daysArray.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      })
    }

    // Dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      daysArray.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }

    // Dias do mês seguinte
    const remainingCells = 42 - daysArray.length // Mantém padrão de 6 linhas (42 células)
    for (let i = 1; i <= remainingCells; i++) {
      daysArray.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }

    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Dias da Semana (Header) */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-center py-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          {weekdays.map((day, idx) => (
            <div key={idx}>{day}</div>
          ))}
        </div>

        {/* Células dos Dias */}
        <div className="grid grid-cols-7 flex-1 min-h-0 divide-x divide-y divide-slate-100 dark:divide-slate-800">
          {daysArray.map((cell, idx) => {
            const cellKey = cell.date.toISOString().split('T')[0]
            const dayTasks = tasksWithDate.filter(t => t.dueDate && t.dueDate.split('T')[0] === cellKey)
            
            const isToday = new Date().toDateString() === cell.date.toDateString()

            return (
              <div 
                key={idx} 
                className={`min-h-[60px] md:min-h-[100px] p-1 md:p-2 flex flex-col group relative ${
                  cell.isCurrentMonth ? 'bg-white dark:bg-[#151b2c]' : 'bg-slate-50/30 dark:bg-slate-900/10 text-slate-400 dark:text-slate-600'
                }`}
              >
                {/* Cabeçalho do Dia */}
                <div className="flex items-center justify-between mb-1 shrink-0">
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {cell.date.getDate()}
                  </span>
                  
                  <button
                    onClick={handleDayClick}
                    className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Lista de Tarefas do Dia */}
                <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
                  {dayTasks.map(task => {
                    const isOverdue = task.status !== 'DONE' && new Date(task.dueDate!) < new Date()
                    
                    return (
                      <button
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTaskId(task.id)
                        }}
                        className={`w-full text-[10px] p-1.5 rounded-lg border text-left font-semibold truncate block transition duration-150 cursor-pointer ${
                          task.status === 'DONE'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 line-through'
                            : isOverdue
                            ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {task.title}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // RENDER WEEK VIEW
  const renderWeekView = () => {
    // Pegar o Domingo da semana atual da currentDate
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    const daysOfWeek: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      daysOfWeek.push(d)
    }

    const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex md:grid md:grid-cols-7 overflow-x-auto md:overflow-visible flex-1 min-h-0 divide-x divide-slate-100 dark:divide-slate-800">
          {daysOfWeek.map((day, idx) => {
            const dayKey = day.toISOString().split('T')[0]
            const dayTasks = tasksWithDate.filter(t => t.dueDate && t.dueDate.split('T')[0] === dayKey)
            const isToday = new Date().toDateString() === day.toDateString()

            return (
              <div key={idx} className="flex flex-col h-full p-3 md:p-4 group min-w-[140px] md:min-w-0">
                {/* Header do Dia */}
                <div className="text-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 shrink-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{weekdays[idx]}</p>
                  <p className={`text-xl font-extrabold mt-1 w-9 h-9 mx-auto flex items-center justify-center rounded-full ${
                    isToday ? 'bg-blue-600 text-white shadow-md' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {day.getDate()}
                  </p>
                  <button
                    onClick={handleDayClick}
                    className="mt-2 text-[10px] font-bold text-blue-600 hover:text-blue-500 flex items-center justify-center gap-0.5 w-full cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Nova
                  </button>
                </div>

                {/* Tarefas na semana */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                  {dayTasks.map(task => {
                    const isOverdue = task.status !== 'DONE' && new Date(task.dueDate!) < new Date()
                    
                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`p-3 rounded-xl border text-left transition duration-200 cursor-pointer hover:shadow-sm ${
                          task.status === 'DONE'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 line-through'
                            : isOverdue
                            ? 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400'
                            : 'bg-blue-500/10 border-blue-500/25 text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        <h4 className="font-bold text-xs line-clamp-2 leading-snug">{task.title}</h4>
                        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/50 text-[9px] font-bold">
                          <span>{task.priority === 'URGENT' ? 'Urgente' : task.priority === 'HIGH' ? 'Alta' : 'Média'}</span>
                          {task.assignee && (
                            <Avatar name={task.assignee.name} url={task.assignee.avatarUrl} size="xs" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {dayTasks.length === 0 && (
                    <p className="text-center text-slate-400 text-[10px] py-10">Sem entregas</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // RENDER DAY VIEW
  const renderDayView = () => {
    const dayKey = currentDate.toISOString().split('T')[0]
    const dayTasks = tasksWithDate.filter(t => t.dueDate && t.dueDate.split('T')[0] === dayKey)
    const weekdaysFull = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado-feira']

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 md:p-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 shrink-0">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
              {weekdaysFull[currentDate.getDay()]}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
          
          <button
            onClick={handleDayClick}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {dayTasks.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              Nenhuma entrega cadastrada para este dia.
            </div>
          ) : (
            dayTasks.map(task => {
              const isOverdue = task.status !== 'DONE' && new Date(task.dueDate!) < new Date()
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition duration-200 cursor-pointer hover:shadow-sm ${
                    task.status === 'DONE'
                      ? 'bg-emerald-500/5 border-emerald-500/15 text-slate-500 dark:text-slate-400'
                      : isOverdue
                      ? 'bg-red-500/5 border-red-500/15 text-slate-800 dark:text-slate-200'
                      : 'bg-blue-500/5 border-blue-500/15 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border mr-2 ${
                      task.priority === 'URGENT' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {task.priority === 'URGENT' ? 'Urgente' : 'Normal'}
                    </span>
                    <span className={`font-bold text-sm leading-snug ${task.status === 'DONE' ? 'line-through text-slate-400' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{task.status}</span>
                    {task.assignee && (
                      <Avatar name={task.assignee.name} url={task.assignee.avatarUrl} />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // Formatador de Header
  const getHeaderTitle = () => {
    if (viewMode === 'MONTH') {
      return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    }
    if (viewMode === 'WEEK') {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} de ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
    }
    return currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Calendário de Entregas</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monitore e gerencie seus prazos de entrega visualmente.</p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-auto select-none">
          {(['MONTH', 'WEEK', 'DAY'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === mode
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {mode === 'MONTH' ? 'Mês' : mode === 'WEEK' ? 'Semana' : 'Dia'}
            </button>
          ))}
        </div>
      </div>

      {/* Date Navigation & Controls */}
      <div className="flex items-center justify-between shrink-0 bg-white dark:bg-[#151b2c] p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={navigateToToday}
            className="px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            Hoje
          </button>
        </div>

        <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200 capitalize flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 text-blue-500 shrink-0" />
          <span>{getHeaderTitle()}</span>
        </h3>
      </div>

      {/* Calendar Grid Container */}
      {!loaded ? (
        <div className="flex-1 flex flex-col items-center justify-center h-64 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
          <p className="text-sm font-medium">Carregando calendário...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {viewMode === 'MONTH' && renderMonthView()}
          {viewMode === 'WEEK' && renderWeekView()}
          {viewMode === 'DAY' && renderDayView()}
        </div>
      )}

      {/* Detail Modal */}
      <TaskModal 
        task={selectedTask}
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTaskId(null)}
      />

      {/* Create Modal */}
      <TaskCreateModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onCreated={() => {}}
        initialStatus="TODO"
      />
    </div>
  )
}
