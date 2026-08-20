'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import { useTheme } from '@/context/ThemeContext'
import { useBrand } from '@/context/BrandContext'
import { useData } from '@/context/DataContext'
import Avatar from '@/components/Avatar'
import TrashModal from '@/components/TrashModal'
import VideoScheduleModal from '@/components/VideoScheduleModal'
import {
  Kanban,
  FolderOpen,
  Settings,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  Trash2,
  Menu,
  X,
  RefreshCw,
  Video,
  Plus,
  Users,
  Tag,
  CalendarDays,
  ChevronRight,
} from 'lucide-react'

interface HeaderProps {
  onOpenCalendarFilter?: () => void
  onAssigneeChange?: (id: string) => void
  onPriorityChange?: (p: string) => void
  assigneeFilter?: string
  priorityFilter?: string
  onCreateTask?: () => void
}

export default function Header({
  onOpenCalendarFilter,
  onAssigneeChange,
  onPriorityChange,
  assigneeFilter = '',
  priorityFilter = '',
  onCreateTask,
}: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useUser()
  const { theme, toggleTheme } = useTheme()
  const { siteName, logoUrl } = useBrand()
  const { users } = useData()

  const [isTrashOpen, setIsTrashOpen] = useState(false)
  const [isVideoScheduleOpen, setIsVideoScheduleOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Nav items — Dashboard, Calendário, Tarefas removed
  const navItems = [
    { name: 'Nova Tarefa', href: null, icon: Plus, isAction: true, action: () => onCreateTask?.(), highlight: true },
    { name: 'Kanban', href: '/kanban', icon: Kanban },
    { name: 'Arquivos', href: '/arquivos', icon: FolderOpen },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
    { name: 'Cronograma de Vídeos', href: null, icon: Video, isAction: true, action: () => setIsVideoScheduleOpen(true) },
  ]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false)
      }
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const isKanban = pathname === '/kanban'

  return (
    <>
      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Side Drawer */}
      <div
        ref={drawerRef}
        className={`fixed left-0 top-0 h-full w-[280px] bg-white dark:bg-[#0c1220] border-r border-slate-200 dark:border-slate-800 z-[90] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{siteName}</span>
          </div>
          <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">Configurações Rápidas</p>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </div>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>

          {/* Trash */}
          <button
            onClick={() => { setIsTrashOpen(true); setDrawerOpen(false) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            Lixeira
          </button>

          <div className="pt-3 pb-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">Filtros do Kanban</p>
          </div>

          {/* Assignee Filter */}
          <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Responsável</span>
            </div>
            <select
              value={assigneeFilter}
              onChange={(e) => onAssigneeChange?.(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
            >
              <option value="">Todos os responsáveis</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Prioridade</span>
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityChange?.(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
            >
              <option value="">Todas as prioridades</option>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>

          {(assigneeFilter || priorityFilter) && (
            <button
              onClick={() => { onAssigneeChange?.(''); onPriorityChange?.('') }}
              className="w-full text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2 rounded-xl transition"
            >
              Limpar filtros ativos
            </button>
          )}
        </div>

        {/* Drawer Footer: User info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={user.name} url={user.avatarUrl} size="lg" />
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role === 'DESIGNER' ? 'Designer' : 'Gestor'}</p>
            </div>
          </div>
          <button
            onClick={() => { setDrawerOpen(false); logout() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>

      {/* ===== MAIN HEADER ===== */}
      <header className="h-[60px] w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] flex items-center px-3 sm:px-4 gap-2 sm:gap-3 shrink-0 select-none z-[60]">
        {/* Logo → opens drawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition rounded-lg p-1 -ml-1"
          title="Menu de configurações"
        >
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="w-7 h-7 rounded-lg object-cover" />
          ) : (
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          <span className="hidden sm:block font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight">
            {siteName}
          </span>
        </button>

        {/* Mobile burger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition cursor-pointer shrink-0 ml-auto"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 flex-1 min-w-0 ml-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href ? (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) : false

            if (item.isAction) {
              return (
                <button
                  key={item.name}
                  onClick={item.action}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition duration-200 whitespace-nowrap cursor-pointer ${
                    (item as any).highlight
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </button>
              )
            }

            return (
              <Link
                key={item.href!}
                href={item.href!}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <nav className="md:hidden absolute top-[60px] left-0 right-0 bg-white dark:bg-[#0c1220] border-b border-slate-200 dark:border-slate-800 flex flex-col p-2 z-[70] shadow-lg">
            {navItems.map((item, i) => {
              const Icon = item.icon
              if (item.isAction) {
                return (
                  <button key={i} onClick={() => { item.action?.(); setMobileMenuOpen(false) }} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition w-full text-left">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </button>
                )
              }
              return (
                <Link key={item.href} href={item.href!} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        )}

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2 shrink-0 ml-auto">
          {/* Calendar filter — only visible on Kanban */}
          {isKanban && onOpenCalendarFilter && (
            <button
              onClick={onOpenCalendarFilter}
              title="Filtrar por semana/dia"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          )}

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 cursor-pointer rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition"
            >
              <div className="relative shrink-0">
                <Avatar name={user.name} url={user.avatarUrl} size="lg" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0c1220]" />
              </div>
              <div className="hidden lg:block min-w-0">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate leading-tight">{user.name}</h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                  {user.role === 'DESIGNER' ? 'Designer' : 'Gestor de Tráfego'}
                </span>
              </div>
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[70] py-2 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {user.role === 'DESIGNER' ? 'Designer' : 'Gestor de Tráfego'}
                  </p>
                </div>
                <button
                  onClick={() => { setProfileDropdownOpen(false); router.push('/login') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Trocar de usuário
                </button>
                <button
                  onClick={() => { setProfileDropdownOpen(false); logout() }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile right */}
        <div className="md:hidden flex items-center gap-1 shrink-0">
          {isKanban && onOpenCalendarFilter && (
            <button onClick={onOpenCalendarFilter} className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
              <CalendarDays className="w-4 h-4" />
            </button>
          )}
        </div>

        <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />
        <VideoScheduleModal isOpen={isVideoScheduleOpen} onClose={() => setIsVideoScheduleOpen(false)} />
      </header>
    </>
  )
}
