'use client'

import React, { useEffect, useRef, useState } from 'react'
import { X, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useKanbanFilter } from '@/context/KanbanFilterContext'

const WEEKDAY_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function getDaysOfMonth(year: number, month: number) {
  const totalDays = new Date(year, month + 1, 0).getDate()
  const days: Date[] = []
  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(year, month, d))
  }
  return days
}

function getWeekOfMonth(date: Date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  return Math.ceil((date.getDate() + firstDay) / 7)
}

export default function CalendarFilterPanel() {
  const { isCalendarOpen, setIsCalendarOpen, weekFilter, setWeekFilter, dayFilter, setDayFilter } = useKanbanFilter()
  const ref = useRef<HTMLDivElement>(null)

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  // Reset view to current month when opening
  useEffect(() => {
    if (isCalendarOpen) {
      setViewYear(now.getFullYear())
      setViewMonth(now.getMonth())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCalendarOpen])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsCalendarOpen(false)
      }
    }
    if (isCalendarOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isCalendarOpen, setIsCalendarOpen])

  if (!isCalendarOpen) return null

  const days = getDaysOfMonth(viewYear, viewMonth)

  const goBack = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }

  const goForward = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  const handleWeekClick = (w: number) => {
    if (weekFilter === String(w)) { setWeekFilter('') }
    else { setWeekFilter(String(w)); setDayFilter('') }
  }

  const handleDayClick = (d: Date) => {
    const iso = d.toISOString().split('T')[0]
    if (dayFilter === iso) { setDayFilter('') }
    else { setDayFilter(iso); setWeekFilter('') }
  }

  const clearFilters = () => { setWeekFilter(''); setDayFilter('') }

  // Group days by week
  const daysByWeek: Record<number, Date[]> = {}
  days.forEach(d => {
    const w = getWeekOfMonth(d)
    if (!daysByWeek[w]) daysByWeek[w] = []
    daysByWeek[w].push(d)
  })

  const weekKeys = Object.keys(daysByWeek).map(Number).sort((a, b) => a - b)
  const hasFilter = weekFilter || dayFilter

  return (
    <div className="fixed top-[68px] right-4 z-[75] w-[320px] animate-scale-up">
      <div ref={ref} className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with month nav */}
        <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-1">
            <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {MONTH_PT[viewMonth]} {viewYear}
              </span>
            </div>
            <button onClick={goForward} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            {hasFilter && (
              <button onClick={clearFilters} className="text-[10px] text-red-500 hover:text-red-600 font-bold px-2 py-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition">
                Limpar
              </button>
            )}
            <button onClick={() => setIsCalendarOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Week pills */}
        <div className="flex gap-1 p-2 border-b border-slate-100 dark:border-slate-800/50">
          {weekKeys.map(w => (
            <button
              key={w}
              onClick={() => handleWeekClick(w)}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${
                weekFilter === String(w)
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              Sem {w}
            </button>
          ))}
          <button
            onClick={clearFilters}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${
              !hasFilter
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todos
          </button>
        </div>

        {/* Day grid */}
        <div className="p-2 max-h-[300px] overflow-y-auto">
          {weekKeys.map(w => (
            <div key={w} className={`mb-2 rounded-xl overflow-hidden border transition ${weekFilter === String(w) ? 'border-blue-200 dark:border-blue-800' : 'border-transparent'}`}>
              <div className={`flex items-center px-2 py-1 ${weekFilter === String(w) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-900/30'}`}>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Semana {w}</span>
              </div>
              <div className="grid grid-cols-7 gap-0.5 p-1">
                {daysByWeek[w].map(d => {
                  const iso = d.toISOString().split('T')[0]
                  const isSelected = dayFilter === iso
                  const isToday = d.toDateString() === now.toDateString()
                  return (
                    <button
                      key={iso}
                      onClick={() => handleDayClick(d)}
                      className={`flex flex-col items-center py-1 rounded-lg transition ${
                        isSelected ? 'bg-blue-600 text-white shadow-sm'
                        : isToday ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-300 dark:ring-blue-700'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className={`text-[7px] font-medium ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {WEEKDAY_PT[d.getDay()]}
                      </span>
                      <span className="text-[11px] font-bold leading-none mt-0.5">{d.getDate()}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {hasFilter && (
          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-blue-50 dark:bg-blue-900/10">
            <p className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold">
              {dayFilter
                ? `Filtrando: ${new Date(dayFilter + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}`
                : `Filtrando: Semana ${weekFilter} de ${MONTH_PT[viewMonth]}`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
