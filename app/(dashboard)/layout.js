'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading) return <div className="app-loading">Cargando…</div>
  if (!user)   return null

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="content-inner">{children}</div>
      </main>
    </div>
  )
}
