'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import { useTheme } from '@/context/ThemeContext'
import { useBrand } from '@/context/BrandContext'
import { useMobileUI } from '@/context/MobileUIContext'
import Avatar from '@/components/Avatar'
import TrashModal from '@/components/TrashModal'
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
  Search,
} from 'lucide-react'

export default function Header() {
  const pathname = usePathname()
  const { user, logout } = useUser()
  const { theme, toggleTheme } = useTheme()
  const { siteName, logoUrl } = useBrand()
  const { toggleSearch, searchOpen } = useMobileUI()
  const [isTrashOpen, setIsTrashOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Kanban', href: '/kanban', icon: Kanban },
    { name: 'Calendário', href: '/calendario', icon: Calendar },
    { name: 'Tarefas', href: '/tarefas', icon: ListTodo },
    { name: 'Arquivos', href: '/arquivos', icon: FolderOpen },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
  ]

  if (!user) return null

  return (
    <header className="h-14 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] flex items-center px-2 sm:px-4 gap-2 sm:gap-4 shrink-0 select-none z-50 overflow-hidden">
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
        <nav className="md:hidden absolute top-14 left-0 right-0 bg-white dark:bg-[#0c1220] border-b border-slate-200 dark:border-slate-800 flex flex-col p-2 z-50 shadow-lg">
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

      {/* Desktop Right side: theme + trash + user */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
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

        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <Avatar name={user.name} url={user.avatarUrl} />
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0c1220]" />
          </div>
          <div className="hidden lg:block min-w-0">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate leading-tight">
              {user.name}
            </h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-medium">
              {user.role === 'DESIGNER' ? 'Designer' : 'Gestor de Tráfego'}
            </span>
          </div>
          <button
            onClick={logout}
            title="Sair / Trocar Perfil"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Right side: search + theme + avatar */}
      <div className="md:hidden flex items-center gap-1 shrink-0 ml-auto">
        <button
          onClick={toggleSearch}
          title="Pesquisar"
          className={`p-2 rounded-lg transition cursor-pointer ${
            searchOpen
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Search className="w-5 h-5" />
        </button>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <div className="relative shrink-0">
          <Avatar name={user.name} url={user.avatarUrl} />
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0c1220]" />
        </div>
      </div>

      <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />
    </header>
  )
}
