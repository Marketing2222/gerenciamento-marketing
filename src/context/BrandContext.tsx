'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface BrandContextType {
  siteName: string
  logoUrl: string
  setSiteName: (name: string) => void
  setLogoUrl: (url: string) => void
}

const BrandContext = createContext<BrandContextType | undefined>(undefined)

const DEFAULT_NAME = 'MktFlow'
const DEFAULT_LOGO = ''

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [siteName, setSiteNameState] = useState(DEFAULT_NAME)
  const [logoUrl, setLogoUrlState] = useState(DEFAULT_LOGO)

  useEffect(() => {
    const savedName = localStorage.getItem('mktflow-site-name')
    const savedLogo = localStorage.getItem('mktflow-logo-url')
    if (savedName) setSiteNameState(savedName)
    if (savedLogo) setLogoUrlState(savedLogo)
  }, [])

  const setSiteName = useCallback((name: string) => {
    setSiteNameState(name)
    localStorage.setItem('mktflow-site-name', name)
  }, [])

  const setLogoUrl = useCallback((url: string) => {
    setLogoUrlState(url)
    localStorage.setItem('mktflow-logo-url', url)
  }, [])

  return (
    <BrandContext.Provider value={{ siteName, logoUrl, setSiteName, setLogoUrl }}>
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
