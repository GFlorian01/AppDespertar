'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { user, loading, loginWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/inicio')
  }, [user, loading, router])

  const handleLogin = async () => {
    try {
      await loginWithGoogle()
      router.replace('/inicio')
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="app-loading">Cargando…</div>

  return (
    <div className="login-split">

      {/* ── Left: welcome panel ── */}
      <div className="login-welcome">
        <div className="lw-blobs">
          <div className="lw-blob b1" /><div className="lw-blob b2" /><div className="lw-blob b3" />
        </div>

        <div className="lw-content">
          <div className="lw-logo">
            <span className="lw-logo-word">Des</span><span className="lw-logo-accent">pertar</span>
          </div>

          <h2 className="lw-headline">
            Mueve tu cuerpo.<br />
            Conoce tu progreso.<br />
            Hazlo tuyo.
          </h2>

          <div className="lw-features">
            <div className="lw-feature">
              <div className="lw-feature-icon">
                <StretchIcon />
              </div>
              <div>
                <span className="lw-feature-title">Ejercicios con video</span>
                <span className="lw-feature-desc">Sube y recorta tus videos de Instagram</span>
              </div>
            </div>
            <div className="lw-feature">
              <div className="lw-feature-icon">
                <RoutineIcon />
              </div>
              <div>
                <span className="lw-feature-title">Rutinas personalizadas</span>
                <span className="lw-feature-desc">Arma series y repeticiones a tu medida</span>
              </div>
            </div>
            <div className="lw-feature">
              <div className="lw-feature-icon">
                <ChartIcon />
              </div>
              <div>
                <span className="lw-feature-title">Registra tu progreso</span>
                <span className="lw-feature-desc">Tiempo, satisfacción y ejercicios completados</span>
              </div>
            </div>
          </div>

          <div className="lw-categories">
            {['Estiramiento', 'Caderas', 'Elasticidad', 'Postura'].map(c => (
              <span key={c} className="lw-cat-pill">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: login form ── */}
      <div className="login-form-side">
        <div className="login-card animate-in">
          <div className="login-logo">
            <span className="logo-word">Des</span><span className="logo-accent">pertar</span>
          </div>
          <p className="login-tagline">Tu espacio de movimiento,<br />a tu ritmo.</p>
          <div className="login-divider" />
          <button className="login-google-btn" onClick={handleLogin}>
            <GoogleIcon />
            Continuar con Google
          </button>
          <p className="login-hint">Guarda tus rutinas, ejercicios y progreso de forma segura.</p>
        </div>
      </div>

    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function StretchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1.5"/><path d="M12 7v5l3 3"/><path d="M9 12l-3 3"/><path d="M12 17v4"/>
    </svg>
  )
}

function RoutineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="13" y2="13"/>
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  )
}
