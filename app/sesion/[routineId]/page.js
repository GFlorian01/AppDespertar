'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRoutines } from '@/hooks/useRoutines'
import { useSessions } from '@/hooks/useSessions'
import { useAuth } from '@/contexts/AuthContext'

const PHASE = { EXERCISE: 'exercise', REST: 'rest', RATE_EX: 'rate_exercise', DONE: 'done' }

export default function SessionPage() {
  const { routineId } = useParams()
  const { routines } = useRoutines()
  const { saveSession } = useSessions()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const routine = routines.find(r => r.id === routineId)

  const [exIdx,       setExIdx]       = useState(0)
  const [setIdx,      setSetIdx]      = useState(0)
  const [phase,       setPhase]       = useState(PHASE.EXERCISE)
  const [restSecs,    setRestSecs]    = useState(0)
  const [elapsed,     setElapsed]     = useState(0)
  const [results,     setResults]     = useState([])
  const [rating,      setRating]      = useState(0)
  const [finalRating, setFinalRating] = useState(0)
  const [saving,      setSaving]      = useState(false)

  const videoRef     = useRef(null)
  const sessionStart = useRef(Date.now())
  const restRef      = useRef(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStart.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  const currentEx = routine?.exercises[exIdx]
  const isLastSet = currentEx && setIdx >= currentEx.sets - 1
  const isLastEx  = routine && exIdx >= routine.exercises.length - 1

  useEffect(() => {
    const vid = videoRef.current; if (!vid || !currentEx) return
    vid.currentTime = currentEx.trimStart || 0
    vid.play().catch(() => {})
    const handle = () => { if (vid.currentTime >= (currentEx.trimEnd || vid.duration)) vid.currentTime = currentEx.trimStart || 0 }
    vid.addEventListener('timeupdate', handle)
    return () => vid.removeEventListener('timeupdate', handle)
  }, [exIdx, phase])

  useEffect(() => {
    if (phase !== PHASE.REST) return
    setRestSecs(currentEx?.restTime || 30)
    restRef.current = setInterval(() => {
      setRestSecs(s => { if (s <= 1) { clearInterval(restRef.current); setPhase(PHASE.EXERCISE); return 0 } return s - 1 })
    }, 1000)
    return () => clearInterval(restRef.current)
  }, [phase])

  const advanceExercise = () => { if (isLastEx) { setPhase(PHASE.DONE) } else { setExIdx(i=>i+1); setSetIdx(0); setPhase(PHASE.EXERCISE) } }

  const completeSet = useCallback(() => {
    if (isLastSet) { setPhase(PHASE.RATE_EX) }
    else           { setSetIdx(i=>i+1); setPhase(PHASE.REST) }
  }, [isLastSet])

  const skipExercise = useCallback(() => {
    setResults(r => [...r, { exerciseId: currentEx.exerciseId, exerciseName: currentEx.exerciseName, plannedSets: currentEx.sets, completedSets: setIdx, skipped: true, satisfaction: 0 }])
    advanceExercise()
  }, [currentEx, setIdx])

  const submitRating = () => {
    setResults(r => [...r, { exerciseId: currentEx.exerciseId, exerciseName: currentEx.exerciseName, plannedSets: currentEx.sets, completedSets: currentEx.sets, skipped: false, satisfaction: rating }])
    setRating(0)
    advanceExercise()
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSession({ routineId, routineName: routine.name, totalDuration: elapsed, overallSatisfaction: finalRating, exercises: results, endTime: new Date().toISOString() })
      router.push('/historial')
    } finally { setSaving(false) }
  }

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  if (authLoading || !routine) return <div className="session-page"><div className="session-loading">Cargando…</div></div>

  if (phase === PHASE.DONE) {
    const completed = results.filter(r=>!r.skipped).length
    const skipped   = results.filter(r=>r.skipped).length
    const avgSat    = results.filter(r=>r.satisfaction>0).reduce((a,r,_,arr)=>a+r.satisfaction/arr.length,0)
    return (
      <div className="session-done animate-in">
        <div className="done-card card">
          <div className="done-icon">🌅</div>
          <h1 className="done-title">¡Sesión completada!</h1>
          <p className="done-subtitle">{routine.name}</p>
          <div className="done-stats">
            <div className="done-stat"><span className="stat-value">{fmt(elapsed)}</span><span className="stat-label">Tiempo total</span></div>
            <div className="done-stat"><span className="stat-value">{completed}</span><span className="stat-label">Completados</span></div>
            <div className="done-stat"><span className="stat-value">{skipped}</span><span className="stat-label">Saltados</span></div>
            <div className="done-stat"><span className="stat-value">{avgSat>0?avgSat.toFixed(1):'—'}</span><span className="stat-label">Satisfacción prom.</span></div>
          </div>
          <div className="done-rating-section">
            <p className="done-rating-label">¿Cómo te sentiste con la rutina completa?</p>
            <StarRating value={finalRating} onChange={setFinalRating} size="lg" />
          </div>
          <div className="done-actions">
            <button className="btn btn-ghost" onClick={()=>router.push('/rutinas')}>Volver</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving||finalRating===0}>
              {saving?'Guardando...':'Guardar sesión'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === PHASE.RATE_EX) {
    return (
      <div className="session-page">
        <div className="rate-overlay animate-in">
          <div className="rate-card card">
            <p className="rate-label">¿Cómo fue</p>
            <h2 className="rate-ex-name">{currentEx.exerciseName}?</h2>
            <StarRating value={rating} onChange={setRating} size="lg" />
            <button className="btn btn-primary" onClick={submitRating} disabled={rating===0}>
              {isLastEx?'Finalizar sesión':'Siguiente ejercicio'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const totalSets = routine.exercises.reduce((a,e)=>a+e.sets,0)
  const progress  = ((exIdx * currentEx.sets + setIdx) / totalSets) * 100

  return (
    <div className="session-page">
      <div className="session-topbar">
        <button className="btn btn-ghost btn-sm" onClick={()=>{ if(confirm('¿Salir de la sesión?')) router.push('/rutinas') }}><CloseIcon /> Salir</button>
        <div className="session-timer">{fmt(elapsed)}</div>
        <div className="session-progress-text">{exIdx+1} / {routine.exercises.length}</div>
      </div>
      <div className="session-progress-bar"><div className="session-progress-fill" style={{width:`${progress}%`}} /></div>

      <div className="session-main">
        <div className="session-video-wrap">
          <video ref={videoRef} src={currentEx.videoUrl} className="session-video" muted playsInline autoPlay loop />
          {phase === PHASE.REST && (
            <div className="rest-overlay">
              <div className="rest-countdown">{restSecs}</div>
              <p className="rest-label">Descansando…</p>
              <button className="btn btn-sage btn-sm" onClick={()=>{ clearInterval(restRef.current); setPhase(PHASE.EXERCISE) }}>Saltar descanso</button>
            </div>
          )}
        </div>
        <div className="session-controls">
          <div className="session-ex-info">
            <h2 className="session-ex-name">{currentEx.exerciseName}</h2>
            <p className="session-ex-meta">{currentEx.reps} repeticiones · {currentEx.sets} series</p>
          </div>
          <div className="session-set-indicator">
            {Array.from({length:currentEx.sets}).map((_,i)=>(
              <div key={i} className={`set-dot ${i<setIdx?'done':i===setIdx?'current':''}`} />
            ))}
          </div>
          <div className="session-set-label">Serie <strong>{setIdx+1}</strong> de <strong>{currentEx.sets}</strong></div>
          <div className="session-actions">
            <button className="btn btn-ghost" onClick={skipExercise}><SkipIcon /> Saltar ejercicio</button>
            <button className="btn btn-primary session-main-btn" onClick={completeSet} disabled={phase===PHASE.REST}>
              {phase===PHASE.REST?`Descansando ${restSecs}s`:isLastSet?'✓ Terminar ejercicio':'✓ Serie completada'}
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

const CloseIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const SkipIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
const CheckMark = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
