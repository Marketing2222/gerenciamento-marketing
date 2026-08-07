'use client'

import React, { useState } from 'react'
import { X, Trash, Sparkles, Loader2, Calendar, User, AlertCircle, PlusCircle } from 'lucide-react'
import RichTextEditor from './RichTextEditor'
import { useData } from '@/context/DataContext'

interface TaskCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  initialStatus?: string
}

export default function TaskCreateModal({ isOpen, onClose, onCreated, initialStatus = 'TODO' }: TaskCreateModalProps) {
  const { users, addTask } = useData()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [status, setStatus] = useState(initialStatus)
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [checklist, setChecklist] = useState<{ title: string }[]>([])
  const [newCheckItem, setNewCheckItem] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Resetar estados
  React.useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle('')
      setDescription('')
      setPriority('MEDIUM')
      setStatus(initialStatus)
      setDueDate('')
      setAssigneeId('')
      setChecklist([])
      setNewCheckItem('')
      setError('')
    }
  }, [isOpen, initialStatus])

  const handleAddChecklist = () => {
    if (!newCheckItem.trim()) return
    setChecklist([...checklist, { title: newCheckItem.trim() }])
    setNewCheckItem('')
  }

  const handleRemoveChecklist = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('O título é obrigatório')
      return
    }

    setLoading(true)
    setError('')

    try {
      const assignee = users.find((u) => u.id === assigneeId) || null
      await addTask({
        title,
        description,
        priority,
        status,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
        assignee,
        checklist
      })
      onCreated()
      onClose()
    } catch (err: unknown) {
      console.error(err)
      setError('Erro ao criar tarefa')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Nova Tarefa</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Título */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Título da Tarefa</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Criar criativos para campanha Meta Ads"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-200 font-semibold"
            />
          </div>

          {/* Grid Responsável, Vencimento, Prioridade, Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Responsável */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Responsável
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="">Sem responsável</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'DESIGNER' ? 'Designer' : 'Tráfego'})
                  </option>
                ))}
              </select>
            </div>

            {/* Vencimento */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Data de Entrega
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-slate-700 dark:text-slate-300 font-medium h-[42px]"
              />
            </div>

            {/* Prioridade */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Inicial</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="BACKLOG">Ideia</option>
                <option value="TODO">A Fazer</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="AWAITING_APPROVAL">Aguardando Aprovação</option>
                <option value="DONE">Concluído</option>
              </select>
            </div>
          </div>

          {/* Descrição Tiptap */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descrição</label>
            <RichTextEditor content={description} onChange={setDescription} />
          </div>

          {/* Checklist Inicial */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subtarefas (Checklist)</label>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                placeholder="Adicionar item..."
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddChecklist()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddChecklist}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Adicionar
              </button>
            </div>

            {checklist.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 p-3 rounded-xl bg-slate-50/50 dark:bg-[#0c1220]/50">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <span className="truncate">{item.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklist(idx)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 rounded-lg transition shrink-0 cursor-pointer"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3 bg-slate-50 dark:bg-[#0e1424] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/10 transition cursor-pointer font-medium"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar Tarefa
          </button>
        </div>
      </div>
    </div>
  )
}
