'use client'

import { usePathname } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import { MobileUIProvider } from '@/context/MobileUIContext'
import { KanbanFilterProvider, useKanbanFilter } from '@/context/KanbanFilterContext'
import Header from './Header'
import MobileFooter from './MobileFooter'
import CalendarFilterPanel from './CalendarFilterPanel'
import { Loader2 } from 'lucide-react'

// Inner component so it can access KanbanFilterContext
function AppInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const {
    assigneeFilter, setAssigneeFilter,
    priorityFilter, setPriorityFilter,
    setIsCalendarOpen, setIsCreateOpen,
  } = useKanbanFilter()

  const isKanban = pathname === '/kanban'

  return (
    <div className="h-dvh w-full flex flex-col bg-slate-50 dark:bg-[#080d19]">
      <Header
        onOpenCalendarFilter={isKanban ? () => setIsCalendarOpen(true) : undefined}
        onAssigneeChange={setAssigneeFilter}
        onPriorityChange={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        priorityFilter={priorityFilter}
        onCreateTask={() => setIsCreateOpen(true)}
      />
      {/* Calendar filter panel (floating, only relevant on kanban) */}
      {isKanban && <CalendarFilterPanel />}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-6">
        {children}
      </main>
      <MobileFooter />
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading } = useUser()
  const isLoginPage = pathname === '/login'

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-slate-100">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Carregando MktFlow...</p>
      </div>
    )
  }

  if (isLoginPage) return <>{children}</>
  if (!user) return null

  return (
    <MobileUIProvider>
      <KanbanFilterProvider>
        <AppInner>{children}</AppInner>
      </KanbanFilterProvider>
    </MobileUIProvider>
  )
}
