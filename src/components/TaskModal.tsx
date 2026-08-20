'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  X, 
  Trash, 
  MessageSquare, 
  Paperclip, 
  Plus, 
  Clock, 
  Loader2, 
  Eye, 
  ExternalLink,
  Link2
} from 'lucide-react'
import RichTextEditor from './RichTextEditor'
import Avatar from './Avatar'

import { useData } from '@/context/DataContext'
import { useUser } from '@/context/UserContext'
import { Task } from '@/types'

interface TaskModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
}

export default function TaskModal({ task, isOpen, onClose }: TaskModalProps) {
  const { users, updateTask, moveToTrash, addComment, addCheckItem, toggleCheck, removeCheckItem, addFileAttachment, removeAttachment, uploadGeneral } = useData()
  const { user } = useUser()
  const [localTask, setLocalTask] = useState<Task | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [status, setStatus] = useState('TODO')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [isVisible, setIsVisible] = useState(true) // Placeholder for 'Visível' checkbox
  
  // Sub-recursos
  const [newCheckItem, setNewCheckItem] = useState('')
  const [newComment, setNewComment] = useState('')
  const [newLinkName, setNewLinkName] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [savingDesc, setSavingDesc] = useState(false)
  const [isAddingLink, setIsAddingLink] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; url: string } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carregar dados da tarefa e usuários
  useEffect(() => {
    if (task && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalTask(task)
      setTitle(task.title)
      setDescription(task.description)
      setPriority(task.priority)
      setStatus(task.status)
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '')
      setAssigneeId(task.assigneeId || '')
    }
  }, [task, isOpen])

  if (!isOpen || !localTask) return null

  // Atualizar campo específico da tarefa (no banco de dados e localmente)
  const updateTaskField = async (fields: Partial<Task>) => {
    setLocalTask((prev) => prev ? { ...prev, ...fields } : prev)
    try {
      await updateTask(localTask.id, fields)
    } catch (err) {
      console.error('Error updating task field:', err)
    }
  }

  // Deletar Tarefa
  const handleDeleteTask = async () => {
    if (!confirm('Deseja realmente excluir esta tarefa?')) return
    try {
      await moveToTrash(localTask.id)
      onClose()
    } catch (err) {
      console.error('Error deleting task:', err)
    }
  }

  // Checklist Actions
  const handleToggleChecklist = async (itemId: string, isCompleted: boolean) => {
    if (!localTask) return
    setLocalTask((prev) => prev ? { ...prev, checklist: prev.checklist.map((it) => it.id === itemId ? { ...it, isCompleted } : it) } : prev)
    try {
      await toggleCheck(localTask.id, itemId, isCompleted)
    } catch (err) {
      console.error('Error updating checklist:', err)
      setLocalTask((prev) => prev ? { ...prev, checklist: prev.checklist.map((it) => it.id === itemId ? { ...it, isCompleted: !isCompleted } : it) } : prev)
    }
  }

  const handleAddChecklist = async () => {
    if (!newCheckItem.trim() || !localTask) return
    const cTitle = newCheckItem.trim()
    setNewCheckItem('')
    const tempItem = { id: `temp_${Date.now()}`, title: cTitle, isCompleted: false }
    setLocalTask((prev) => prev ? { ...prev, checklist: [...prev.checklist, tempItem] } : prev)
    try {
      await addCheckItem(localTask.id, cTitle)
    } catch (err) {
      console.error('Error adding checklist:', err)
      setLocalTask((prev) => prev ? { ...prev, checklist: prev.checklist.filter((it) => it.id !== tempItem.id) } : prev)
      setNewCheckItem(cTitle)
    }
  }

  const handleDeleteChecklist = async (itemId: string) => {
    if (!localTask) return
    const removed = localTask.checklist.find((it) => it.id === itemId)
    setLocalTask((prev) => prev ? { ...prev, checklist: prev.checklist.filter((it) => it.id !== itemId) } : prev)
    try {
      await removeCheckItem(localTask.id, itemId)
    } catch (err) {
      console.error('Error deleting checklist item:', err)
      if (removed) setLocalTask((prev) => prev ? { ...prev, checklist: [...prev.checklist, removed] } : prev)
    }
  }

  // Comments Actions
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const content = newComment.trim()
    setNewComment('')
    const tempComment = {
      id: `temp_${Date.now()}`,
      content,
      user: user ? { id: user.id, name: user.name, avatarUrl: user.avatarUrl, role: user.role } : { id: '', name: 'Sistema', avatarUrl: '', role: '' },
      createdAt: new Date().toISOString(),
    }
    setLocalTask((prev) => prev ? { ...prev, comments: [...prev.comments, tempComment] } : prev)

    try {
      await addComment(localTask.id, content)
    } catch (err) {
      console.error('Error adding comment:', err)
      setLocalTask((prev) => prev ? { ...prev, comments: prev.comments.filter((c) => c.id !== tempComment.id) } : prev)
      setNewComment(content)
    }
  }

  // Upload Actions (File)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !localTask) return

    setUploading(true)
    try {
      const url = await uploadGeneral(file)
      await addFileAttachment(localTask.id, file.name, 'FILE', url)
    } catch (err) {
      console.error('File upload error:', err)
      alert(`Erro ao anexar arquivo: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Upload Actions (Link)
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLinkName.trim() || !newLinkUrl.trim() || !localTask) return

    const name = newLinkName.trim()
    const url = newLinkUrl.trim()
    setNewLinkName('')
    setNewLinkUrl('')
    setIsAddingLink(false)
    const tempAtt = { id: `temp_${Date.now()}`, name, type: 'LINK', url, createdAt: new Date().toISOString() }
    setLocalTask((prev) => prev ? { ...prev, attachments: [...prev.attachments, tempAtt] } : prev)
    try {
      await addFileAttachment(localTask.id, name, 'LINK', url)
    } catch (err) {
      console.error('Error adding link:', err)
      setLocalTask((prev) => prev ? { ...prev, attachments: prev.attachments.filter((a) => a.id !== tempAtt.id) } : prev)
      setNewLinkName(name)
      setNewLinkUrl(url)
      setIsAddingLink(true)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!localTask) return
    const removed = localTask.attachments.find((a) => a.id === attachmentId)
    setLocalTask((prev) => prev ? { ...prev, attachments: prev.attachments.filter((a) => a.id !== attachmentId) } : prev)
    try {
      await removeAttachment(localTask.id, attachmentId)
    } catch (err) {
      console.error('Error deleting attachment:', err)
      if (removed) setLocalTask((prev) => prev ? { ...prev, attachments: [...prev.attachments, removed] } : prev)
    }
  }

  const handleSaveDescription = async () => {
    setSavingDesc(true)
    await updateTaskField({ description })
    setSavingDesc(false)
  }

  const formatLogDate = (dateStr: unknown) => {
    if (!dateStr) return ''
    const d = dateStr && typeof dateStr === 'object' && 'toDate' in dateStr && typeof (dateStr as { toDate: unknown }).toDate === 'function'
      ? (dateStr as { toDate: () => Date }).toDate()
      : new Date(dateStr as string)
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-[1200px] bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[90vh] max-h-[900px] overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title.trim() && title !== localTask.title) {
                  updateTaskField({ title: title.trim() })
                }
              }}
              placeholder="NOME DA TAREFA"
              className="w-full text-2xl font-black uppercase text-slate-800 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-blue-500 outline-none py-1 transition duration-150 focus:ring-0 placeholder-slate-300 dark:placeholder-slate-700"
            />
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xs text-slate-400 hidden sm:inline font-medium">
              Criado por: {localTask.creator?.name || 'Sistema'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDeleteTask}
                title="Excluir Tarefa"
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
              >
                <Trash className="w-4.5 h-4.5" />
              </button>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main 3-Column Container */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-white dark:bg-[#111625]">
          
          {/* COLUMN 1: Descrição e Comentários */}
          <div className="flex-[1.3] flex flex-col p-6 space-y-8 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
            {/* Description */}
            <div className="space-y-3">
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

            {/* Comments */}
            <div className="space-y-4 pt-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Comentários ({localTask.comments.length})
              </label>

              {/* Lista de Comentários */}
              {localTask.comments.length > 0 && (
                <div className="space-y-4">
                  {localTask.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                      <Avatar name={comment.user.name} url={comment.user.avatarUrl} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{comment.user.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">({comment.user.role === 'DESIGNER' ? 'Designer' : 'Tráfego'})</span>
                          <span className="text-[10px] text-slate-400 ml-auto">{formatLogDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Novo Comentário */}
              <form onSubmit={handleAddComment} className="flex gap-3">
                <Avatar
                  name={user?.name || ''}
                  url={user?.avatarUrl}
                  className="hidden sm:block"
                />
                <div className="flex-1 space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Escreva um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 resize-none font-medium"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/80 text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/10 transition cursor-pointer"
                    >
                      Enviar Comentário
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* COLUMN 2: Checklist e Anexos */}
          <div className="flex-1 flex flex-col p-6 space-y-8 md:border-r border-slate-200 dark:border-slate-800 overflow-y-auto bg-slate-50/30 dark:bg-[#0c1220]/30">
            {/* Checklist */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Checklist (Subtarefas)</label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  placeholder="Adicionar subpasta/item..."
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 shadow-sm"
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
                  className="p-2.5 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold flex items-center border border-slate-200 dark:border-slate-700 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {localTask.checklist.length > 0 && (
                <div className="space-y-3 pt-2">
                  {localTask.checklist.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 text-sm text-slate-700 dark:text-slate-300 group">
                      <label className="flex items-start gap-3 cursor-pointer select-none min-w-0 flex-1 pt-1">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={(e) => handleToggleChecklist(item.id, e.target.checked)}
                          className="w-4.5 h-4.5 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500 text-blue-600 bg-white dark:bg-slate-900 mt-0.5"
                        />
                        <span className={`leading-relaxed ${item.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'font-medium'}`}>
                          {item.title}
                        </span>
                      </label>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteChecklist(item.id)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition shrink-0 cursor-pointer mt-0.5"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Anexos e Links */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Anexos & Links</label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingLink(!isAddingLink)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    + Adicionar Link
                  </button>
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
                <form onSubmit={handleAddLink} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 space-y-3 animate-fade-in shadow-sm">
                  <div className="grid grid-cols-1 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Nome do link (ex: Figma Layouts)"
                      value={newLinkName}
                      onChange={(e) => setNewLinkName(e.target.value)}
                      className="px-3.5 py-2 bg-slate-50 dark:bg-[#0c1220] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200"
                    />
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      className="px-3.5 py-2 bg-slate-50 dark:bg-[#0c1220] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="flex justify-end gap-2 text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingLink(false)}
                      className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                    >
                      Adicionar
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Anexos */}
              {localTask.attachments.length > 0 && (
                <div className="flex flex-col gap-2">
                  {localTask.attachments.map((file) => (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition group shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          {file.type === 'LINK' ? (
                            <Link2 className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Paperclip className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        
                        <div className="min-w-0 pr-2">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate block max-w-[200px]" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">
                            {file.type === 'LINK' ? 'Link Externo' : 'Arquivo'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                        <a
                          href={file.type === 'LINK' ? file.url : undefined}
                          target="_blank"
                          rel="noreferrer"
                          title={file.type === 'LINK' ? 'Acessar Link' : 'Visualizar'}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                          onClick={(e) => {
                            if (file.type !== 'LINK') {
                              e.preventDefault()
                              setPreviewAttachment({ name: file.name, url: file.url })
                            }
                          }}
                        >
                          {file.type === 'LINK' ? <ExternalLink className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(file.id)}
                          title="Remover"
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: Sidebar de Configurações */}
          <div className="w-full md:w-72 lg:w-80 shrink-0 p-6 space-y-7 overflow-y-auto bg-slate-50 dark:bg-[#0c1220]">
            
            {/* Status Select */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  updateTaskField({ status: e.target.value })
                }}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-bold shadow-sm"
              >
                <option value="BACKLOG">Ideia</option>
                <option value="TODO">A Fazer</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="AWAITING_APPROVAL">Aguardando Aprovação</option>
                <option value="DONE">Concluído</option>
              </select>
            </div>

            {/* Prioridade e Visível */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prioridade</label>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value)
                    updateTaskField({ priority: e.target.value })
                  }}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-bold shadow-sm"
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
              <div className="w-16 shrink-0 space-y-2 flex flex-col items-center">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Visível</label>
                <div className="flex items-center justify-center h-[42px]">
                  <input 
                    type="checkbox" 
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900 cursor-pointer" 
                  />
                </div>
              </div>
            </div>

            {/* Responsável Select */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Responsável</label>
              <select
                value={assigneeId}
                onChange={(e) => {
                  setAssigneeId(e.target.value)
                  updateTaskField({ assigneeId: e.target.value || null })
                }}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-bold shadow-sm"
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
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data Limite de Entrega</label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value)
                    updateTaskField({ dueDate: e.target.value || null })
                  }}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-bold dark:[color-scheme:dark] shadow-sm appearance-none"
                />
              </div>
            </div>

            {/* Activity History Logs */}
            <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Histórico de Atividades
              </label>

              <div className="space-y-4 pr-1">
                {localTask.activityLogs.length === 0 ? (
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 text-center py-4">Sem atividades registradas.</p>
                ) : (
                  <div className="relative pl-3.5 border-l-2 border-slate-200 dark:border-slate-800 space-y-5">
                    {localTask.activityLogs.map((log) => (
                      <div key={log.id} className="text-xs relative">
                        {/* Indicador de Timeline */}
                        <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-slate-50 dark:border-[#0c1220]" />
                        
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {log.action}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                          Por: <span className="font-bold">{log.user.name}</span> • {formatLogDate(log.createdAt)}
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

      {/* Preview Modal for file attachments */}
      {previewAttachment && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" onClick={() => setPreviewAttachment(null)}>
          <div className="relative max-w-4xl w-full bg-white dark:bg-[#111625] rounded-2xl shadow-2xl overflow-hidden animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-base font-bold text-slate-800 dark:text-slate-200 truncate">{previewAttachment.name}</span>
              <button onClick={() => setPreviewAttachment(null)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center h-[70vh] max-h-[800px] overflow-auto bg-slate-100 dark:bg-slate-950">
              {previewAttachment.url.startsWith('data:image/') ? (
                <img src={previewAttachment.url} alt={previewAttachment.name} className="max-w-full max-h-full rounded-lg object-contain shadow-sm" />
              ) : previewAttachment.url.startsWith('data:application/pdf') ? (
                <iframe src={previewAttachment.url} className="w-full h-full rounded-lg border-0 shadow-sm" title={previewAttachment.name} />
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-sm font-medium mb-3">Pré-visualização não disponível</p>
                  <a href={previewAttachment.url} download={previewAttachment.name} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold cursor-pointer shadow-md transition">
                    Baixar arquivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
