'use client'

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'

interface MobileUIState {
  searchOpen: boolean
  toggleSearch: () => void
  registerAddTask: (fn: (open: boolean) => void) => void
  openAddTask: () => void
}

const MobileUIContext = createContext<MobileUIState | null>(null)

export function MobileUIProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const addTaskFnRef = useRef<((open: boolean) => void) | null>(null)

  const toggleSearch = useCallback(() => setSearchOpen((v) => !v), [])

  const registerAddTask = useCallback((fn: (open: boolean) => void) => {
    addTaskFnRef.current = fn
  }, [])

  const openAddTask = useCallback(() => {
    addTaskFnRef.current?.(true)
  }, [])

  return (
    <MobileUIContext.Provider value={{ searchOpen, toggleSearch, registerAddTask, openAddTask }}>
      {children}
    </MobileUIContext.Provider>
  )
}

export function useMobileUI() {
  const ctx = useContext(MobileUIContext)
  if (!ctx) throw new Error('useMobileUI must be used within MobileUIProvider')
  return ctx
}
