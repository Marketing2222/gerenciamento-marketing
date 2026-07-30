'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  X, 
  Trash, 
  Calendar, 
  User, 
  MessageSquare, 
  Paperclip, 
  CheckSquare, 
  Plus, 
  Clock, 
  Loader2, 
  Eye, 
  ExternalLink,
  ChevronDown,
  Sparkles,
  Link2
} from 'lucide-react'
import RichTextEditor from './RichTextEditor'

import { Task, User as UserType } from '@/types'

interface TaskModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

export default function TaskModal({ task, isOpen, onClose, onUpdated }: TaskModalProps) {
  const [localTask, setLocalTask] = useState<Task | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [status, setStatus] = useState('TODO')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [users, setUsers] = useState<UserType[]>([])
  
  // Sub-recursos
  const [newCheckItem, setNewCheckItem] = useState('')
  const [newComment, setNewComment] = useState('')
  const [newLinkName, setNewLinkName] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [savingDesc, setSavingDesc] = useState(false)
  const [isAddingLink, setIsAddingLink] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carregar dados da tarefa e usuários
  useEffect(() => {
    if (task && isOpen) {
      setLocalTask(task)
      setTitle(task.title)
      setDescription(task.description)
      setPriority(task.priority)
      setStatus(task.status)
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '')
      setAssigneeId(task.assigneeId || '')

      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (data.success) setUsers(data.users)
        })
    }
  }, [task, isOpen])

  if (!isOpen || !localTask) return null

  // Atualizar campo específico da tarefa (no banco de dados e localmente)
  const updateTaskField = async (fields: Partial<Task>) => {
    try {
      const res = await fetch(`/api/tasks/${localTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      })
      const data = await res.json()
      if (data.success) {
        // Recarregar os detalhes da tarefa e notificar o componente pai
        refreshTaskDetails()
        onUpdated()
      }
    } catch (error) {
      console.error('Error updating task field:', error)
    }
  }

  const refreshTaskDetails = async () => {
    try {
      const res = await fetch(`/api/tasks?search=`) // Buscar tarefas atuais
      const data = await res.json()
      if (data.success) {
        const found = data.tasks.find((t: Task) => t.id === localTask.id)
        if (found) {
          setLocalTask(found)
          setTitle(found.title)
          setDescription(found.description)
          setPriority(found.priority)
          setStatus(found.status)
          setDueDate(found.dueDate ? found.dueDate.split('T')[0] : '')
          setAssigneeId(found.assigneeId || '')
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Deletar Tarefa
  const handleDeleteTask = async () => {
    if (!confirm('Deseja realmente excluir esta tarefa?')) return

    try {
      const res = await fetch(`/api/tasks/${localTask.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        onUpdated()
        onClose()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Checklist Actions
  const handleToggleChecklist = async (itemId: string, isCompleted: boolean) => {
    try {
      await fetch(`/api/tasks/${localTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_CHECKLIST', itemId, isCompleted })
      })
      refreshTaskDetails()
      onUpdated()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddChecklist = async () => {
    if (!newCheckItem.trim()) return
    try {
      await fetch(`/api/tasks/${localTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_CHECKLIST', title: newCheckItem.trim() })
      })
      setNewCheckItem('')
      refreshTaskDetails()
      onUpdated()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteChecklist = async (itemId: string) => {
    try {
      await fetch(`/api/tasks/${localTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_CHECKLIST', itemId })
      })
      refreshTaskDetails()
      onUpdated()
    } catch (err) {
      console.error(err)
    }
  }

  // Comments Actions
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await fetch(`/api/tasks/${localTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_COMMENT', content: newComment.trim() })
      })
      setNewComment('')
      refreshTaskDetails()
      onUpdated()
    } catch (err) {
      console.error(err)
    }
  }

  // Upload Actions (File)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        // Criar anexo do tipo FILE na tarefa
        await fetch(`/api/tasks/${localTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ADD_ATTACHMENT',
            name: data.name,
            type: 'FILE',
            url: data.url
          })
        })
        refreshTaskDetails()
        onUpdated()
      }
    } catch (err) {
      console.error('File upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  // Upload Actions (Link)
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLinkName.trim() || !newLinkUrl.trim()) return

    try {
      await fetch(`/api/tasks/${localTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_ATTACHMENT',
          name: newLinkName.trim(),
          type: 'LINK',
          url: newLinkUrl.trim()
        })
      })
      setNewLinkName('')
      setNewLinkUrl('')
      setIsAddingLink(false)
      refreshTaskDetails()
      onUpdated()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await fetch(`/api/tasks/${localTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_ATTACHMENT', attachmentId })
      })
      refreshTaskDetails()
      onUpdated()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveDescription = async () => {
    setSavingDesc(true)
    await updateTaskField({ description })
    setSavingDesc(false)
  }

  const getPriorityLabel = (prio: string) => {
    switch (prio) {
      case 'URGENT': return 'Urgente'
      case 'HIGH': return 'Alta'
      case 'MEDIUM': return 'Média'
      default: return 'Baixa'
    }
  }

  const formatLogDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">ID: {localTask.id.substring(0, 8).toUpperCase()}</span>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-850 mx-1" />
            <span className="text-xs text-slate-400">Criado por: {localTask.creator?.name || 'Sistema'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteTask}
              title="Excluir Tarefa"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
            >
              <Trash className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Columns Container */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Column (Main Scrollable Workspace) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Title Inline Edit */}
            <div className="space-y-1.5">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title.trim() && title !== localTask.title) {
                    updateTaskField({ title: title.trim() })
                  }
                }}
                className="w-full text-xl font-bold bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-850 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-150 py-1 transition duration-150 focus:ring-0"
              />
            </div>

            {/* Description TipTap Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descrição</label>
                {description !== localTask.description && (
                  <button
                    type="button"
                    onClick={handleSaveDescription}
                    disabled={savingDesc}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {savingDesc && <Loader2 className="w-3 h-3 animate-spin" />}
                    Salvar Descrição
                  </button>
                )}
              </div>
              <RichTextEditor content={description} onChange={setDescription} />
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Checklist (Subtarefas)</label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  placeholder="Adicionar subpasta/item..."
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200"
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
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold flex items-center border border-slate-250 dark:border-slate-750 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {localTask.checklist.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-slate-50/30 dark:bg-slate-900/10 space-y-2.5">
                  {localTask.checklist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-350 group">
                      <label className="flex items-center gap-3 cursor-pointer select-none min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={(e) => handleToggleChecklist(item.id, e.target.checked)}
                          className="w-4.5 h-4.5 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500 text-blue-600 bg-white dark:bg-slate-900"
                        />
                        <span className={`truncate leading-none ${item.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                          {item.title}
                        </span>
                      </label>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteChecklist(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-1 rounded-md opacity-0 group-hover:opacity-100 transition shrink-0 cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Anexos e Links */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Anexos & Links</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingLink(!isAddingLink)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    + Adicionar Link
                  </button>
                  <span className="text-slate-200 dark:text-slate-800">|</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5" />
                    )}
                    {uploading ? 'Enviando...' : '+ Anexar Arquivo'}
                  </button>
                </div>
              </div>

              {/* Input Invisível para Uploads de Arquivos */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Form de Inclusão de Link Externo */}
              {isAddingLink && (
                <form onSubmit={handleAddLink} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-900/30 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Nome do link (ex: Figma Layouts)"
                      value={newLinkName}
                      onChange={(e) => setNewLinkName(e.target.value)}
                      className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-200"
                    />
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsAddingLink(false)}
                      className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                      Adicionar
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Anexos */}
              {localTask.attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {localTask.attachments.map((file) => (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-900/10 hover:bg-slate-50 dark:hover:bg-slate-900/35 transition group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {file.type === 'LINK' ? (
                          <Link2 className="w-4 h-4 text-blue-500 shrink-0" />
                        ) : (
                          <Paperclip className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-250 truncate block max-w-[200px]" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-450 block uppercase tracking-wider font-semibold">
                            {file.type === 'LINK' ? 'Link Externo' : 'Arquivo'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          title="Visualizar / Acessar"
                          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-550 dark:text-slate-400"
                        >
                          {file.type === 'LINK' ? <ExternalLink className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(file.id)}
                          title="Remover"
                          className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Comentários ({localTask.comments.length})
              </label>

              {/* Lista de Comentários */}
              {localTask.comments.length > 0 && (
                <div className="space-y-4">
                  {localTask.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl">
                      <img
                        src={comment.user.avatarUrl}
                        alt={comment.user.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0 bg-slate-100 border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{comment.user.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-450 font-medium">({comment.user.role === 'DESIGNER' ? 'Designer' : 'Tráfego'})</span>
                          <span className="text-[10px] text-slate-400 ml-auto">{formatLogDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Novo Comentário */}
              <form onSubmit={handleAddComment} className="flex gap-3">
                <img
                  src={users.find(u => u.id === assigneeId)?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar'}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover shrink-0 bg-slate-100 border border-slate-200 dark:border-slate-800 hidden sm:block"
                />
                <div className="flex-1 space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Arte enviada para aprovação... Cliente solicitou alteração..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 resize-none font-medium"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/80 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 transition cursor-pointer"
                    >
                      Enviar Comentário
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </div>

          {/* Right Column (Sidebar Configuration Details) */}
          <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1220] overflow-y-auto p-6 space-y-6">
            
            {/* Status Select */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  updateTaskField({ status: e.target.value })
                }}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-xs text-slate-700 dark:text-slate-350 font-bold"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">A Fazer</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="AWAITING_APPROVAL">Aguardando Aprovação</option>
                <option value="DONE">Concluído</option>
              </select>
            </div>

            {/* Prioridade Select */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value)
                  updateTaskField({ priority: e.target.value })
                }}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-xs text-slate-700 dark:text-slate-350 font-bold"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>

            {/* Responsável Select */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Responsável</label>
              <select
                value={assigneeId}
                onChange={(e) => {
                  setAssigneeId(e.target.value)
                  updateTaskField({ assigneeId: e.target.value || null })
                }}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-xs text-slate-700 dark:text-slate-350 font-bold"
              >
                <option value="">Sem responsável</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vencimento Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Data Limite de Entrega</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value)
                  updateTaskField({ dueDate: e.target.value || null })
                }}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-xs text-slate-700 dark:text-slate-350 font-bold"
              />
            </div>

            {/* Activity History Logs */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-850">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Histórico de Atividades
              </label>

              <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                {localTask.activityLogs.length === 0 ? (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Sem atividades registradas.</p>
                ) : (
                  <div className="relative pl-3 border-l border-slate-200 dark:border-slate-800 space-y-4">
                    {localTask.activityLogs.map((log) => (
                      <div key={log.id} className="text-xs relative">
                        {/* Indicador de Timeline */}
                        <div className="absolute -left-[16.5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-slate-50 dark:border-[#0c1220]" />
                        
                        <div className="font-semibold text-slate-750 dark:text-slate-300">
                          {log.action}
                        </div>
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                          Por: {log.user.name} • {formatLogDate(log.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
