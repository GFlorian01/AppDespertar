'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRoutines } from '@/hooks/useRoutines'
import { useSessions } from '@/hooks/useSessions'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'

const PHASE = { EXERCISE: 'exercise', REST: 'rest', DONE: 'done' }

export default function SessionPage() {
  const { routineId } = useParams()
  const { routines } = useRoutines()
  const { saveSession, sessions, loading: sessionsLoading } = useSessions()
  const { user, loading: authLoading } = useAuth()
  const { t, lang } = useLang()
  const router = useRouter()

  const routine = routines.find(r => r.id === routineId)

  const [exIdx,       setExIdx]       = useState(0)
  const [setIdx,      setSetIdx]      = useState(0)
  const [phase,       setPhase]       = useState(PHASE.EXERCISE)
  const [restSecs,    setRestSecs]    = useState(0)
  const [elapsed,     setElapsed]     = useState(0)
  const [results,     setResults]     = useState([])
  const [exRatings,   setExRatings]   = useState([])
  const [finalRating, setFinalRating] = useState(0)
  const [saving,      setSaving]      = useState(false)
  const [sidesDone,   setSidesDone]   = useState(0)

  const videoRef       = useRef(null)
  const sessionStart   = useRef(Date.now())
  const restRef        = useRef(null)
  const welcomeSpoken  = useRef(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  // TTS: welcome message on session start
  useEffect(() => {
    if (!routine || !user || welcomeSpoken.current || sessionsLoading) return
    welcomeSpoken.current = true
    const firstName = (user.displayName || '').split(' ')[0]
    const sessionNum = sessions.length + 1
    const text = lang === 'en'
      ? `Welcome${firstName ? ' ' + firstName : ''}, starting session ${sessionNum} of ${routine.name}`
      : `Bienvenido${firstName ? ' ' + firstName : ''}, estás iniciando la sesión ${sessionNum} de ${routine.name}`
    setTimeout(() => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = lang === 'en' ? 'en-US' : 'es-ES'
      utt.rate = 0.9
      window.speechSynthesis.speak(utt)
    }, 600)
  }, [routine, user, sessionsLoading])

  // TTS: countdown in the last 5 seconds of rest (offset by 1s to compensate TTS latency)
  useEffect(() => {
    if (phase !== PHASE.REST || restSecs > 6 || restSecs <= 1) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const num = restSecs - 1
    const text = num === 5
      ? (lang === 'en' ? 'Starting in 5' : 'Se inicia en 5')
      : String(num)
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = lang === 'en' ? 'en-US' : 'es-ES'
    utt.rate = 1.0
    window.speechSynthesis.speak(utt)
  }, [restSecs, phase])

  useEffect(() => {
    if (phase === PHASE.DONE) return
    const ti = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStart.current) / 1000)), 1000)
    return () => clearInterval(ti)
  }, [phase])

  const currentEx = routine?.exercises[exIdx]
  const isLastSet = currentEx && setIdx >= currentEx.sets - 1
  const isLastEx  = routine && exIdx >= routine.exercises.length - 1

  useEffect(() => {
    const vid = videoRef.current; if (!vid || !currentEx) return
    const tStart = currentEx.trimStart || 0
    const tEnd   = currentEx.trimEnd   || 0

    const seekAndPlay = () => {
      vid.currentTime = tStart
      vid.play().catch(() => {})
    }

    // Wait for metadata before seeking — setting currentTime before metadata loads is ignored
    if (vid.readyState >= 1) seekAndPlay()
    else vid.addEventListener('loadedmetadata', seekAndPlay, { once: true })

    const onTimeUpdate = () => {
      if (tEnd > tStart && vid.currentTime >= tEnd) vid.currentTime = tStart
    }
    const onEnded = () => { vid.currentTime = tStart; vid.play().catch(() => {}) }

    vid.addEventListener('timeupdate', onTimeUpdate)
    vid.addEventListener('ended', onEnded)
    return () => {
      vid.removeEventListener('loadedmetadata', seekAndPlay)
      vid.removeEventListener('timeupdate', onTimeUpdate)
      vid.removeEventListener('ended', onEnded)
    }
  }, [exIdx, phase])

  useEffect(() => {
    if (phase !== PHASE.REST) return
    setRestSecs(currentEx?.restTime || 30)
    restRef.current = setInterval(() => {
      setRestSecs(s => { if (s <= 1) { clearInterval(restRef.current); setPhase(PHASE.EXERCISE); return 0 } return s - 1 })
    }, 1000)
    return () => clearInterval(restRef.current)
  }, [phase])

  useEffect(() => { setSidesDone(0) }, [exIdx, setIdx])

  const recordAndAdvance = useCallback((skipped) => {
    const completedSets = skipped ? setIdx : (currentEx?.sets ?? 0)
    setResults(r => [...r, {
      exerciseId:   currentEx.exerciseId,
      exerciseName: currentEx.exerciseName,
      plannedSets:  currentEx.sets,
      completedSets,
      skipped,
      satisfaction: 0,
    }])
    setExRatings(r => [...r, 0])
    if (isLastEx) { setPhase(PHASE.DONE) }
    else          { setExIdx(i=>i+1); setSetIdx(0); setPhase(PHASE.EXERCISE) }
  }, [currentEx, setIdx, isLastEx])

  const handleMainBtn = useCallback(() => {
    if (currentEx?.unilateral) {
      if (sidesDone < 1) { setSidesDone(1); return }
      setSidesDone(2)
    }
    if (isLastSet) { recordAndAdvance(false) }
    else           { setSetIdx(i=>i+1); setPhase(PHASE.REST) }
  }, [currentEx, sidesDone, isLastSet, recordAndAdvance])

  const skipExercise = useCallback(() => { recordAndAdvance(true) }, [recordAndAdvance])

  const handleSave = async () => {
    setSaving(true)
    const finalResults = results.map((r, i) => ({ ...r, satisfaction: exRatings[i] || 0 }))
    try {
      await saveSession({ routineId, routineName: routine.name, totalDuration: elapsed, overallSatisfaction: finalRating, exercises: finalResults, endTime: new Date().toISOString() })
      router.push('/historial')
    } finally { setSaving(false) }
  }

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  if (authLoading || !routine) return <div className="session-page"><div className="session-loading">Cargando…</div></div>

  if (phase === PHASE.DONE) {
    const completed = results.filter(r=>!r.skipped).length
    const skipped   = results.filter(r=>r.skipped).length
    return (
      <div className="session-done animate-in">
        <div className="done-card card">
          <div className="done-icon">🌅</div>
          <h1 className="done-title">{t('session.done.title')}</h1>
          <p className="done-subtitle">{routine.name}</p>

          <div className="done-stats">
            <div className="done-stat"><span className="stat-value">{fmt(elapsed)}</span><span className="stat-label">{t('session.done.time')}</span></div>
            <div className="done-stat"><span className="stat-value">{completed}</span><span className="stat-label">{t('session.done.completed')}</span></div>
            <div className="done-stat"><span className="stat-value">{skipped}</span><span className="stat-label">{t('session.done.skipped')}</span></div>
          </div>

          <div className="done-ex-ratings">
            <p className="done-section-title">{t('session.done.howWas')}</p>
            {results.map((r, i) => (
              <div key={i} className={`done-ex-row ${r.skipped ? 'done-ex-skipped' : ''}`}>
                <div className="done-ex-info">
                  <span className="done-ex-name">{r.exerciseName}</span>
                  {r.skipped
                    ? <span className="done-ex-skip-badge">{t('session.skipped')}</span>
                    : <span className="done-ex-sets">{r.completedSets}/{r.plannedSets} {t('rtform.sets').toLowerCase()}</span>
                  }
                </div>
                {!r.skipped && (
                  <StarRating
                    value={exRatings[i] || 0}
                    onChange={val => setExRatings(prev => { const next = [...prev]; next[i] = val; return next })}
                    size="sm"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="done-rating-section">
            <p className="done-rating-label">{t('session.done.overall')}</p>
            <StarRating value={finalRating} onChange={setFinalRating} size="lg" />
          </div>

          <div className="done-actions">
            <button className="btn btn-ghost" onClick={()=>router.push('/rutinas')}>{t('rtform.cancel')}</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving||finalRating===0}>
              {saving ? t('session.done.saving') : t('session.done.save')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const totalSets = routine.exercises.reduce((a,e)=>a+e.sets,0)
  const progress  = ((exIdx * currentEx.sets + setIdx) / totalSets) * 100

  const mainBtnLabel = phase === PHASE.REST
    ? `${t('session.rest')} ${restSecs}s`
    : currentEx.unilateral && sidesDone === 0
      ? t('session.leftDone')
      : currentEx.unilateral && sidesDone === 1
        ? t('session.rightDone')
        : isLastSet
          ? t('session.finishEx')
          : t('session.setDone')

  return (
    <div className="session-page">
      <div className="session-topbar">
        <button className="btn btn-ghost btn-sm" onClick={()=>{ if(confirm('¿Salir de la sesión?')) router.push('/rutinas') }}><CloseIcon /></button>
        <div className="session-timer">{fmt(elapsed)}</div>
        <div className="session-progress-text">{exIdx+1} / {routine.exercises.length}</div>
      </div>
      <div className="session-progress-bar"><div className="session-progress-fill" style={{width:`${progress}%`}} /></div>

      <div className="session-main">
        <div className="session-video-wrap">
          <video ref={videoRef} src={currentEx.videoUrl} className="session-video" muted playsInline autoPlay />
          {phase === PHASE.REST && (
            <div className="rest-overlay">
              <div className="rest-countdown">{restSecs}</div>
              <p className="rest-label">{t('session.rest')}…</p>
              <button className="btn btn-sage btn-sm" onClick={()=>{ clearInterval(restRef.current); setPhase(PHASE.EXERCISE) }}>{t('session.skip')}</button>
            </div>
          )}
        </div>
        <div className="session-controls">
          <div className="session-ex-info">
            <h2 className="session-ex-name">{currentEx.exerciseName}</h2>
            <p className="session-ex-meta">{currentEx.reps} reps · {currentEx.sets} {t('rtform.sets').toLowerCase()}</p>
          </div>
          <div className="session-set-indicator">
            {Array.from({length:currentEx.sets}).map((_,i)=>(
              <div key={i} className={`set-dot ${i<setIdx?'done':i===setIdx?'current':''}`} />
            ))}
          </div>
          <div className="session-set-label">{t('rtform.sets')} <strong>{setIdx+1}</strong> / <strong>{currentEx.sets}</strong></div>

          {currentEx.unilateral && phase !== PHASE.REST && (
            <div className="sides-indicator">
              <div className={`side-btn ${sidesDone >= 1 ? 'done' : 'active'}`}>
                {sidesDone >= 1 ? <CheckSide /> : <BodyIcon />}
                <span>{t('session.left')}</span>
              </div>
              <div className="sides-arrow">→</div>
              <div className={`side-btn ${sidesDone >= 2 ? 'done' : sidesDone === 1 ? 'active' : 'pending'}`}>
                {sidesDone >= 2 ? <CheckSide /> : <BodyIcon mirrored />}
                <span>{t('session.right')}</span>
              </div>
            </div>
          )}

          <div className="session-actions">
            <button className="btn btn-ghost" onClick={skipExercise}><SkipIcon /> {t('session.skip')}</button>
            <button className="btn btn-primary session-main-btn" onClick={handleMainBtn} disabled={phase===PHASE.REST}>
              {mainBtnLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="session-queue">
        {routine.exercises.map((ex,i)=>(
          <div key={i} className={`queue-item ${i===exIdx?'active':i<exIdx?'done':''}`}>
            <div className="queue-thumb"><video src={ex.videoUrl} muted playsInline className="queue-video" /></div>
            <div className="queue-info"><span className="queue-name">{ex.exerciseName}</span><span className="queue-meta">{ex.sets}×{ex.reps}</span></div>
            {i<exIdx && <CheckMark />}
          </div>
        ))}
      </div>
    </div>
  )
}

function StarRating({ value, onChange, size='md' }) {
  const [hover, setHover] = useState(0)
  const sz = size==='lg'?36:24
  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(s=>(
        <button key={s} type="button" className={`star-btn ${s<=(hover||value)?'active':''}`} onMouseEnter={()=>setHover(s)} onMouseLeave={()=>setHover(0)} onClick={()=>onChange(s)}>
          <svg width={sz} height={sz} viewBox="0 0 24 24" fill={s<=(hover||value)?'currentColor':'none'} stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      ))}
    </div>
  )
}

const CloseIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const SkipIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
const CheckMark  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const CheckSide  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const BodyIcon   = ({ mirrored }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    style={mirrored ? { transform:'scaleX(-1)' } : {}}>
    <circle cx="12" cy="4" r="2"/>
    <path d="M9 9h6l1 5h-2l-1 6h-2l-1-6H8z"/>
    <path d="M9 14l-2 4M15 14l2 4"/>
  </svg>
)
