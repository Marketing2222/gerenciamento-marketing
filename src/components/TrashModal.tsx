'use client'

import React, { useMemo, useState } from 'react'
import { Trash2, X, RotateCcw, Loader2, Inbox } from 'lucide-react'
import Avatar from '@/components/Avatar'
import { useData } from '@/context/DataContext'

interface TrashModalProps {
  isOpen: boolean
  onClose: () => void
}

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Ideia',
  TODO: 'A Fazer',
  IN_PROGRESS: 'Em Andamento',
  AWAITING_APPROVAL: 'Aprovação',
  DONE: 'Concluído',
}

export default function TrashModal({ isOpen, onClose }: TrashModalProps) {
  const { tasks, loaded, restore, deleteForever, clearTrash } = useData()
  const [acting, setActing] = useState<string | null>(null)
  const [emptying, setEmptying] = useState(false)

  const trashTasks = useMemo(() => tasks.filter((t) => t.deletedAt), [tasks])

  const handleRestore = async (id: string) => {
    setActing(id)
    try {
      await restore(id)
    } catch (err) {
      console.error(err)
    } finally {
      setActing(null)
    }
  }

  const handleDeletePermanent = async (id: string) => {
    if (!confirm('Excluir definitivamente esta tarefa? Esta ação não pode ser desfeita.')) return
    setActing(id)
    try {
      await deleteForever(id)
    } catch (err) {
      console.error(err)
    } finally {
      setActing(null)
    }
  }

  const handleEmpty = async () => {
    if (!confirm('Esvaziar a lixeira? Todas as tarefas serão excluídas definitivamente.')) return
    setEmptying(true)
    try {
      await clearTrash()
    } catch (err) {
      console.error(err)
    } finally {
      setEmptying(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center shadow-md">
              <Trash2 className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Lixeira</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ações */}
        {trashTasks.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {trashTasks.length} {trashTasks.length === 1 ? 'tarefa' : 'tarefas'} na lixeira
            </span>
            <button
              onClick={handleEmpty}
              disabled={emptying}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-950/40 transition cursor-pointer disabled:opacity-50"
            >
              {emptying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Esvaziar Lixeira
            </button>
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!loaded ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              <p className="text-sm font-medium">Carregando lixeira...</p>
            </div>
          ) : trashTasks.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <Inbox className="w-10 h-10 mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">A lixeira está vazia.</p>
              <p className="text-xs mt-1">Itens excluídos aparecem aqui.</p>
            </div>
          ) : (
            trashTasks.map(task => (
              <div
                key={task.id}
                className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/20"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {STATUS_LABELS[task.status] || task.status}
                    </span>
                    {task.deletedAt && (
                      <span>Excluída em {new Date(task.deletedAt).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>

                {task.assignee && (
                  <Avatar name={task.assignee.name} url={task.assignee.avatarUrl} size="sm" />
                )}

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleRestore(task.id)}
                    disabled={acting === task.id}
                    title="Restaurar tarefa"
                    className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {acting === task.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeletePermanent(task.id)}
                    disabled={acting === task.id}
                    title="Excluir definitivamente"
                    className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
