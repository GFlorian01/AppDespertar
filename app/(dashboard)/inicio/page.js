'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useRoutines } from '@/hooks/useRoutines'
import { useSessions } from '@/hooks/useSessions'

export default function HomePage() {
  const { user } = useAuth()
  const { routines } = useRoutines()
  const { sessions } = useSessions()
  const router = useRouter()

  const firstName   = user?.displayName?.split(' ')[0] || 'tú'
  const lastSession = sessions[0]
  const totalTime   = sessions.reduce((a, s) => a + (s.totalDuration || 0), 0)
  const avgSat      = sessions.filter(s => s.overallSatisfaction > 0)
    .reduce((a, s, _, arr) => a + s.overallSatisfaction / arr.length, 0)

  const fmt = (s) => { const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); return h > 0 ? `${h}h ${m}m` : `${m}m` }
  const fmtDate = (ts) => { if (!ts) return ''; const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }) }
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="home-page animate-in">
      <div className="home-greeting">
        <h1 className="home-title">{greeting},<br /><span className="home-name">{firstName}.</span></h1>
        {lastSession
          ? <p className="home-subtitle">Última sesión: <strong>{lastSession.routineName}</strong> · {fmtDate(lastSession.startTime)}</p>
          : <p className="home-subtitle">¿Listo para despertar tu cuerpo hoy?</p>
        }
      </div>

      {sessions.length > 0 && (
        <div className="home-stats">
          <div className="home-stat card"><span className="hs-value">{sessions.length}</span><span className="hs-label">Sesiones totales</span></div>
          <div className="home-stat card"><span className="hs-value">{fmt(totalTime)}</span><span className="hs-label">Tiempo entrenado</span></div>
          <div className="home-stat card"><span className="hs-value">{avgSat > 0 ? avgSat.toFixed(1) + ' ★' : '—'}</span><span className="hs-label">Satisfacción promedio</span></div>
        </div>
      )}

      <div className="home-section">
        <h2 className="home-section-title">Tus rutinas</h2>
        {routines.length === 0 ? (
          <div className="home-empty card">
            <p>Aún no tienes rutinas.</p>
            <button className="btn btn-primary" onClick={() => router.push('/rutinas')}>Crear primera rutina</button>
          </div>
        ) : (
          <div className="home-routines">
            {routines.map(r => (
              <div key={r.id} className="home-routine-card card">
                <div className="hrc-info">
                  <h3 className="hrc-name">{r.name}</h3>
                  <p className="hrc-meta">{r.exercises?.length || 0} ejercicios · {r.exercises?.reduce((a, e) => a + e.sets, 0) || 0} series</p>
                </div>
                <div className="hrc-thumbs">
                  {r.exercises?.slice(0, 2).map((ex, i) => (
                    <div key={i} className="hrc-thumb">
                      <video src={ex.videoUrl} muted playsInline className="hrc-video"
                        onMouseEnter={e => e.target.play()}
                        onMouseLeave={e => { e.target.pause(); e.target.currentTime = ex.trimStart || 0 }} />
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={() => router.push(`/sesion/${r.id}`)}>
                  <PlayIcon /> Iniciar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {sessions.length > 0 && (
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Sesiones recientes</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/historial')}>Ver todo →</button>
          </div>
          <div className="home-recent">
            {sessions.slice(0, 3).map(s => (
              <div key={s.id} className="home-recent-item card">
                <div className="hri-info">
                  <span className="hri-name">{s.routineName}</span>
                  <span className="hri-date">{fmtDate(s.startTime)}</span>
                </div>
                <div className="hri-stats">
                  <span>{Math.floor((s.totalDuration || 0) / 60)}m</span>
                  <Stars value={s.overallSatisfaction} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Stars({ value }) {
  return (
    <div className="mini-stars-row">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="11" height="11" viewBox="0 0 24 24" fill={s <= value ? '#d4a84b' : 'none'} stroke={s <= value ? '#d4a84b' : '#5e5349'} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}
const PlayIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
