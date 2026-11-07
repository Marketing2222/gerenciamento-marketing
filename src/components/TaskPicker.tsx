'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Search, X, Columns2 } from 'lucide-react'
import { useColumns, getColumnBadgeStyle } from '@/context/ColumnsContext'
import type { Task } from '@/types'

/** Busca sem depender de acento/caixa (\"vídeo\" encontra \"Video\"). */
function norm(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

interface TaskPickerProps {
  /** Tarefas candidatas (a página pode passar todas as ativas). */
  tasks: Task[]
  /** IDs das tarefas que já estão abertas — excluídas da lista. */
  openTaskIds: string[]
  /** Modo troca (só com as 2 abertas): título do slot 1 (esquerda). */
  slot1Title?: string | null
  /** Modo troca: título do slot 2 (direita). */
  slot2Title?: string | null
  /** Qual slot será substituído ao escolher uma tarefa. */
  replaceSlot?: 'left' | 'right'
  onReplaceSlotChange?: (slot: 'left' | 'right') => void
  onPick: (task: Task) => void
  onClose: () => void
}

export default function TaskPicker({
  tasks,
  openTaskIds,
  slot1Title,
  slot2Title,
  replaceSlot = 'right',
  onReplaceSlotChange,
  onPick,
  onClose,
}: TaskPickerProps) {
  const { columns } = useColumns()
  const [query, setQuery] = useState('')

  // ESC fecha SOMENTE o seletor — em fase de captura e com stopPropagation,
  // para que os listeners de ESC dos TaskModal (fase de bolha) não rodem.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const list = useMemo(() => {
    const open = new Set(openTaskIds)
    const colIndex = new Map(columns.map((c, i) => [c.id, i]))
    const q = norm(query.trim())
    return tasks
      .filter(t => t.title && !open.has(t.id))
      .filter(t => (q ? norm(t.title).includes(q) : true))
      .sort((a, b) => {
        const ia = colIndex.get(a.status) ?? 999
        const ib = colIndex.get(b.status) ?? 999
        if (ia !== ib) return ia - ib
        return a.title.localeCompare(b.title, 'pt-BR')
      })
  }, [tasks, openTaskIds, query, columns])

  const isReplaceMode = Boolean(slot1Title && slot2Title)

  return (
    <div
      className="fixed inset-0 z-[100010] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
      data-task-picker
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 shadow-md shadow-blue-500/20 flex items-center justify-center shrink-0">
              <Columns2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                {isReplaceMode ? 'Trocar tarefa aberta' : 'Abrir ao lado'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Escolha uma tarefa do kanban
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Fechar"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modo troca: escolher qual das 2 abertas substituir */}
        {isReplaceMode && onReplaceSlotChange && (
          <div className="px-5 pt-4 shrink-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Substituir qual tarefa?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {([['left', slot1Title], ['right', slot2Title]] as const).map(([slot, title]) => {
                const active = replaceSlot === slot
                return (
                  <button
                    key={slot}
                    onClick={() => onReplaceSlotChange(slot)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer min-w-0 ${
                      active
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                    title={title || ''}
                  >
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black shrink-0 ${active ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      {slot === 'left' ? '1ª' : '2ª'}
                    </span>
                    <span className="truncate">{title}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Busca */}
        <div className="px-5 pt-4 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar tarefa pelo título..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 placeholder:text-slate-400 transition"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                title="Limpar busca"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
            {list.length === 0
              ? 'Nenhuma tarefa disponível'
              : `${list.length} tarefa${list.length > 1 ? 's' : ''} disponível${list.length > 1 ? 'is' : ''}`}
          </p>
        </div>

        {/* Lista */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3">
          {list.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {query.trim() ? `Nada encontrado para "${query.trim()}"` : 'Sem tarefas para abrir'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {query.trim() ? 'Tente outro termo' : 'Todas as tarefas já estão abertas'}
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {list.map(task => {
                const col = columns.find(c => c.id === task.status)
                const badge = col ? getColumnBadgeStyle(col) : null
                return (
                  <li key={task.id}>
                    <button
                      onClick={() => onPick(task)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-blue-50 dark:hover:bg-blue-950/25 border border-transparent hover:border-blue-200 dark:hover:border-blue-900/50 transition cursor-pointer group"
                    >
                      {col && badge && (
                        <span className={`${badge.className} shrink-0 hidden sm:inline-block`} style={badge.style}>
                          {col.title}
                        </span>
                      )}
                      <span className="flex-1 min-w-0 text-sm font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300">
                        {task.title}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
