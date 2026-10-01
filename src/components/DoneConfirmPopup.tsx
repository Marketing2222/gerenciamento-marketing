'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MessageCircleQuestion } from 'lucide-react'

interface DoneConfirmPopupProps {
  onConfirm: () => void
  onCancel: () => void
}

export default function DoneConfirmPopup({ onConfirm, onCancel }: DoneConfirmPopupProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 animate-scale-up">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
            <MessageCircleQuestion className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 leading-snug pt-1.5">
            Tu realmente concluiu a tarefa ou só ta marcando pra se livrar?
          </h3>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition cursor-pointer"
          >
            Sim, terminei
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
