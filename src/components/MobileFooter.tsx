'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMobileUI } from '@/context/MobileUIContext'
import { LayoutDashboard, Kanban, Plus, Calendar, ListTodo } from 'lucide-react'

export default function MobileFooter() {
  const pathname = usePathname()
  const { openAddTask } = useMobileUI()

  const footerItems = [
    { name: 'Home', href: '/', icon: LayoutDashboard },
    { name: 'Kanban', href: '/kanban', icon: Kanban },
    { name: '', href: '', icon: Plus, isAdd: true },
    { name: 'Calendário', href: '/calendario', icon: Calendar },
    { name: 'Tarefas', href: '/tarefas', icon: ListTodo },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[70px] bg-white dark:bg-[#0c1220] border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-40 shrink-0 pb-1">
      {footerItems.map((item, i) => {
        if (item.isAdd) {
          return (
            <button
              key="add"
              onClick={openAddTask}
              className="flex flex-col items-center justify-center -mt-5 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition">
                <Plus className="w-6 h-6" />
              </div>
            </button>
          )
        }

        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5 py-1 min-w-0"
          >
            <div className={`p-1.5 rounded-xl transition ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {item.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
