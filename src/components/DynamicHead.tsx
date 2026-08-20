'use client'

import { useEffect } from 'react'
import { useBrand } from '@/context/BrandContext'

export default function DynamicHead() {
  const { siteName, logoUrl } = useBrand()

  useEffect(() => {
    // Update page title
    document.title = siteName || 'MktFlow'
  }, [siteName])

  useEffect(() => {
    if (!logoUrl) return

    // Update favicon
    const updateFavicon = (href: string) => {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = href
    }

    // If it's a data URL or a regular URL, use it directly
    updateFavicon(logoUrl)
  }, [logoUrl])

  return null
}
