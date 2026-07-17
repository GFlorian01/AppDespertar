'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import ProfileModal from './ProfileModal'
import { DumbbellIcon, ListIcon, ChartIcon, UserIcon } from '@/components/Icons'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { t } = useLang()
  const pathname = usePathname()
  const router   = useRouter()
  const [editProfile, setEditProfile] = useState(false)

  const NAV = [
    { to: '/inicio',     label: t('nav.home'),      icon: HomeIcon },
    { to: '/ejercicios', label: t('nav.exercises'),  icon: DumbbellIcon },
    { to: '/rutinas',    label: t('nav.routines'),   icon: ListIcon },
    { to: '/historial',  label: t('nav.history'),    icon: ChartIcon },
  ]

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

        {/* Profile button — only visible on mobile bottom nav */}
        <button
          className="nav-item mobile-profile-btn"
          onClick={() => setEditProfile(true)}
        >
          {user?.photoURL
            ? <img src={user.photoURL} alt="" className="mobile-avatar" />
            : <UserIcon size={18} />
          }
          <span>{t('nav.profile')}</span>
        </button>
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
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>{t('nav.logout')}</button>
      </div>
    </aside>

    {editProfile && <ProfileModal onClose={() => setEditProfile(false)} />}
    </>
  )
}

function HomeIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
}
const EditPenIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
