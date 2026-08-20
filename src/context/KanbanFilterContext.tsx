'use client'

import React, { createContext, useContext, useState } from 'react'

export interface KanbanFilter {
  assigneeFilter: string
  priorityFilter: string
  weekFilter: string // '' = all, '1'/'2'/'3'/'4'/'5' = week number
  dayFilter: string  // '' = all, ISO date string = specific day
}

interface KanbanFilterContextType extends KanbanFilter {
  setAssigneeFilter: (v: string) => void
  setPriorityFilter: (v: string) => void
  setWeekFilter: (v: string) => void
  setDayFilter: (v: string) => void
  clearAllFilters: () => void
  isCalendarOpen: boolean
  setIsCalendarOpen: (v: boolean) => void
  isCreateOpen: boolean
  setIsCreateOpen: (v: boolean) => void
}

const KanbanFilterContext = createContext<KanbanFilterContextType | undefined>(undefined)

export function KanbanFilterProvider({ children }: { children: React.ReactNode }) {
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [weekFilter, setWeekFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const clearAllFilters = () => {
    setAssigneeFilter('')
    setPriorityFilter('')
    setWeekFilter('')
    setDayFilter('')
  }

  return (
    <KanbanFilterContext.Provider value={{
      assigneeFilter, setAssigneeFilter,
      priorityFilter, setPriorityFilter,
      weekFilter, setWeekFilter,
      dayFilter, setDayFilter,
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
