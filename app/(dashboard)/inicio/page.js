'use client'

import { useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import { useRoutines } from '@/hooks/useRoutines'
import { useExercises } from '@/hooks/useExercises'
import { useSessions } from '@/hooks/useSessions'

export default function HomePage() {
  const { user } = useAuth()
  const { t, lang } = useLang()
  const { routines } = useRoutines()
  const { exercises } = useExercises()
  const { sessions } = useSessions()
  const router = useRouter()

  const firstName   = user?.displayName?.split(' ')[0] || 'tú'
  const lastSession = sessions[0]
  const totalTime   = sessions.reduce((a, s) => a + (s.totalDuration || 0), 0)
  const avgSat      = sessions.filter(s => s.overallSatisfaction > 0)
    .reduce((a, s, _, arr) => a + s.overallSatisfaction / arr.length, 0)

  const locale = lang === 'en' ? 'en' : 'es'
  const fmt = (s) => { const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); return h > 0 ? `${h}h ${m}m` : `${m}m` }
  const fmtDate = (ts) => { if (!ts) return ''; const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('greeting.morning') : hour < 19 ? t('greeting.afternoon') : t('greeting.evening')

  const isNewUser = routines.length === 0 && sessions.length === 0
  const hasSharedExercises = exercises.some(e => e.userId !== user?.uid && e.isPublic)

  return (
    <div className="home-page animate-in">
      <div className="home-greeting">
        <h1 className="home-title">{greeting},<br /><span className="home-name">{firstName}.</span></h1>
        {lastSession
          ? <p className="home-subtitle">{t('greeting.lastSession')}: <strong>{lastSession.routineName}</strong> · {fmtDate(lastSession.startTime)}</p>
          : <p className="home-subtitle">{t('greeting.subtitle')}</p>
        }
      </div>

      {sessions.length > 0 && (
        <div className="home-stats">
          <div className="home-stat card"><span className="hs-value">{sessions.length}</span><span className="hs-label">{t('home.stats.sessions')}</span></div>
          <div className="home-stat card"><span className="hs-value">{fmt(totalTime)}</span><span className="hs-label">{t('home.stats.time')}</span></div>
          <div className="home-stat card"><span className="hs-value">{avgSat > 0 ? avgSat.toFixed(1) + ' ★' : '—'}</span><span className="hs-label">{t('home.stats.satisfaction')}</span></div>
        </div>
      )}

      {isNewUser && (
        <div className="home-section">
          <h2 className="home-section-title">{t('onboard.title')}</h2>
          <div className="onboard-steps">
            <button className="onboard-step card" onClick={() => router.push('/ejercicios')}>
              <span className="onboard-num">1</span>
              <div className="onboard-info">
                <h3 className="onboard-step-title">{t('onboard.step1.title')}</h3>
                <p className="onboard-step-desc">
                  {hasSharedExercises ? t('onboard.step1.desc.shared') : t('onboard.step1.desc.empty')}
                </p>
              </div>
              <span className="onboard-arrow">→</span>
            </button>
            <button className="onboard-step card" onClick={() => router.push('/rutinas')}>
              <span className="onboard-num">2</span>
              <div className="onboard-info">
                <h3 className="onboard-step-title">{t('onboard.step2.title')}</h3>
                <p className="onboard-step-desc">{t('onboard.step2.desc')}</p>
              </div>
              <span className="onboard-arrow">→</span>
            </button>
            <div className="onboard-step card onboard-step-locked">
              <span className="onboard-num">3</span>
              <div className="onboard-info">
                <h3 className="onboard-step-title">{t('onboard.step3.title')}</h3>
                <p className="onboard-step-desc">{t('onboard.step3.desc')}</p>
              </div>
              <span className="onboard-arrow onboard-check">✓</span>
            </div>
          </div>
        </div>
      )}

      <div className="home-section">
        <h2 className="home-section-title">{t('home.routines')}</h2>
        {routines.length === 0 ? (
          <div className="home-empty card">
            {isNewUser
              ? <p>{t('onboard.noRoutines')}</p>
              : <>
                  <p>{t('home.noRoutines')}</p>
                  <button className="btn btn-primary" onClick={() => router.push('/rutinas')}>{t('home.createFirst')}</button>
                </>
            }
          </div>
        ) : (
          <div className="home-routines">
            {routines.map(r => (
              <div key={r.id} className="home-routine-card card">
                <div className="hrc-info">
                  <h3 className="hrc-name">{r.name}</h3>
                  <p className="hrc-meta">{r.exercises?.length || 0} {t('home.exercises.label')} · {r.exercises?.reduce((a, e) => a + e.sets, 0) || 0} {t('home.sets.label')}</p>
                </div>
                <div className="hrc-thumbs">
                  {r.exercises?.slice(0, 2).map((ex, i) => (
                    <div key={i} className="hrc-thumb">
                      <TrimmedThumb src={ex.videoUrl} trimStart={ex.trimStart || 0} trimEnd={ex.trimEnd || 0} className="hrc-video" />
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={() => router.push(`/sesion/${r.id}`)}>
                  <PlayIcon /> {t('home.start')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {sessions.length > 0 && (
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">{t('home.recent')}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/historial')}>{t('home.seeAll')}</button>
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

function TrimmedThumb({ src, trimStart = 0, trimEnd = 0, className }) {
  const ref = useRef(null)
  useEffect(() => {
    const vid = ref.current; if (!vid) return
    vid.currentTime = trimStart
    vid.play().catch(() => {})
    const onTime = () => { if (trimEnd > trimStart && vid.currentTime >= trimEnd) vid.currentTime = trimStart }
    vid.addEventListener('timeupdate', onTime)
    return () => vid.removeEventListener('timeupdate', onTime)
  }, [src, trimStart, trimEnd])
  return <video ref={ref} src={src} className={className} muted playsInline preload="metadata" />
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
