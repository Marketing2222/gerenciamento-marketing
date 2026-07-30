'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useUser } from '@/context/UserContext'
import { useBrand } from '@/context/BrandContext'
import { User, Shield, Camera, Loader2, Check, Sparkles, Globe, Upload, X } from 'lucide-react'

const AVATAR_CATEGORIES = {
  'Marvel': [
    { name: 'Homem-Aranha', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=SpiderMan&backgroundColor=b6e3f4' },
    { name: 'Iron Man', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=IronMan&backgroundColor=ffdfbf' },
    { name: 'Capitão América', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=CaptainAmerica&backgroundColor=c0aede' },
    { name: 'Thor', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Thor&backgroundColor=d1d4f9' },
    { name: 'Hulk', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Hulk&backgroundColor=b6e3f4' },
    { name: 'Viúva Negra', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=BlackWidow&backgroundColor=ffd5dc' },
    { name: 'Deadpool', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Deadpool&backgroundColor=ffdfbf' },
    { name: 'Wolverine', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Wolverine&backgroundColor=c0aede' },
    { name: 'Pantera Negra', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=BlackPanther&backgroundColor=d1d4f9' },
    { name: 'Doutor Estranho', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=DoctorStrange&backgroundColor=b6e3f4' },
    { name: 'Falcão', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Falcon&backgroundColor=ffdfbf' },
    { name: 'Visão', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Vision&backgroundColor=c0aede' },
  ],
  'DC & Batman': [
    { name: 'Batman', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Batman&backgroundColor=d1d4f9' },
    { name: 'Superman', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Superman&backgroundColor=b6e3f4' },
    { name: 'Mulher Maravilha', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=WonderWoman&backgroundColor=ffd5dc' },
    { name: 'Flash', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=TheFlash&backgroundColor=ffdfbf' },
    { name: 'Aquaman', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Aquaman&backgroundColor=c0aede' },
    { name: 'Coringa', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Joker&backgroundColor=d1d4f9' },
    { name: 'Lex Luthor', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=LexLuthor&backgroundColor=b6e3f4' },
    { name: 'Harley Quinn', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=HarleyQuinn&backgroundColor=ffd5dc' },
    { name: 'Green Lantern', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=GreenLantern&backgroundColor=ffdfbf' },
    { name: 'Cyborg', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cyborg&backgroundColor=c0aede' },
  ],
  'Filmes & Séries': [
    { name: 'Darth Vader', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=DarthVader&backgroundColor=d1d4f9' },
    { name: 'Luke Skywalker', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=LukeSkywalker&backgroundColor=b6e3f4' },
    { name: 'Yoda', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Yoda&backgroundColor=ffdfbf' },
    { name: 'Harry Potter', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=HarryPotter&backgroundColor=c0aede' },
    { name: 'Hermione', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Hermione&backgroundColor=ffd5dc' },
    { name: 'Frodo', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Frodo&backgroundColor=d1d4f9' },
    { name: 'Gandalf', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Gandalf&backgroundColor=b6e3f4' },
    { name: 'Neo Matrix', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=NeoMatrix&backgroundColor=ffdfbf' },
    { name: 'John Wick', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=JohnWick&backgroundColor=c0aede' },
    { name: 'Indiana Jones', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=IndianaJones&backgroundColor=d1d4f9' },
    { name: 'Jack Sparrow', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=JackSparrow&backgroundColor=b6e3f4' },
    { name: 'Buzz Lightyear', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=BuzzLightyear&backgroundColor=ffdfbf' },
  ],
  'God of War': [
    { name: 'Kratos', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Kratos&backgroundColor=c0aede' },
    { name: 'Atreus', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Atreus&backgroundColor=d1d4f9' },
    { name: 'Freya', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Freya&backgroundColor=ffd5dc' },
    { name: 'Mimir', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Mimir&backgroundColor=b6e3f4' },
    { name: 'Baldur', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Baldur&backgroundColor=ffdfbf' },
    { name: 'Thamur', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Thamur&backgroundColor=c0aede' },
    { name: 'Magni', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Magni&backgroundColor=d1d4f9' },
    { name: 'Modi', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Modi&backgroundColor=b6e3f4' },
  ],
  'Games & Outros': [
    { name: 'Mario', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Mario&backgroundColor=ffdfbf' },
    { name: 'Link Zelda', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=LinkZelda&backgroundColor=c0aede' },
    { name: 'Master Chief', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=MasterChief&backgroundColor=d1d4f9' },
    { name: 'Lara Croft', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=LaraCroft&backgroundColor=ffd5dc' },
    { name: 'Geralt Rivia', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Geralt&backgroundColor=b6e3f4' },
    { name: 'Cloud Strife', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=CloudStrife&backgroundColor=ffdfbf' },
    { name: 'Pikachu', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Pikachu&backgroundColor=c0aede' },
    { name: 'Sonic', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sonic&backgroundColor=d1d4f9' },
  ],
}

export default function SettingsPage() {
  const { user, refreshUser } = useUser()
  const { siteName, logoUrl, setSiteName, setLogoUrl } = useBrand()
  
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
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setAvatarUrl(data.url)
        setSuccess('Foto carregada com sucesso! Clique em salvar perfil para aplicar.')
      } else {
        setError(data.error || 'Erro ao fazer upload da imagem.')
      }
    } catch (err) {
      console.error(err)
      setError('Erro de rede no upload.')
    } finally {
      setUploading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setError('')
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setBrandLogo(data.url)
        setSuccess('Logo carregada! Clique em "Aplicar Aparência" para salvar.')
      } else {
        setError(data.error || 'Erro ao fazer upload da logo.')
      }
    } catch (err) {
      console.error(err)
      setError('Erro de rede no upload da logo.')
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
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role,
          avatarUrl,
          pin: pin ? pin : undefined
        })
      })

      const data = await res.json()
      if (data.success) {
        setSuccess('Configurações atualizadas com sucesso!')
        setPin('')
        setConfirmPin('')
        await refreshUser()
      } else {
        setError(data.error || 'Erro ao salvar alterações')
      }
    } catch (err) {
      console.error(err)
      setError('Erro de rede ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBrand = () => {
    setSiteName(brandName || 'MktFlow')
    setLogoUrl(brandLogo)
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
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-850">
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
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-semibold"
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
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-semibold pr-10"
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
                className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-250 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition cursor-pointer shrink-0 flex items-center gap-1.5"
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

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Avatar */}
        <div className="md:col-span-1 bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col items-center text-center">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Sua Foto</label>
          
          <div className="relative group mb-6">
            <img
              src={avatarUrl || 'https://api.dicebear.com/9.x/adventurer/svg?seed=avatar'}
              alt="Profile avatar"
              className="w-28 h-28 rounded-full border-2 border-slate-200 dark:border-slate-800 object-cover bg-slate-100 dark:bg-slate-900"
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
            Envie uma foto ou selecione um personagem abaixo.
          </p>

          {/* Avatar Categories */}
          <div className="w-full space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {Object.entries(AVATAR_CATEGORIES).map(([category, avatars]) => (
              <div key={category}>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  {category}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {avatars.map((avatar, idx) => (
                    <button
                      key={idx}
                      type="button"
                      title={avatar.name}
                      onClick={() => setAvatarUrl(avatar.url)}
                      className={`w-full aspect-square rounded-full overflow-hidden border-2 bg-slate-50 hover:scale-110 transition cursor-pointer relative ${
                        avatarUrl === avatar.url ? 'border-blue-500 scale-110' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                      {avatarUrl === avatar.url && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center text-white">
                          <Check className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400 font-bold bg-white dark:bg-slate-900 rounded-full p-0.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-850">
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
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Função / Setor</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-700 dark:text-slate-300 font-semibold"
              >
                <option value="DESIGNER">Designer (Artes & Audiovisual)</option>
                <option value="TRAFFIC_MANAGER">Gestor de Tráfego (Campanhas & Ads)</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-[#151b2c] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-850">
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
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-250"
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
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-250"
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
