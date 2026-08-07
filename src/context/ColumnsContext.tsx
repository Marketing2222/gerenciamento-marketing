'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { isFirebaseConfigured } from '@/lib/firebaseClient'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'

export interface KanbanColumn {
  id: string
  title: string
  color: string
  textColor: string
  darkBg: string
  darkText: string
  customColor?: string
}

export interface CardSummaryConfig {
  showPriority: boolean
  showDueDate: boolean
  showAssignee: boolean
  showChecklist: boolean
  showComments: boolean
  showAttachments: boolean
}

export function getColumnBadgeStyle(column: KanbanColumn): { className: string; style?: React.CSSProperties } {
  if (column.customColor) {
    const hex = column.customColor
    return {
      className: 'text-[11px] font-bold px-2 py-0.5 rounded-md border transition-colors',
      style: {
        backgroundColor: `${hex}22`,
        color: hex,
        borderColor: `${hex}44`
      }
    }
  }
  return {
    className: `text-[11px] font-bold px-2 py-0.5 rounded-md ${column.color || ''} ${column.textColor || ''} ${column.darkBg || ''} ${column.darkText || ''}`
  }
}

interface ColumnsContextType {
  columns: KanbanColumn[]
  summary: CardSummaryConfig
  updateColumn: (id: string, patch: Partial<KanbanColumn>) => void
  updateSummary: (patch: Partial<CardSummaryConfig>) => void
}

const ColumnsContext = createContext<ColumnsContextType | undefined>(undefined)

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'BACKLOG', title: 'Ideia', color: 'bg-slate-100', textColor: 'text-slate-700', darkBg: 'dark:bg-slate-800/40', darkText: 'dark:text-slate-300', customColor: '#64748b' },
  { id: 'TODO', title: 'A Fazer', color: 'bg-blue-50', textColor: 'text-blue-700', darkBg: 'dark:bg-blue-950/20', darkText: 'dark:text-blue-400', customColor: '#3b82f6' },
  { id: 'IN_PROGRESS', title: 'Em Andamento', color: 'bg-amber-50', textColor: 'text-amber-700', darkBg: 'dark:bg-amber-950/20', darkText: 'dark:text-amber-400', customColor: '#f59e0b' },
  { id: 'AWAITING_APPROVAL', title: 'Aguardando Aprovação', color: 'bg-purple-50', textColor: 'text-purple-700', darkBg: 'dark:bg-purple-950/20', darkText: 'dark:text-purple-400', customColor: '#a855f7' },
  { id: 'DONE', title: 'Concluído', color: 'bg-emerald-50', textColor: 'text-emerald-700', darkBg: 'dark:bg-emerald-950/20', darkText: 'dark:text-emerald-400', customColor: '#10b981' },
]

const DEFAULT_SUMMARY: CardSummaryConfig = {
  showPriority: true,
  showDueDate: true,
  showAssignee: true,
  showChecklist: true,
  showComments: true,
  showAttachments: true,
}

export function ColumnsProvider({ children }: { children: React.ReactNode }) {
  const [columns, setColumns] = useState<KanbanColumn[]>(() => {
    if (typeof window !== 'undefined' && !isFirebaseConfigured()) {
      try {
        const saved = localStorage.getItem('mktflow-columns')
        if (saved) return JSON.parse(saved)
      } catch { /* ignore */ }
    }
    return DEFAULT_COLUMNS
  })

  const [summary, setSummary] = useState<CardSummaryConfig>(() => {
    if (typeof window !== 'undefined' && !isFirebaseConfigured()) {
      try {
        const saved = localStorage.getItem('mktflow-summary')
        if (saved) return JSON.parse(saved)
      } catch { /* ignore */ }
    }
    return DEFAULT_SUMMARY
  })

  useEffect(() => {
    if (!isFirebaseConfigured()) return
    const ref = doc(db(), 'settings', 'kanban')
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data()
        if (Array.isArray(d.columns)) setColumns(d.columns)
        if (d.summary && typeof d.summary === 'object') setSummary(d.summary)
      }
    })
    return () => unsub()
  }, [])

  const persist = useCallback((cols: KanbanColumn[], sum: CardSummaryConfig) => {
    if (isFirebaseConfigured()) {
      void setDoc(doc(db(), 'settings', 'kanban'), { columns: cols, summary: sum })
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('mktflow-columns', JSON.stringify(cols))
      localStorage.setItem('mktflow-summary', JSON.stringify(sum))
    }
  }, [])

  const updateColumn = useCallback(
    (id: string, patch: Partial<Pick<KanbanColumn, 'title' | 'color' | 'textColor' | 'darkBg' | 'darkText' | 'customColor'>>) => {
      setColumns((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
        persist(next, summary)
        return next
      })
    },
    [summary, persist]
  )

  const updateSummary = useCallback(
    (patch: Partial<CardSummaryConfig>) => {
      setSummary((prev) => {
        const next = { ...prev, ...patch }
        persist(columns, next)
        return next
      })
    },
    [columns, persist]
  )

  return (
    <ColumnsContext.Provider value={{ columns, summary, updateColumn, updateSummary }}>
      {children}
    </ColumnsContext.Provider>
  )
}

export function useColumns() {
  const context = useContext(ColumnsContext)
  if (context === undefined) {
    throw new Error('useColumns must be used within a ColumnsProvider')
  }
  return context
}
