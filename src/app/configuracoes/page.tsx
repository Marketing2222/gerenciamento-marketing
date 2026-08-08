'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useUser } from '@/context/UserContext'
import { useBrand } from '@/context/BrandContext'
import { useData } from '@/context/DataContext'
import { useColumns, CardSummaryConfig } from '@/context/ColumnsContext'
import { User, Shield, Camera, Loader2, Sparkles, Globe, Upload, X, Check, Columns3, Plus, Pencil, Trash2, Users } from 'lucide-react'
import Avatar from '@/components/Avatar'

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

export default function SettingsPage() {
  const { user, refreshUser } = useUser()
  const { siteName, logoUrl, applyBrand } = useBrand()
  const { saveProfile, uploadAvatar, uploadLogo, users, addUser, removeUser } = useData()
  const { columns, summary, updateColumn, updateSummary } = useColumns()
  
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
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [userForm, setUserForm] = useState<UserFormData>(EMPTY_USER_FORM)
  const [savingUser, setSavingUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState<string | null>(null)

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

      {/* Colunas Kanban */}
      <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center gap-2"><Columns3 className="w-5 h-5 text-violet-500" /><h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Colunas do Kanban</h3></div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Edite o nome, cores e o que aparece nos cards de cada coluna.</p>
        <div className="space-y-4">
          {columns.map((col, idx) => (
            <div key={col.id} className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 w-4 shrink-0">{idx + 1}</span>
                <input type="text" value={col.title} onChange={(e) => updateColumn(col.id, { title: e.target.value })} className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500" />
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border" style={{ backgroundColor: col.bgColor || col.customColor || '#3b82f6', color: col.labelColor || '#ffffff', borderColor: col.borderColor || (col.bgColor || col.customColor || '#3b82f6') + '44' }}>{col.title}</span>
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
          ))}
        </div>
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
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">{u.role === 'DESIGNER' ? 'Designer' : 'Gestor de Tráfego'}</span>
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
                <option value="DESIGNER">Designer (Artes & Audiovisual)</option>
                <option value="TRAFFIC_MANAGER">Gestor de Tráfego (Campanhas & Ads)</option>
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
                  <option value="DESIGNER">Designer</option>
                  <option value="TRAFFIC_MANAGER">Gestor de Tráfego</option>
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
    </div>
  )
}
