'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useUser } from '@/context/UserContext'
import { useBrand } from '@/context/BrandContext'
import { useData } from '@/context/DataContext'
import { useColumns, CardSummaryConfig } from '@/context/ColumnsContext'
import { User, Shield, Camera, Loader2, Sparkles, Globe, Upload, X, Check, Columns3, Palette, Hash } from 'lucide-react'
import Avatar from '@/components/Avatar'

const COLOR_PRESETS = [
  { label: 'Cinza', hex: '#64748b' },
  { label: 'Azul', hex: '#3b82f6' },
  { label: 'Amarelo', hex: '#f59e0b' },
  { label: 'Roxo', hex: '#a855f7' },
  { label: 'Verde', hex: '#10b981' },
  { label: 'Vermelho', hex: '#ef4444' },
  { label: 'Rosa', hex: '#ec4899' },
  { label: 'Ciano', hex: '#06b6d4' },
  { label: 'Laranja', hex: '#f97316' },
  { label: 'Índigo', hex: '#6366f1' },
]

const SUMMARY_OPTIONS: { key: keyof CardSummaryConfig; label: string }[] = [
  { key: 'showPriority', label: 'Prioridade' },
  { key: 'showDueDate', label: 'Data de entrega' },
  { key: 'showAssignee', label: 'Responsável' },
  { key: 'showChecklist', label: 'Checklist' },
  { key: 'showComments', label: 'Comentários' },
  { key: 'showAttachments', label: 'Anexos' },
]

export default function SettingsPage() {
  const { user, refreshUser } = useUser()
  const { siteName, logoUrl, applyBrand } = useBrand()
  const { saveProfile, uploadAvatar, uploadLogo } = useData()
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

  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(user.name)
      setRole(user.role)
      setAvatarUrl(user.avatarUrl)
    }
  }, [user])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      setSuccess('Foto carregada com sucesso! Clique em salvar perfil para aplicar.')
    } catch (err) {
      console.error(err)
      setError(`Erro ao fazer upload da imagem: ${err instanceof Error ? err.message : String(err)}`)
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
      console.error(err)
      setError(`Erro ao fazer upload da logo: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('O nome é obrigatório')
      return
    }

    if (pin && pin !== confirmPin) {
      setError('A confirmação do PIN não confere')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await saveProfile(user.id, {
        name: name.trim(),
        role,
        avatarUrl,
        pin: pin ? pin : undefined
      })
      setSuccess('Configurações atualizadas com sucesso!')
      setPin('')
      setConfirmPin('')
      refreshUser()
    } catch (err) {
      console.error(err)
      setError('Erro ao salvar alterações')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBrand = () => {
    applyBrand(brandName, brandLogo)
    setSuccess('Aparência do site atualizada!')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in select-none">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          Personalize o site, seu perfil e credenciais de acesso.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 p-4 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl text-sm font-semibold">
          {success}
        </div>
      )}

      {/* Aparência do Site */}
      <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Globe className="w-4 h-4 text-blue-500" />
          Aparência do Site
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nome do Site</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="MktFlow"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Logo do Site</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={brandLogo}
                  onChange={(e) => setBrandLogo(e.target.value)}
                  placeholder="URL da logo (ou use o upload)"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-semibold pr-10"
                />
                {brandLogo && (
                  <button
                    type="button"
                    onClick={() => setBrandLogo('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                title="Enviar logo do computador"
                className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                {uploadingLogo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span className="text-xs font-semibold hidden sm:inline">Upload</span>
              </button>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {brandLogo ? (
              <img src={brandLogo} alt="Preview" className="w-10 h-10 rounded-lg object-contain border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Preview do logo no header</span>
          </div>

          <div className="flex-1" />

          <button
            type="button"
            onClick={handleSaveBrand}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Aplicar Aparência
          </button>
        </div>
      </div>

      {/* Kanban Columns Config */}
      <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Columns3 className="w-5 h-5 text-violet-500" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Colunas do Kanban</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Edite o nome, cor e o que aparece nos cards de cada coluna.</p>

        <div className="space-y-3">
          {columns.map((col, idx) => (
            <div key={col.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 w-4 shrink-0">{idx + 1}</span>
                <input
                  type="text"
                  value={col.title}
                  onChange={(e) => updateColumn(col.id, { title: e.target.value })}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              {/* Color picker */}
              <div className="flex flex-wrap gap-1 shrink-0">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    title={preset.label}
                    onClick={() => updateColumn(col.id, { customColor: preset.hex })}
                    className={`w-5 h-5 rounded-full border-2 transition cursor-pointer ${
                      col.customColor === preset.hex
                        ? 'border-blue-500 scale-110'
                        : 'border-transparent hover:border-slate-300'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Card Summary */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">Resumo do Card (aparece em todas as colunas)</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SUMMARY_OPTIONS.map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={summary[opt.key]}
                  onChange={(e) => updateSummary({ [opt.key]: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Avatar */}
        <div className="md:col-span-1 bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col items-center text-center">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Sua Foto</label>
          
          <div className="relative group mb-6">
            <Avatar
              name={name}
              url={avatarUrl}
              size="3xl"
              className="border-2 border-slate-200 dark:border-slate-800"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-slate-950/50 backdrop-blur-xs flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            className="hidden"
          />

          <p className="text-[10px] text-slate-400 mb-4">
            Envie uma foto para usar como seu perfil.
          </p>
        </div>

        {/* Form */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <User className="w-4 h-4 text-blue-500" />
              Informações do Cadastro
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Função / Setor</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-700 dark:text-slate-300 font-semibold"
              >
                <option value="DESIGNER">Designer (Artes & Audiovisual)</option>
                <option value="TRAFFIC_MANAGER">Gestor de Tráfego (Campanhas & Ads)</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Shield className="w-4 h-4 text-blue-500" />
              Segurança e Acesso
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Novo PIN (Opcional)</label>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Defina um novo PIN de acesso"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirmar Novo PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Repita o novo PIN"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Deixe em branco se não desejar alterar o seu PIN de acesso atual.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/10 transition cursor-pointer flex items-center gap-2 font-medium"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Salvar Alterações
            </button>
          </div>

        </div>

      </form>

    </div>
  )
}
