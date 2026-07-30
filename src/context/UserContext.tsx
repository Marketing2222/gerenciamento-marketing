'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  id: string
  name: string
  role: string
  avatarUrl: string
}

interface UserContextType {
  user: User | null
  loading: boolean
  login: (userId: string, pin: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.success && data.user) {
        setUser(data.user)
      } else {
        setUser(null)
        // Redireciona para o login se não estiver autenticado e não estiver na rota de login
        if (pathname !== '/login' && !pathname.startsWith('/api')) {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const login = async (userId: string, pin: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin })
      })
      const data = await res.json()
      if (data.success && data.user) {
        setUser(data.user)
        router.push('/')
        return { success: true }
      }
      return { success: false, error: data.error || 'Erro ao fazer login' }
    } catch (err: any) {
      console.error('Login error:', err)
      return { success: false, error: 'Erro de rede ou servidor' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <UserContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
