'use client'

import React, { useEffect, useState } from 'react'
import { FolderOpen, FileText, Link2, Search, ExternalLink, Download, Loader2, RefreshCw, Eye } from 'lucide-react'
import Link from 'next/link'

interface Attachment {
  id: string
  name: string
  type: string // "FILE" or "LINK"
  url: string
  createdAt: string
  task: {
    id: string
    title: string
    status: string
  }
}

export default function FilesPage() {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadAttachments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/attachments')
      const data = await res.json()
      if (data.success) {
        setAttachments(data.attachments)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttachments()
  }, [])

  // Filtrar
  const filteredAttachments = attachments.filter(att => 
    att.name.toLowerCase().includes(search.toLowerCase()) ||
    att.task.title.toLowerCase().includes(search.toLowerCase())
  )

  const files = filteredAttachments.filter(att => att.type === 'FILE')
  const links = filteredAttachments.filter(att => att.type === 'LINK')

  const isImage = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase()
    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')
  }

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Biblioteca de Arquivos & Assets</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Acesse de forma unificada todos os arquivos enviados e links externos cadastrados nas tarefas.
          </p>
        </div>
        
        <button
          onClick={loadAttachments}
          title="Recarregar arquivos"
          className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 dark:text-slate-400 shrink-0 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative shrink-0 w-full bg-white dark:bg-[#151b2c] p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Pesquisar por nome do arquivo ou título da tarefa associada..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 font-semibold"
        />
      </div>

      {/* Grid: Files vs Links */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
          <p className="text-sm font-medium">Carregando biblioteca...</p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto min-h-0 pb-6 pr-1">
          
          {/* Column 1: Files & Documents */}
          <div className="space-y-4 flex flex-col h-full min-h-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-250 flex items-center gap-2 shrink-0">
              <FileText className="w-4 h-4 text-blue-550" />
              <span>Documentos e Materiais ({files.length})</span>
            </h3>

            <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#151b2c] p-4 shadow-sm overflow-y-auto space-y-3">
              {files.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  Nenhum arquivo enviado até o momento.
                </div>
              ) : (
                files.map((file) => (
                  <div 
                    key={file.id} 
                    className="p-3 border border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-between gap-4 hover:border-slate-350 dark:hover:border-slate-700 transition duration-150 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isImage(file.url) ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-100">
                          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate pr-2 max-w-[220px]" title={file.name}>
                          {file.name}
                        </h4>
                        <Link 
                          href={`/kanban?task=${file.task.id}`} 
                          className="text-[10px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline font-semibold block truncate mt-0.5"
                        >
                          Tarefa: {file.task.title}
                        </Link>
                      </div>
                    </div>

                    <a
                      href={file.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-400 shadow-sm transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: External Links */}
          <div className="space-y-4 flex flex-col h-full min-h-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-250 flex items-center gap-2 shrink-0">
              <Link2 className="w-4 h-4 text-blue-550" />
              <span>Links Rápidos e Entregáveis ({links.length})</span>
            </h3>

            <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#151b2c] p-4 shadow-sm overflow-y-auto space-y-3">
              {links.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  Nenhum link cadastrado até o momento.
                </div>
              ) : (
                links.map((link) => (
                  <div 
                    key={link.id} 
                    className="p-3 border border-slate-200 dark:border-slate-850 rounded-xl flex items-center justify-between gap-4 hover:border-slate-350 dark:hover:border-slate-700 transition duration-150 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center shrink-0 text-indigo-650 dark:text-indigo-400">
                        <Link2 className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate pr-2 max-w-[220px]" title={link.name}>
                          {link.name}
                        </h4>
                        <Link 
                          href={`/kanban?task=${link.task.id}`} 
                          className="text-[10px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline font-semibold block truncate mt-0.5"
                        >
                          Tarefa: {link.task.title}
                        </Link>
                      </div>
                    </div>

                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-400 shadow-sm transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Acessar
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
