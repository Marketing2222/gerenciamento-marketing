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
      <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#080d19]">
        <Header />
        <main className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 md:pb-6">
            {children}
          </div>
        </main>
        <MobileFooter />
      </div>
    </MobileUIProvider>
  )
}
