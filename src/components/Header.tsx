'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import { useTheme } from '@/context/ThemeContext'
import { useBrand } from '@/context/BrandContext'
import Avatar from '@/components/Avatar'
import TrashModal from '@/components/TrashModal'
import VideoScheduleModal from '@/components/VideoScheduleModal'
import {
  LayoutDashboard,
  Kanban,
  Calendar,
  ListTodo,
  FolderOpen,
  Settings,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  Trash2,
  Menu,
  X,
  User,
  RefreshCw,
  Video,
} from 'lucide-react'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useUser()
  const { theme, toggleTheme } = useTheme()
  const { siteName, logoUrl } = useBrand()
  const [isTrashOpen, setIsTrashOpen] = useState(false)
  const [isVideoScheduleOpen, setIsVideoScheduleOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Kanban', href: '/kanban', icon: Kanban },
    { name: 'Calendário', href: '/calendario', icon: Calendar },
    { name: 'Tarefas', href: '/tarefas', icon: ListTodo },
    { name: 'Arquivos', href: '/arquivos', icon: FolderOpen },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
  ]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  return (
    <header className="h-[60px] w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] flex items-center px-3 sm:px-4 gap-3 sm:gap-4 shrink-0 select-none z-[60]">
      {/* Mobile: Burger on the left */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition cursor-pointer shrink-0"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop: Brand */}
      <Link href="/" className="hidden md:flex items-center gap-2 shrink-0 mr-2">
        {logoUrl ? (
          <img src={logoUrl} alt={siteName} className="w-8 h-8 rounded-lg object-cover" />
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}
        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight">
          {siteName}
        </span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1 flex-1 min-w-0">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
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
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      )}

      {/* Desktop Right side: theme + trash + user dropdown */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <button
          onClick={() => setIsVideoScheduleOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer mr-1"
        >
          <Video className="w-4 h-4" />
          <span className="hidden lg:inline">Cronograma de Vídeos</span>
          <span className="lg:hidden">Vídeos</span>
        </button>

        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setIsTrashOpen(true)}
          title="Lixeira"
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-red-500 dark:hover:text-red-400 transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>

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
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate leading-tight">
                {user.name}
              </h4>
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
                onClick={() => {
                  setProfileDropdownOpen(false)
                  router.push('/login')
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Trocar de usuário
              </button>
              <button
                onClick={() => {
                  setProfileDropdownOpen(false)
                  logout()
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Right side: theme + avatar with dropdown */}
      <div className="md:hidden flex items-center gap-1 shrink-0 ml-auto">
        <button
          onClick={() => setIsVideoScheduleOpen(true)}
          title="Cronograma de Vídeos"
          className="p-2 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition cursor-pointer"
        >
          <Video className="w-4 h-4" />
        </button>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Mobile profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="cursor-pointer rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition"
          >
            <div className="relative shrink-0">
              <Avatar name={user.name} url={user.avatarUrl} size="lg" />
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0c1220]" />
            </div>
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[70] py-2 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {user.role === 'DESIGNER' ? 'Designer' : 'Gestor de Tráfego'}
                </p>
              </div>
              <button
                onClick={() => {
                  setProfileDropdownOpen(false)
                  router.push('/login')
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Trocar de usuário
              </button>
              <button
                onClick={() => {
                  setProfileDropdownOpen(false)
                  logout()
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>

      <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />
      <VideoScheduleModal isOpen={isVideoScheduleOpen} onClose={() => setIsVideoScheduleOpen(false)} />
    </header>
  )
}
