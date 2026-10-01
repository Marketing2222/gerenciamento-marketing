'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, Link2, ExternalLink, Copy, Trash2, Pencil, Check, Globe, Loader2,
  ArrowUp, ArrowDown, ImagePlus, Plus, MoreVertical, FolderOpen, ChevronDown,
  ChevronRight, User, Lock, Eye, EyeOff,
} from 'lucide-react'
import { useData } from '@/context/DataContext'
import { createPortal } from 'react-dom'

interface LinksPanelProps {
  isOpen: boolean
  onClose: () => void
}

function getFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch { return '' }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function LinkCard({
  link, index, editingLinkId, copiedId, openMenuId, menuRef,
  onEdit, onDelete, onCopy, onOpen, onMove, onToggleMenu, getIconSrc, totalLinks,
}: {
  link: { id: string; name: string; url: string; iconUrl: string; username: string; password: string }
  index: number; editingLinkId: string | null; copiedId: string | null; openMenuId: string | null
  menuRef: React.RefObject<HTMLDivElement | null>
  onEdit: (l: any) => void; onDelete: (id: string) => void; onCopy: (l: any) => void
  onOpen: (l: any) => void; onMove: (i: number, d: 'up' | 'down') => void
  onToggleMenu: (id: string) => void; getIconSrc: (l: any) => string; totalLinks: number
}) {
  const [showCreds, setShowCreds] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  const copyField = async (value: string, field: string) => {
    try { await navigator.clipboard.writeText(value) } catch {
      const ta = document.createElement('textarea'); ta.value = value; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopiedField(field); setTimeout(() => setCopiedField(null), 1500)
  }

  const handleToggle = () => {
    if (openMenuId === link.id) { onToggleMenu(''); return }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const menuW = 176
      let left = r.left - menuW - 8
      if (left < 8) left = r.right + 8
      let top = r.bottom + 4
      if (top + 280 > window.innerHeight) top = r.top - 280
      setMenuPos({ top: Math.max(8, top), left })
    }
    onToggleMenu(link.id)
  }

  return (
    <div className={`p-3 border rounded-xl transition ${editingLinkId === link.id ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
          {getIconSrc(link) ? (
            <img src={getIconSrc(link)} alt="" className="w-5 h-5"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }} />
          ) : null}
          <Link2 className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 ${getIconSrc(link) ? 'hidden' : ''}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{link.name}</h4>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{link.url}</p>
          {(link.username || link.password) && (
            <button onClick={() => setShowCreds(!showCreds)} className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-blue-500 hover:text-blue-600 transition">
              {showCreds ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showCreds ? 'Ocultar credenciais' : 'Ver credenciais'}
            </button>
          )}
        </div>
        <div className="shrink-0">
          <button ref={btnRef} onClick={handleToggle} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {openMenuId === link.id && createPortal(
        <div ref={menuRef as any} className="fixed w-44 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[200] py-1 animate-fade-in" style={{ top: menuPos.top, left: menuPos.left }}>
          <button onClick={() => onOpen(link)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
            <ExternalLink className="w-3.5 h-3.5 text-blue-500" /> Abrir
          </button>
          <button onClick={() => onCopy(link)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
            {copiedId === link.id ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copiado!</> : <><Copy className="w-3.5 h-3.5 text-emerald-500" /> Copiar link</>}
          </button>
          <button onClick={() => onEdit(link)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
            <Pencil className="w-3.5 h-3.5 text-amber-500" /> Editar
          </button>
          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
          <button onClick={() => onMove(index, 'up')} disabled={index === 0} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition disabled:opacity-30 disabled:cursor-not-allowed">
            <ArrowUp className="w-3.5 h-3.5 text-slate-500" /> Mover para cima
          </button>
          <button onClick={() => onMove(index, 'down')} disabled={index === totalLinks - 1} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition disabled:opacity-30 disabled:cursor-not-allowed">
            <ArrowDown className="w-3.5 h-3.5 text-slate-500" /> Mover para baixo
          </button>
          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
          <button onClick={() => onDelete(link.id)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition">
            <Trash2 className="w-3 h-3" /> Excluir
          </button>
        </div>,
        document.body
      )}

      {showCreds && (link.username || link.password) && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/50 space-y-1.5 animate-fade-in">
          {link.username && (
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-[10px] text-slate-500 font-medium shrink-0">User:</span>
              <span className="text-[10px] text-slate-700 dark:text-slate-300 font-mono truncate flex-1">{link.username}</span>
              <button onClick={() => copyField(link.username, 'user')} className="text-[10px] font-bold text-slate-400 hover:text-blue-500 transition shrink-0">
                {copiedField === 'user' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}
          {link.password && (
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-[10px] text-slate-500 font-medium shrink-0">Pass:</span>
              <span className="text-[10px] text-slate-700 dark:text-slate-300 font-mono truncate flex-1">{link.password}</span>
              <button onClick={() => copyField(link.password, 'pass')} className="text-[10px] font-bold text-slate-400 hover:text-blue-500 transition shrink-0">
                {copiedField === 'pass' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function LinksPanel({ isOpen, onClose }: LinksPanelProps) {
  const {
    quickLinks, quickLinkCategories,
    addQuickLink, updateQuickLink, removeQuickLink, reorderQuickLinks,
    addQuickLinkCategory, updateQuickLinkCategory, removeQuickLinkCategory,
  } = useData()

  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<'link' | 'category'>('link')
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [openCatMenuId, setOpenCatMenuId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({})
  const [showPlusMenu, setShowPlusMenu] = useState(false)

  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkIconUrl, setLinkIconUrl] = useState('')
  const [linkCategoryId, setLinkCategoryId] = useState('')
  const [hasUsername, setHasUsername] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)
  const [linkUsername, setLinkUsername] = useState('')
  const [linkPassword, setLinkPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [catName, setCatName] = useState('')

  const panelRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)
  const catInputRef = useRef<HTMLInputElement>(null)
  const plusMenuRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const catMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      const m: Record<string, boolean> = {}
      quickLinkCategories.forEach((c) => { m[c.id] = true })
      setExpandedCats(m)
    }
  }, [isOpen, quickLinkCategories])

  useEffect(() => {
    if (isOpen && showForm) setTimeout(() => (formMode === 'link' ? nameInputRef.current?.focus() : catInputRef.current?.focus()), 100)
  }, [isOpen, showForm, formMode])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const target = e.target as Node
      if (panelRef.current && panelRef.current.contains(target)) return
      if (menuRef.current && menuRef.current.contains(target)) return
      if (plusMenuRef.current && plusMenuRef.current.contains(target)) return
      onClose()
    }
    if (isOpen) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [isOpen, onClose])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) setShowPlusMenu(false)
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null)
      if (catMenuRef.current && !catMenuRef.current.contains(e.target as Node)) setOpenCatMenuId(null)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const resetLinkForm = () => { setLinkName(''); setLinkUrl(''); setLinkIconUrl(''); setLinkCategoryId(''); setHasUsername(false); setHasPassword(false); setLinkUsername(''); setLinkPassword(''); setShowPassword(false); setEditingLinkId(null); setShowForm(false) }
  const resetCatForm = () => { setCatName(''); setEditingCatId(null); setShowForm(false) }
  const resetAll = () => { resetLinkForm(); resetCatForm(); setShowPlusMenu(false) }

  const openNewLink = () => { resetCatForm(); setFormMode('link'); setEditingLinkId(null); setLinkName(''); setLinkUrl(''); setLinkIconUrl(''); setLinkCategoryId(''); setHasUsername(false); setHasPassword(false); setLinkUsername(''); setLinkPassword(''); setShowForm(true); setShowPlusMenu(false) }
  const openNewCategory = () => { resetLinkForm(); setFormMode('category'); setEditingCatId(null); setCatName(''); setShowForm(true); setShowPlusMenu(false) }

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkName.trim() || !linkUrl.trim() || saving) return
    let u = linkUrl.trim(); if (!/^https?:\/\//i.test(u)) u = 'https://' + u
    setSaving(true)
    try {
      if (editingLinkId) await updateQuickLink(editingLinkId, linkName.trim(), u, linkIconUrl || '', linkCategoryId, hasUsername ? linkUsername.trim() : '', hasPassword ? linkPassword.trim() : '')
      else await addQuickLink(linkName.trim(), u, linkIconUrl || '', linkCategoryId, hasUsername ? linkUsername.trim() : '', hasPassword ? linkPassword.trim() : '')
      resetLinkForm()
    } finally { setSaving(false) }
  }

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || f.size > 500 * 1024) return
    setUploadingIcon(true); try { setLinkIconUrl(await fileToBase64(f)) } finally { setUploadingIcon(false); if (iconInputRef.current) iconInputRef.current.value = '' }
  }

  const handleEditLink = (link: typeof quickLinks[0]) => { setFormMode('link'); setEditingLinkId(link.id); setLinkName(link.name); setLinkUrl(link.url); setLinkIconUrl(link.iconUrl || ''); setLinkCategoryId(link.categoryId); setHasUsername(!!link.username); setHasPassword(!!link.password); setLinkUsername(link.username); setLinkPassword(link.password); setShowForm(true); setOpenMenuId(null); setTimeout(() => nameInputRef.current?.focus(), 100) }
  const handleDeleteLink = async (id: string) => { setOpenMenuId(null); await removeQuickLink(id); if (editingLinkId === id) resetLinkForm() }
  const handleCopyLink = async (link: { url: string; id: string }) => { setOpenMenuId(null); try { await navigator.clipboard.writeText(link.url) } catch { const ta = document.createElement('textarea'); ta.value = link.url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta) }; setCopiedId(link.id); setTimeout(() => setCopiedId(null), 2000) }
  const handleOpenLink = (link: { url: string }) => { setOpenMenuId(null); window.open(link.url, '_blank', 'noopener,noreferrer') }
  const handleMoveLink = async (index: number, dir: 'up' | 'down') => { setOpenMenuId(null); const ni = dir === 'up' ? index - 1 : index + 1; if (ni < 0 || ni >= quickLinks.length) return; const ids = quickLinks.map((l) => l.id); const [r] = ids.splice(index, 1); ids.splice(ni, 0, r); await reorderQuickLinks(ids) }

  const handleSaveCategory = async (e: React.FormEvent) => { e.preventDefault(); if (!catName.trim() || saving) return; setSaving(true); try { if (editingCatId) await updateQuickLinkCategory(editingCatId, catName.trim()); else await addQuickLinkCategory(catName.trim()); resetCatForm() } finally { setSaving(false) } }
  const handleEditCategory = (cat: typeof quickLinkCategories[0]) => { setFormMode('category'); setEditingCatId(cat.id); setCatName(cat.name); setShowForm(true); setOpenCatMenuId(null); setTimeout(() => catInputRef.current?.focus(), 100) }
  const handleDeleteCategory = async (id: string) => { setOpenCatMenuId(null); await removeQuickLinkCategory(id); if (editingCatId === id) resetCatForm() }
  const toggleCat = (catId: string) => setExpandedCats((p) => ({ ...p, [catId]: !p[catId] }))
  const getIconSrc = (link: { iconUrl: string; url: string }) => link.iconUrl || getFaviconUrl(link.url) || ''
  const linksWithoutCat = quickLinks.filter((l) => !l.categoryId)
  const getCatLinks = (catId: string) => quickLinks.filter((l) => l.categoryId === catId)

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div ref={panelRef} className="fixed left-0 top-0 h-full w-[380px] max-w-[90vw] bg-white dark:bg-[#0c1220] border-r border-slate-200 dark:border-slate-800 z-[90] shadow-2xl flex flex-col translate-x-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20"><Link2 className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Links Rápidos</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative" ref={plusMenuRef}>
              <button onClick={() => setShowPlusMenu(!showPlusMenu)} title="Adicionar" className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition"><Plus className="w-4 h-4" /></button>
              {showPlusMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[100] py-1 overflow-hidden animate-fade-in">
                  <button onClick={openNewLink} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><Link2 className="w-3.5 h-3.5 text-blue-500" /> Novo Link</button>
                  <button onClick={openNewCategory} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><FolderOpen className="w-3.5 h-3.5 text-amber-500" /> Nova Categoria</button>
                </div>
              )}
            </div>
            <button onClick={() => { resetAll(); onClose() }} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Form */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out border-b border-slate-200 dark:border-slate-800 ${showForm ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 border-b-0'}`}>
          {formMode === 'link' ? (
            <form onSubmit={handleSaveLink} className="p-4 space-y-3 bg-slate-50 dark:bg-slate-900/30">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Nome do Site</label><input ref={nameInputRef} type="text" required placeholder="Ex: Meu Site" value={linkName} onChange={(e) => setLinkName(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition" /></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">URL do Link</label><input type="text" required placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition" /></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Categoria</label><select value={linkCategoryId} onChange={(e) => setLinkCategoryId(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition"><option value="">Sem categoria</option>{quickLinkCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Ícone (opcional)</label>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c1220] flex items-center justify-center shrink-0 overflow-hidden">
                    {linkIconUrl ? <img src={linkIconUrl} alt="" className="w-full h-full object-cover" /> : linkUrl ? <img src={getFaviconUrl(linkUrl)} alt="" className="w-5 h-5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <Globe className="w-4 h-4 text-slate-300" />}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <input ref={iconInputRef} type="file" accept="image/*" onChange={handleIconUpload} className="hidden" />
                    <button type="button" onClick={() => iconInputRef.current?.click()} disabled={uploadingIcon} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50">
                      {uploadingIcon ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />} {uploadingIcon ? 'Enviando...' : 'Enviar imagem'}
                    </button>
                    {linkIconUrl && <button type="button" onClick={() => setLinkIconUrl('')} className="text-[10px] font-bold text-red-500 hover:text-red-600 transition">Remover</button>}
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-slate-400" /><span className="text-xs font-medium text-slate-600 dark:text-slate-400">Usuário / Login</span></div><button type="button" onClick={() => { setHasUsername(!hasUsername); if (hasUsername) setLinkUsername('') }} className={`relative w-9 h-5 rounded-full transition ${hasUsername ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}><span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasUsername ? 'translate-x-4' : ''}`} /></button></div>
                {hasUsername && <input type="text" placeholder="Usuário ou login" value={linkUsername} onChange={(e) => setLinkUsername(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition animate-fade-in" />}
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-slate-400" /><span className="text-xs font-medium text-slate-600 dark:text-slate-400">Senha</span></div><button type="button" onClick={() => { setHasPassword(!hasPassword); if (hasPassword) setLinkPassword('') }} className={`relative w-9 h-5 rounded-full transition ${hasPassword ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}><span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasPassword ? 'translate-x-4' : ''}`} /></button></div>
                {hasPassword && <div className="relative animate-fade-in"><input type={showPassword ? 'text' : 'password'} placeholder="Senha" value={linkPassword} onChange={(e) => setLinkPassword(e.target.value)} className="w-full px-3 py-2 pr-9 bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                {editingLinkId && <button type="button" onClick={resetLinkForm} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition">Cancelar</button>}
                <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5">{saving && <Loader2 className="w-3 h-3 animate-spin" />} {editingLinkId ? 'Salvar Alterações' : 'Adicionar Link'}</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveCategory} className="p-4 space-y-3 bg-slate-50 dark:bg-slate-900/30">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Nome da Categoria</label><input ref={catInputRef} type="text" required placeholder="Ex: E-mails, Redes Sociais..." value={catName} onChange={(e) => setCatName(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition" /></div>
              <div className="flex justify-end gap-2">
                {editingCatId && <button type="button" onClick={resetCatForm} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition">Cancelar</button>}
                <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5">{saving && <Loader2 className="w-3 h-3 animate-spin" />} {editingCatId ? 'Salvar' : 'Criar Categoria'}</button>
              </div>
            </form>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {quickLinks.length === 0 && quickLinkCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400"><Globe className="w-10 h-10 mb-3 text-slate-300 dark:text-slate-600" /><p className="text-xs font-medium">Nenhum link ou categoria ainda.</p><p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Clique no + para começar.</p></div>
          ) : (
            <>
              {quickLinkCategories.map((cat) => {
                const catLinks = getCatLinks(cat.id)
                const isExpanded = expandedCats[cat.id] !== false
                return (
                  <div key={cat.id} className="border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-900/40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition" onClick={() => toggleCat(cat.id)}>
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                        <FolderOpen className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">({catLinks.length})</span>
                      </div>
                      <div className="relative" ref={openCatMenuId === cat.id ? catMenuRef : undefined} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setOpenCatMenuId(openCatMenuId === cat.id ? null : cat.id)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"><MoreVertical className="w-3.5 h-3.5" /></button>
                        {openCatMenuId === cat.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[100] py-1 overflow-hidden animate-fade-in">
                            <button onClick={() => handleEditCategory(cat)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><Pencil className="w-3 h-3 text-amber-500" /> Editar</button>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition"><Trash2 className="w-3 h-3" /> Excluir</button>
                          </div>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-2 space-y-1">
                        {catLinks.length === 0 ? <p className="text-[10px] text-slate-400 text-center py-3">Nenhum link nesta categoria.</p> : catLinks.map((link) => (
                          <LinkCard key={link.id} link={link} index={quickLinks.indexOf(link)} editingLinkId={editingLinkId} copiedId={copiedId} openMenuId={openMenuId} menuRef={menuRef} onEdit={handleEditLink} onDelete={handleDeleteLink} onCopy={handleCopyLink} onOpen={handleOpenLink} onMove={handleMoveLink} onToggleMenu={(id) => setOpenMenuId(openMenuId === id ? null : id)} getIconSrc={getIconSrc} totalLinks={quickLinks.length} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {linksWithoutCat.length > 0 && (
                <div className="space-y-1">
                  {quickLinkCategories.length > 0 && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Sem categoria</p>}
                  {linksWithoutCat.map((link) => (
                    <LinkCard key={link.id} link={link} index={quickLinks.indexOf(link)} editingLinkId={editingLinkId} copiedId={copiedId} openMenuId={openMenuId} menuRef={menuRef} onEdit={handleEditLink} onDelete={handleDeleteLink} onCopy={handleCopyLink} onOpen={handleOpenLink} onMove={handleMoveLink} onToggleMenu={(id) => setOpenMenuId(openMenuId === id ? null : id)} getIconSrc={getIconSrc} totalLinks={quickLinks.length} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {quickLinks.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 text-center shrink-0">
            <p className="text-[10px] text-slate-400 font-medium">{quickLinks.length} link{quickLinks.length !== 1 ? 's' : ''} salvo{quickLinks.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>
    </>
  )
}
