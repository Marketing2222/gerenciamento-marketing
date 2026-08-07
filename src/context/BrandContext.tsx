'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { isFirebaseConfigured } from '@/lib/firebaseClient'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'

interface BrandContextType {
  siteName: string
  logoUrl: string
  applyBrand: (name: string, logo: string) => void
}

const BrandContext = createContext<BrandContextType | undefined>(undefined)

const DEFAULT_NAME = 'MktFlow'
const DEFAULT_LOGO = ''

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [siteName, setSiteNameState] = useState(DEFAULT_NAME)
  const [logoUrl, setLogoUrlState] = useState(DEFAULT_LOGO)

  // Carrega e escuta o documento de marca no Firestore quando configurado.
    useEffect(() => {
    if (!isFirebaseConfigured()) {
      // Fallback para localStorage (sem Firebase)
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSiteNameState(localStorage.getItem('mktflow-site-name') || DEFAULT_NAME)
        setLogoUrlState(localStorage.getItem('mktflow-logo-url') || DEFAULT_LOGO)
      }
      return
    }
    const brandRef = doc(db(), 'settings', 'brand')
    const unsub = onSnapshot(brandRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data()
        setSiteNameState(d.siteName || DEFAULT_NAME)
        setLogoUrlState(d.logoUrl || DEFAULT_LOGO)
      } else {
        setSiteNameState(DEFAULT_NAME)
        setLogoUrlState(DEFAULT_LOGO)
      }
    })
    return () => unsub()
  }, [])

  const persist = useCallback((name: string, logo: string) => {
    if (isFirebaseConfigured()) {
      void setDoc(doc(db(), 'settings', 'brand'), { siteName: name, logoUrl: logo })
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('mktflow-site-name', name)
      localStorage.setItem('mktflow-logo-url', logo)
    }
  }, [])

  // Aplica nome e logo em uma única gravação atômica (evita corrida de escrita).
  const applyBrand = useCallback(
    (name: string, logo: string) => {
      const finalName = name.trim() || DEFAULT_NAME
      setSiteNameState(finalName)
      setLogoUrlState(logo)
      persist(finalName, logo)
    },
    [persist]
  )

  return (
    <BrandContext.Provider value={{ siteName, logoUrl, applyBrand }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  const context = useContext(BrandContext)
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider')
  }
  return context
}