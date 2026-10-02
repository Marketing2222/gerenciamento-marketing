'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useUser } from '@/context/UserContext'
import { useBrand } from '@/context/BrandContext'
import { useData } from '@/context/DataContext'
import { useColumns, CardSummaryConfig } from '@/context/ColumnsContext'
import { User, Shield, Camera, Loader2, Sparkles, Globe, Upload, X, Check, Columns3, Plus, Pencil, Trash2, Users, GripVertical, Briefcase, Trophy } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import Avatar from '@/components/Avatar'
import { useGamification } from '@/context/GamificationContext'
import { ACHIEVEMENTS } from '@/lib/gamification/achievements'
import { iconKeys, RANK_LEVELS } from '@/lib/gamification/settings'
import { iconForLevel, titleForLevel } from '@/lib/gamification/levels'
import type { Rarity } from '@/lib/gamification/types'
import { uploadFile } from '@/lib/storage'

const RARITY_LABELS: { id: Rarity; label: string; pill: string }[] = [
  { id: 'comum', label: 'Comum', pill: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30' },
  { id: 'rara', label: 'Rara', pill: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30' },
  { id: 'epica', label: 'Épica', pill: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30' },
  { id: 'lendaria', label: 'Lendária', pill: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40' },
]

const SUMMARY_OPTIONS: { key: keyof CardSummaryConfig; label: string }[] = [
  { key: 'showPriority', label: 'Prioridade' },
  { key: 'showDueDate', label: 'Data de entrega' },
  { key: 'showAssignee', label: 'Responsável' },
  { key: 'showChecklist', label: 'Checklist' },
  { key: 'showComments', label: 'Comentários' },
  { key: 'showAttachments', label: 'Anexos' },
]

interface UserFormData {
  name: string
  role: string
  pin: string
  avatarUrl: string
}

const EMPTY_USER_FORM: UserFormData = { name: '', role: 'DESIGNER', pin: '', avatarUrl: '' }

function GamIconCell({
  cellKey,
  label,
  fallback,
  url,
  busy,
  onUpload,
  onRemove,
}: {
  cellKey: string
  label: string
  fallback: React.ReactNode
  url?: string
  busy?: boolean
  onUpload: (key: string, e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (key: string) => void
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-center">
      <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-2xl shrink-0">
        {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : fallback}
      </div>
      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight w-full truncate" title={label}>{label}</p>
      <div className="flex gap-1">
        <label className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition cursor-pointer" title="Enviar imagem">
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(cellKey, e)} />
        </label>
        {url && (
          <button
            type="button"
            onClick={() => onRemove(cellKey)}
            disabled={busy}
            title="Remover — volta ao padrão"
            className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 text-slate-500 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, refreshUser } = useUser()
  const { siteName, logoUrl, applyBrand } = useBrand()
  const { saveProfile, uploadAvatar, uploadLogo, users, addUser, removeUser, tasks, updateTask, roles, addRole, updateRole, removeRole } = useData()
  const { columns, summary, updateColumn, updateSummary, addColumn, removeColumn, reorderColumns } = useColumns()
  const { settings, saveIcon, clearIcon, saveGradient } = useGamification()
  
  const [name, setName] = useState('')
  const [role, setRole] = useState('DESIGNER')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  
  const [brandName, setBrandName] = useState(siteName)
  const [brandLogo, setBrandLogo] = useState(logoUrl)
  
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingIconKey, setUploadingIconKey] = useState<string | null>(null)
  const [gradDraft, setGradDraft] = useState<{ from: string; to: string } | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [userForm, setUserForm] = useState<UserFormData>(EMPTY_USER_FORM)
  const [savingUser, setSavingUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState<string | null>(null)

  const [showColumnModal, setShowColumnModal] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [newColumnColor, setNewColumnColor] = useState('#6366f1')
  const [addingColumn, setAddingColumn] = useState(false)

  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [roleName, setRoleName] = useState('')
  const [savingRole, setSavingRole] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const userAvatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setRole(user.role)
      setAvatarUrl(user.avatarUrl)
    }
  }, [user])

  useEffect(() => {
    setBrandName(siteName)
    setBrandLogo(logoUrl)
  }, [siteName, logoUrl])

  if (!user) return null

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    setSuccess('')
    try {
      const url = await uploadAvatar(file)
      setAvatarUrl(url)
      setSuccess('Foto carregada! Clique em salvar perfil para aplicar.')
    } catch (err) {
      setError(`Erro ao upload: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUploading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    setError('')
    try {
      const url = await uploadLogo(file)
      setBrandLogo(url)
      setSuccess('Logo carregada! Clique em "Aplicar Aparência" para salvar.')
    } catch (err) {
      setError(`Erro ao upload: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('O nome é obrigatório'); return }
    if (pin && pin !== confirmPin) { setError('PIN não confere'); return }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await saveProfile(user.id, { name: name.trim(), role, avatarUrl, pin: pin ? pin : undefined })
      setSuccess('Perfil atualizado com sucesso!')
      setPin('')
      setConfirmPin('')
      refreshUser()
    } catch (err) {
      setError('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBrand = () => {
    applyBrand(brandName, brandLogo)
    setSuccess('Aparência atualizada!')
  }

  const handleGamIconUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingIconKey(key)
    setError('')
    setSuccess('')
    try {
      const url = await uploadFile(file)
      await saveIcon(key, url)
      setSuccess('Ícone atualizado!')
    } catch (err) {
      setError(`Erro ao upload: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUploadingIconKey(null)
    }
  }

  const handleGamIconRemove = async (key: string) => {
    setUploadingIconKey(key)
    setError('')
    setSuccess('')
    try {
      await clearIcon(key)
      setSuccess('Ícone removido — usando o padrão novamente.')
    } catch (err) {
      setError(`Erro ao remover: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUploadingIconKey(null)
    }
  }

  const handleSaveGradient = async () => {
    if (!gradDraft) return
    setError('')
    try {
      await saveGradient(gradDraft.from, gradDraft.to)
      setGradDraft(null)
      setSuccess('Degradê aplicado na tela de conquistas!')
    } catch (err) {
      setError(`Erro ao salvar degradê: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const openCreateUser = () => {
    setEditingUser(null)
    setUserForm(EMPTY_USER_FORM)
    setShowUserModal(true)
  }

  const openEditUser = (u: { id: string; name: string; role: string; avatarUrl: string }) => {
    setEditingUser(u.id)
    setUserForm({ name: u.name, role: u.role, pin: '', avatarUrl: u.avatarUrl || '' })
    setShowUserModal(true)
  }

  const handleUserAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadAvatar(file)
      setUserForm((f) => ({ ...f, avatarUrl: url }))
    } catch (err) {
      setError(`Erro ao upload: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleSaveUser = async () => {
    if (!userForm.name.trim()) { setError('Nome obrigatório'); return }
    setSavingUser(true)
    setError('')
    try {
      if (editingUser) {
        await saveProfile(editingUser, { name: userForm.name.trim(), role: userForm.role, avatarUrl: userForm.avatarUrl, pin: userForm.pin || undefined })
      } else {
        await addUser({ name: userForm.name.trim(), role: userForm.role, avatarUrl: userForm.avatarUrl, pin: userForm.pin || '1234' })
      }
      setSuccess(editingUser ? 'Usuário atualizado!' : 'Usuário criado!')
      setShowUserModal(false)
    } catch (err) {
      setError(`Erro: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSavingUser(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (id === user.id) { setError('Não pode excluir a si mesmo'); return }
    if (!confirm('Excluir este usuário?')) return
    setDeletingUser(id)
    setError('')
    try {
      await removeUser(id)
      setSuccess('Usuário excluído!')
    } catch (err) {
      setError(`Erro: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setDeletingUser(null)
    }
  }

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) { setError('Nome da coluna é obrigatório'); return }
    setAddingColumn(true)
    setError('')
    try {
      addColumn(newColumnTitle.trim(), newColumnColor)
      setNewColumnTitle('')
      setNewColumnColor('#6366f1')
      setShowColumnModal(false)
      setSuccess('Coluna criada!')
    } catch (err) {
      setError(`Erro: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setAddingColumn(false)
    }
  }

  const handleRemoveColumn = async (id: string, title: string) => {
    const orphanedTasks = tasks.filter(t => t.status === id && !t.deletedAt)
    const orphanMsg = orphanedTasks.length > 0
      ? `\n\nExistem ${orphanedTasks.length} tarefa(s) nesta coluna que serão movidas para "${columns[0]?.title || 'a primeira coluna'}".`
      : ''
    if (!confirm(`Excluir a coluna "${title}"?${orphanMsg}`)) return
    // Move orphaned tasks to the first available column before removing
    if (orphanedTasks.length > 0 && columns.length > 0) {
      const firstColId = columns[0].id
      if (firstColId !== id) {
        await Promise.all(orphanedTasks.map(t => updateTask(t.id, { status: firstColId })))
      }
    }
    removeColumn(id)
    setSuccess('Coluna excluída!')
  }

  const handleColumnDragEnd = (result: DropResult) => {
    if (!result.destination) return
    reorderColumns(result.source.index, result.destination.index)
  }

  const openCreateRole = () => {
    setEditingRole(null)
    setRoleName('')
    setShowRoleModal(true)
  }

  const openEditRole = (r: { id: string; name: string }) => {
    setEditingRole(r.id)
    setRoleName(r.name)
    setShowRoleModal(true)
  }

  const handleSaveRole = async () => {
    if (!roleName.trim()) { setError('Nome da função é obrigatório'); return }
    setSavingRole(true)
    setError('')
    try {
      if (editingRole) {
        await updateRole(editingRole, roleName.trim())
        setSuccess('Função atualizada!')
      } else {
        await addRole(roleName.trim())
        setSuccess('Função criada!')
      }
      setShowRoleModal(false)
    } catch (err) {
      setError(`Erro: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSavingRole(false)
    }
  }

  const handleDeleteRole = async (id: string, name: string) => {
    const usersWithRole = users.filter(u => u.role === id)
    const orphanMsg = usersWithRole.length > 0
      ? `\n\nExistem ${usersWithRole.length} usuário(s) com esta função que perderão a referência.`
      : ''
    if (!confirm(`Excluir a função "${name}"?${orphanMsg}`)) return
    try {
      await removeRole(id)
      setSuccess('Função excluída!')
    } catch (err) {
      setError(`Erro: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in select-none">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          Personalize o site, colunas e gerencie os usuários.
        </p>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 p-4 rounded-2xl text-sm font-semibold">{error}</div>}
      {success && <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl text-sm font-semibold">{success}</div>}

      {/* Aparência */}
      <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Globe className="w-4 h-4 text-blue-500" />Aparência do Site
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nome do Site</label>
            <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="MktFlow" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-semibold" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Logo do Site</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input type="text" value={brandLogo} onChange={(e) => setBrandLogo(e.target.value)} placeholder="URL da logo" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-semibold pr-10" />
                {brandLogo && <button type="button" onClick={() => setBrandLogo('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition cursor-pointer"><X className="w-3.5 h-3.5" /></button>}
              </div>
              <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition cursor-pointer shrink-0 flex items-center gap-1.5">
                {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span className="text-xs font-semibold hidden sm:inline">Upload</span>
              </button>
              <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {brandLogo ? <img src={brandLogo} alt="Preview" className="w-10 h-10 rounded-lg object-contain border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" /> : <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"><Sparkles className="w-5 h-5 text-white" /></div>}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Preview</span>
          </div>
          <div className="flex-1" />
          <button type="button" onClick={handleSaveBrand} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer">Aplicar Aparência</button>
        </div>
      </div>

      {/* Gamificação */}
      <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Gamificação</h3>
        </div>

        {/* Degradê */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Degradê das barras e botões <span className="font-medium text-slate-400">(tela de conquistas)</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cor inicial</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={gradDraft?.from ?? settings.gradientFrom}
                  onChange={(e) => setGradDraft({ from: e.target.value, to: gradDraft?.to ?? settings.gradientTo })}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={gradDraft?.from ?? settings.gradientFrom}
                  onChange={(e) => setGradDraft({ from: e.target.value, to: gradDraft?.to ?? settings.gradientTo })}
                  className="flex-1 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-mono text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cor final</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={gradDraft?.to ?? settings.gradientTo}
                  onChange={(e) => setGradDraft({ from: gradDraft?.from ?? settings.gradientFrom, to: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={gradDraft?.to ?? settings.gradientTo}
                  onChange={(e) => setGradDraft({ from: gradDraft?.from ?? settings.gradientFrom, to: e.target.value })}
                  className="flex-1 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-mono text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Preview</label>
              <div
                className="h-4 rounded-full mb-1.5 border border-slate-200 dark:border-slate-700"
                style={{ backgroundImage: `linear-gradient(90deg, ${gradDraft?.from ?? settings.gradientFrom}, ${gradDraft?.to ?? settings.gradientTo})` }}
              />
              <button
                type="button"
                onClick={handleSaveGradient}
                disabled={!gradDraft}
                className="w-full px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:dark:bg-slate-800 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:cursor-not-allowed"
              >
                {gradDraft ? 'Aplicar degradê' : 'Degradê salvo'}
              </button>
            </div>
          </div>
        </div>

        {/* Patentes */}
        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Ícones das Patentes <span className="font-medium text-slate-400">(níveis 1–15)</span></p>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
            {Array.from({ length: RANK_LEVELS }, (_, i) => i + 1).map((lvl) => {
              const key = iconKeys.rank(lvl)
              return (
                <GamIconCell
                  key={key}
                  cellKey={key}
                  label={`${lvl} · ${titleForLevel(lvl)}`}
                  fallback={<span>{iconForLevel(lvl)}</span>}
                  url={settings.icons[key]}
                  busy={uploadingIconKey === key}
                  onUpload={handleGamIconUpload}
                  onRemove={handleGamIconRemove}
                />
              )
            })}
          </div>
        </div>

        {/* Raridades */}
        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Imagens das Raridades <span className="font-medium text-slate-400">(selo no card da conquista)</span></p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {RARITY_LABELS.map((r) => {
              const key = iconKeys.rarity(r.id)
              return (
                <GamIconCell
                  key={key}
                  cellKey={key}
                  label={r.label}
                  fallback={<span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${r.pill}`}>{r.label}</span>}
                  url={settings.icons[key]}
                  busy={uploadingIconKey === key}
                  onUpload={handleGamIconUpload}
                  onRemove={handleGamIconRemove}
                />
              )
            })}
          </div>
        </div>

        {/* Conquistas */}
        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Ícones das Conquistas <span className="font-medium text-slate-400">({ACHIEVEMENTS.length} — sem imagem usa o emoji padrão)</span></p>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
            {ACHIEVEMENTS.map((a) => {
              const key = iconKeys.achievement(a.id)
              return (
                <GamIconCell
                  key={key}
                  cellKey={key}
                  label={a.name}
                  fallback={<span>{a.icon}</span>}
                  url={settings.icons[key]}
                  busy={uploadingIconKey === key}
                  onUpload={handleGamIconUpload}
                  onRemove={handleGamIconRemove}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Colunas Kanban */}
      <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Columns3 className="w-5 h-5 text-violet-500" /><h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Colunas do Kanban</h3></div>
          <button onClick={() => setShowColumnModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"><Plus className="w-3.5 h-3.5" />Nova Coluna</button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Arraste para reordene, edite nome/cores e remova colunas.</p>
        <DragDropContext onDragEnd={handleColumnDragEnd}>
          <Droppable droppableId="columns">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                {columns.map((col, idx) => (
                  <Draggable key={col.id} draggableId={col.id} index={idx}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 ${snapshot.isDragging ? 'shadow-lg ring-2 ring-violet-500/30' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 w-4 shrink-0">{idx + 1}</span>
                          <input type="text" value={col.title} onChange={(e) => updateColumn(col.id, { title: e.target.value })} className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" />
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border" style={{ backgroundColor: col.bgColor || col.customColor || '#3b82f6', color: col.labelColor || '#ffffff', borderColor: col.borderColor || (col.bgColor || col.customColor || '#3b82f6') + '44' }}>{col.title}</span>
                          <button onClick={() => handleRemoveColumn(col.id, col.title)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer" title="Excluir coluna"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Fundo', value: col.bgColor || col.customColor || '#3b82f6', field: 'bgColor' as const },
                            { label: 'Texto', value: col.labelColor || '#ffffff', field: 'labelColor' as const },
                            { label: 'Borda', value: col.borderColor || (col.bgColor || col.customColor || '#3b82f6'), field: 'borderColor' as const },
                          ].map((c) => (
                            <div key={c.field} className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{c.label}</label>
                              <div className="flex items-center gap-2">
                                <input type="color" value={c.value} onChange={(e) => updateColumn(col.id, { [c.field]: e.target.value, ...(c.field === 'bgColor' ? { customColor: e.target.value } : {}) })} className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent" />
                                <input type="text" value={c.value} onChange={(e) => updateColumn(col.id, { [c.field]: e.target.value, ...(c.field === 'bgColor' ? { customColor: e.target.value } : {}) })} className="flex-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">Resumo do Card</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SUMMARY_OPTIONS.map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer">
                <input type="checkbox" checked={summary[opt.key]} onChange={(e) => updateSummary({ [opt.key]: e.target.checked })} className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Funções/Setores */}
      <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-amber-500" /><h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Funções / Setores</h3></div>
          <button onClick={openCreateRole} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"><Plus className="w-3.5 h-3.5" />Nova Função</button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Gerencie as funções/setores disponíveis para atribuir aos usuários.</p>
        {roles.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">Nenhuma função cadastrada. Crie uma para começar.</p>
        ) : (
          <div className="space-y-2">
            {roles.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-950/30 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{r.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEditRole(r)} className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition cursor-pointer" title="Editar"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteRole(r.id, r.name)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usuários */}
      <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /><h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Usuários</h3></div>
          <button onClick={openCreateUser} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"><Plus className="w-3.5 h-3.5" />Novo Usuário</button>
        </div>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <Avatar name={u.name} url={u.avatarUrl} size="lg" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{u.name}</h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">{roles.find(r => r.id === u.role)?.name || u.role}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEditUser(u)} className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition cursor-pointer" title="Editar"><Pencil className="w-4 h-4" /></button>
                {u.id !== user.id && <button onClick={() => handleDeleteUser(u.id)} disabled={deletingUser === u.id} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer disabled:opacity-50" title="Excluir">{deletingUser === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Perfil Pessoal */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col items-center text-center">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Sua Foto</label>
          <div className="relative group mb-6">
            <Avatar name={name} url={avatarUrl} size="3xl" className="border-2 border-slate-200 dark:border-slate-800" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute inset-0 rounded-full bg-slate-950/50 backdrop-blur-xs flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer">
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          <p className="text-[10px] text-slate-400 mb-4">Envie uma foto para usar como perfil.</p>
        </div>
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800"><User className="w-4 h-4 text-blue-500" />Informações do Cadastro</h3>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nome Completo</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-semibold" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Função / Setor</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-700 dark:text-slate-300 font-semibold">
                {roles.length === 0 ? (
                  <>
                    <option value="DESIGNER">Designer (Artes & Audiovisual)</option>
                    <option value="TRAFFIC_MANAGER">Gestor de Tráfego (Campanhas & Ads)</option>
                  </>
                ) : (
                  roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)
                )}
              </select>
            </div>
          </div>
          <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800"><Shield className="w-4 h-4 text-blue-500" />Segurança e Acesso</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Novo PIN</label>
                <input type="password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Novo PIN" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirmar PIN</label>
                <input type="password" maxLength={6} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} placeholder="Repita o PIN" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">Deixe em branco para manter o PIN atual.</p>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving || !name.trim()} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/10 transition cursor-pointer flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Salvar Alterações
            </button>
          </div>
        </div>
      </form>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => setShowUserModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <Avatar name={userForm.name || '?'} url={userForm.avatarUrl} size="xl" className="border-2 border-slate-200 dark:border-slate-700" />
                  <button type="button" onClick={() => userAvatarInputRef.current?.click()} className="absolute inset-0 rounded-full bg-slate-950/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"><Camera className="w-4 h-4" /></button>
                  <input type="file" ref={userAvatarInputRef} onChange={handleUserAvatarUpload} accept="image/*" className="hidden" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Foto do Perfil</label>
                  <p className="text-[10px] text-slate-400">Passe o mouse na foto para alterar</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nome Completo</label>
                <input type="text" value={userForm.name} onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome do usuário" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-semibold" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Função / Setor</label>
                <select value={userForm.role} onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-700 dark:text-slate-300 font-semibold">
                  {roles.length === 0 ? (
                    <>
                      <option value="DESIGNER">Designer</option>
                      <option value="TRAFFIC_MANAGER">Gestor de Tráfego</option>
                    </>
                  ) : (
                    roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)
                  )}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">PIN de Acesso {editingUser && '(deixe vazio para manter)'}</label>
                <input type="password" maxLength={6} value={userForm.pin} onChange={(e) => setUserForm((f) => ({ ...f, pin: e.target.value }))} placeholder={editingUser ? '••••' : 'PIN padrão: 1234'} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition cursor-pointer">Cancelar</button>
                <button type="button" onClick={handleSaveUser} disabled={savingUser || !userForm.name.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2">
                  {savingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{editingUser ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Column Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white">Nova Coluna</h3>
              <button onClick={() => setShowColumnModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nome da Coluna</label>
                <input type="text" value={newColumnTitle} onChange={(e) => setNewColumnTitle(e.target.value)} placeholder="Ex: Lead Ganho" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-semibold" autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cor da Coluna</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={newColumnColor} onChange={(e) => setNewColumnColor(e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent" />
                  <input type="text" value={newColumnColor} onChange={(e) => setNewColumnColor(e.target.value)} className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Preview</p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: newColumnColor, color: '#ffffff' }}>{newColumnTitle || 'Nome'}</span>
                  <span className="text-[10px] text-slate-400 font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded-md">0</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowColumnModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition cursor-pointer">Cancelar</button>
                <button type="button" onClick={handleAddColumn} disabled={addingColumn || !newColumnTitle.trim()} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2">
                  {addingColumn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Criar Coluna
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white">{editingRole ? 'Editar Função' : 'Nova Função'}</h3>
              <button onClick={() => setShowRoleModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nome da Função / Setor</label>
                <input type="text" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Ex: Designer, Gestor de Tráfego, Social Media..." className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-semibold" autoFocus />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRoleModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition cursor-pointer">Cancelar</button>
                <button type="button" onClick={handleSaveRole} disabled={savingRole || !roleName.trim()} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2">
                  {savingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{editingRole ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
