'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ProfileModal from './ProfileModal'

const NAV = [
  { to: '/inicio',     label: 'Inicio',     icon: HomeIcon },
  { to: '/ejercicios', label: 'Ejercicios', icon: DumbbellIcon },
  { to: '/rutinas',    label: 'Rutinas',    icon: ListIcon },
  { to: '/historial',  label: 'Historial',  icon: ChartIcon },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router   = useRouter()
  const [editProfile, setEditProfile] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <>
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-word">Des</span><span className="brand-accent">pertar</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            href={to}
            className={`nav-item ${pathname === to ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="user-info-btn" onClick={() => setEditProfile(true)}>
          {user?.photoURL
            ? <img src={user.photoURL} alt="" className="user-avatar" />
            : <div className="user-avatar-fallback"><UserIcon /></div>
          }
          <span className="user-name">{user?.displayName?.split(' ')[0]}</span>
          <EditPenIcon />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Salir</button>
      </div>
    </aside>

    {editProfile && <ProfileModal onClose={() => setEditProfile(false)} />}
    </>
  )
}

function HomeIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
}
function DumbbellIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h11M6.5 17.5h11M4 8.5v7M20 8.5v7M2 10.5v3M22 10.5v3"/></svg>
}
function ListIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
}
function ChartIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
}
const UserIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const EditPenIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
