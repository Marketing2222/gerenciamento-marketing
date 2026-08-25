'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { db, isFirebaseConfigured } from '@/lib/firebaseClient'
import { onSnapshot, getDoc, doc } from 'firebase/firestore'

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
  logout: () => void
  refreshUser: () => void
}

const USER_STORAGE_KEY = 'mktflow_current_user_id'

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const unsubRef = React.useRef<(() => void) | null>(null)

  const refreshUser = useCallback(() => {
    // Cleanup previous listener
    if (unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
    }

    if (!isFirebaseConfigured()) {
      setUser(null)
      setLoading(false)
      if (pathname !== '/login') {
        router.push('/login')
      }
      return undefined
    }

    const savedId = typeof window !== 'undefined' ? localStorage.getItem(USER_STORAGE_KEY) : null
    if (!savedId) {
      setUser(null)
      setLoading(false)
      if (pathname !== '/login') {
        router.push('/login')
      }
      return undefined
    }

    // Ouve o documento do usuário logado (tempo real p/ atualizações de perfil)
    const unsub = onSnapshot(
      doc(db(), 'users', savedId),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data()
          const u: User = { id: snap.id, name: d.name || '', role: d.role || '', avatarUrl: d.avatarUrl || '' }
          setUser(u)
        } else {
          localStorage.removeItem(USER_STORAGE_KEY)
          setUser(null)
          if (pathname !== '/login') {
            router.push('/login')
          }
        }
        setLoading(false)
      },
      () => {
        setUser(null)
        setLoading(false)
        if (pathname !== '/login') {
          router.push('/login')
        }
      }
    )
    unsubRef.current = unsub
    return unsub
  }, [pathname, router])

  useEffect(() => {
    const unsub = refreshUser()
    return () => {
      unsub?.()
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }
    }
  }, [refreshUser])

  const login = useCallback(
    async (userId: string, pin: string) => {
      if (!isFirebaseConfigured()) {
        return { success: false, error: 'Firebase não configurado. Preencha as variáveis de ambiente e recarregue.' }
      }
      try {
        const snap = await getDoc(doc(db(), 'users', userId))
        if (!snap.exists()) {
          return { success: false, error: 'Usuário não encontrado' }
        }
        const data = snap.data()
        const storedPin = data.pin || ''
        if (!storedPin) {
          return { success: false, error: 'Este usuário não possui PIN configurado. Configure um PIN primeiro.' }
        }
        if (storedPin !== pin) {
          return { success: false, error: 'PIN incorreto' }
        }
        localStorage.setItem(USER_STORAGE_KEY, userId)
        // Let refreshUser handle the session listener (no duplicate)
        setUser({ id: snap.id, name: data.name || '', role: data.role || '', avatarUrl: data.avatarUrl || '' })
        setLoading(false)
        router.push('/')
        return { success: true }
      } catch (err: unknown) {
        console.error('Login error:', err)
        return { success: false, error: 'Erro ao fazer login' }
      }
    },
    [router]
  )

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
    setUser(null)
    router.push('/login')
  }, [router])

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