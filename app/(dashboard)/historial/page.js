'use client'

import { useState } from 'react'
import { useSessions } from '@/hooks/useSessions'

export default function HistorialPage() {
  const { sessions, loading } = useSessions()
  const [selected, setSelected] = useState(null)

  const fmt = (s) => { if (!s) return '—'; const m = Math.floor(s/60).toString().padStart(2,'0'); const sec = (s%60).toString().padStart(2,'0'); return `${m}:${sec}` }
  const fmtDate = (ts) => { if (!ts) return '—'; const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }
  const fmtTime = (ts) => { if (!ts) return ''; const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }

  const totalSessions = sessions.length
  const totalTime     = sessions.reduce((a,s) => a + (s.totalDuration||0), 0)
  const avgSat        = sessions.filter(s=>s.overallSatisfaction>0).reduce((a,s,_,arr)=>a+s.overallSatisfaction/arr.length,0)
  const totalSkipped  = sessions.reduce((a,s)=>a+(s.exercises?.filter(e=>e.skipped).length||0),0)

  if (loading) return (
    <div className="animate-in">
      <div className="page-header"><h1 className="page-title">Historial</h1></div>
      <div className="loading-grid">{[1,2,3].map(i=><div key={i} className="skeleton-card" style={{height:100}}/>)}</div>
    </div>
  )

  return (
    <div className="animate-in">
      <div className="page-header"><h1 className="page-title">Historial</h1></div>

      {sessions.length > 0 && (
        <div className="history-stats-grid">
          <div className="history-stat card"><span className="hstat-value">{totalSessions}</span><span className="hstat-label">Sesiones</span></div>
          <div className="history-stat card"><span className="hstat-value">{fmt(totalTime)}</span><span className="hstat-label">Tiempo total</span></div>
          <div className="history-stat card"><span className="hstat-value">{avgSat>0?avgSat.toFixed(1):'—'}</span><span className="hstat-label">Satisfacción prom.</span></div>
          <div className="history-stat card"><span className="hstat-value">{totalSkipped}</span><span className="hstat-label">Ejercicios saltados</span></div>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="empty-state"><ChartIcon size={48} /><p>Aún no has completado ninguna sesión.<br />¡Comienza desde Rutinas!</p></div>
      ) : (
        <div className="history-list">
          {sessions.map(s => (
            <div key={s.id} className="history-card card" onClick={()=>setSelected(s)}>
              <div className="history-card-main">
                <div className="history-card-info">
                  <h3 className="history-card-name">{s.routineName}</h3>
                  <p className="history-card-date">{fmtDate(s.startTime)} · {fmtTime(s.startTime)}</p>
                </div>
                <div className="history-card-stats">
                  <div className="hcard-stat"><span className="hcard-val">{fmt(s.totalDuration)}</span><span className="hcard-lbl">Duración</span></div>
                  <div className="hcard-stat"><span className="hcard-val">{s.exercises?.filter(e=>!e.skipped).length||0}</span><span className="hcard-lbl">Completados</span></div>
                  <div className="hcard-stat"><span className="hcard-val">{s.exercises?.filter(e=>e.skipped).length||0}</span><span className="hcard-lbl">Saltados</span></div>
                  <div className="hcard-stat"><Stars value={s.overallSatisfaction}/><span className="hcard-lbl">Satisfacción</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{selected.routineName}</h2>
              <button className="btn-icon" onClick={()=>setSelected(null)}><CloseIcon /></button>
            </div>
            <div className="session-detail-meta">
              <span>{fmtDate(selected.startTime)}</span><span>·</span>
              <span>{fmt(selected.totalDuration)} de duración</span><span>·</span>
              <Stars value={selected.overallSatisfaction}/>
            </div>
            <div className="session-detail-exercises">
              {selected.exercises?.map((ex,i)=>(
                <div key={i} className={`detail-ex-row ${ex.skipped?'skipped':''}`}>
                  <div className="detail-ex-left">
                    <span className="detail-num">{i+1}</span>
                    <div className="detail-ex-info">
                      <span className="detail-ex-name">{ex.exerciseName}</span>
                      <span className="detail-ex-sets">{ex.skipped?`Saltado (${ex.completedSets}/${ex.plannedSets} series)`:`${ex.completedSets}/${ex.plannedSets} series completadas`}</span>
                    </div>
                  </div>
                  <div className="detail-ex-right">
                    {ex.skipped ? <span className="badge badge-danger">Saltado</span> : <Stars value={ex.satisfaction}/>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stars({ value }) {
  return (
    <div className="mini-stars">
      {[1,2,3,4,5].map(s=>(
        <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s<=value?'#d4a84b':'none'} stroke={s<=value?'#d4a84b':'#5e5349'} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

const CloseIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const ChartIcon = ({ size=24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
