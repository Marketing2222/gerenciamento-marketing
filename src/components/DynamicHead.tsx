'use client'

import { useEffect } from 'react'
import { useBrand } from '@/context/BrandContext'

const FAV_ID = 'mkt-dynamic-favicon'
const DEFAULT_ICON = '/favicon.ico'

export default function DynamicHead() {
  const { siteName, logoUrl } = useBrand()

  useEffect(() => {
    // Update page title
    document.title = siteName || 'MktFlow'
  }, [siteName])

  useEffect(() => {
    const apply = () => {
      const links = Array.from(document.head.querySelectorAll<HTMLLinkElement>("link[rel~='icon']"))
      if (!logoUrl) {
        // Sem logo: remove apenas o link que nós criamos e restaura o padrão do React
        links.forEach((l) => {
          if (l.id === FAV_ID) l.remove()
          else if (l.getAttribute('href') !== DEFAULT_ICON) l.setAttribute('href', DEFAULT_ICON)
        })
        return
      }
      if (links.length === 0) {
        const l = document.createElement('link')
        l.id = FAV_ID
        l.rel = 'icon'
        l.setAttribute('href', logoUrl)
        document.head.appendChild(l)
        return
      }
      // Nunca removemos links do React (causa "removeChild" null e trava o app);
      // só apontamos todos para o logo customizado.
      links.forEach((l) => {
        if (l.getAttribute('href') !== logoUrl) l.setAttribute('href', logoUrl)
      })
    }

    apply()

    // Reaplica quando o React recriar/resetar o link do favicon em reconciliações
    // do <head> (só mutação de atributo — idempotente, o loop converge sozinho).
    const observer = new MutationObserver(() => apply())
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href'],
    })

    return () => {
      observer.disconnect()
      document.getElementById(FAV_ID)?.remove()
    }
  }, [logoUrl])

  return null
}
