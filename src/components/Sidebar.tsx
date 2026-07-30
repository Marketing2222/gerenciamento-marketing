'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import { useTheme } from '@/context/ThemeContext'
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
} from 'lucide-react'

export default function Header() {
  const pathname = usePathname()
  const { user, logout } = useUser()
  const { theme, toggleTheme } = useTheme()

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
    <header className="h-14 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] flex items-center px-4 gap-4 shrink-0 select-none z-50">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0 mr-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight hidden sm:block">
          MktFlow
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
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
              <span className="hidden md:inline">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Right side: theme toggle + user */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />

        {/* User Profile */}
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover bg-slate-100"
            />
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
    </header>
  )
}
