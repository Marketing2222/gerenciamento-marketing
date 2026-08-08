'use client'

import { usePathname } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import { MobileUIProvider } from '@/context/MobileUIContext'
import Header from './Header'
import MobileFooter from './MobileFooter'
import { Loader2 } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading } = useUser()

  const isLoginPage = pathname === '/login'

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-slate-100">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Carregando MktFlow...</p>
      </div>
    )
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (!user) {
    return null
  }

  return (
    <MobileUIProvider>
      <div className="h-dvh w-full flex flex-col overflow-hidden bg-slate-50 dark:bg-[#080d19]">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-6">
          {children}
        </main>
        <MobileFooter />
      </div>
    </MobileUIProvider>
  )
}
