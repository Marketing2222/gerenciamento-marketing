'use client'

import React, { createContext, useContext, useState } from 'react'

export interface KanbanFilter {
  assigneeFilter: string
  priorityFilter: string
  weekFilter: string // '' = all, '1'/'2'/'3'/'4'/'5' = week number
  dayFilter: string  // '' = all, ISO date string = specific day
  filterMonth: number // 0-11, month for week/day filter
  filterYear: number  // year for week/day filter
  filterMonthActive: boolean // true when calendar month filter is active (Todos = all in month)
}

interface KanbanFilterContextType extends KanbanFilter {
  setAssigneeFilter: (v: string) => void
  setPriorityFilter: (v: string) => void
  setWeekFilter: (v: string) => void
  setDayFilter: (v: string) => void
  setFilterMonth: (v: number) => void
  setFilterYear: (v: number) => void
  setFilterMonthActive: (v: boolean) => void
  clearAllFilters: () => void
  isCalendarOpen: boolean
  setIsCalendarOpen: (v: boolean) => void
  isCreateOpen: boolean
  setIsCreateOpen: (v: boolean) => void
}

const KanbanFilterContext = createContext<KanbanFilterContextType | undefined>(undefined)

export function KanbanFilterProvider({ children }: { children: React.ReactNode }) {
  const now = new Date()
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [weekFilter, setWeekFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [filterMonth, setFilterMonth] = useState(now.getMonth())
  const [filterYear, setFilterYear] = useState(now.getFullYear())
  const [filterMonthActive, setFilterMonthActive] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const clearAllFilters = () => {
    setAssigneeFilter('')
    setPriorityFilter('')
    setWeekFilter('')
    setDayFilter('')
    setFilterMonthActive(false)
  }

  return (
    <KanbanFilterContext.Provider value={{
      assigneeFilter, setAssigneeFilter,
      priorityFilter, setPriorityFilter,
      weekFilter, setWeekFilter,
      dayFilter, setDayFilter,
      filterMonth, setFilterMonth,
      filterYear, setFilterYear,
      filterMonthActive, setFilterMonthActive,
      clearAllFilters,
      isCalendarOpen, setIsCalendarOpen,
      isCreateOpen, setIsCreateOpen,
    }}>
      {children}
    </KanbanFilterContext.Provider>
  )
}

export function useKanbanFilter() {
  const ctx = useContext(KanbanFilterContext)
  if (!ctx) throw new Error('useKanbanFilter must be used within KanbanFilterProvider')
  return ctx
}
