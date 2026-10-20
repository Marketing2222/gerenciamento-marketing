'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const logged =
      typeof window !== 'undefined' && !!window.localStorage.getItem('mktflow_current_user_id')
    router.replace(logged ? '/tarefas' : '/login')
  }, [router])

  return null
}
