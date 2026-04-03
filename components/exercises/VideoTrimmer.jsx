'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

export default function VideoTrimmer({ videoUrl, duration, trimStart, trimEnd, onChange }) {
  const videoRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(trimStart || 0)
  const [dragging, setDragging] = useState(null)
  const railRef = useRef(null)

  const start = trimStart ?? 0
  const end   = trimEnd   ?? duration ?? 0

  const toPercent  = (t) => duration ? (t / duration) * 100 : 0
  const fromPct    = useCallback((pct) => Math.max(0, Math.min(duration, (pct / 100) * duration)), [duration])
  const getPct     = useCallback((clientX) => {
    const rail = railRef.current; if (!rail) return 0
    const { left, width } = rail.getBoundingClientRect()
    return Math.max(0, Math.min(100, ((clientX - left) / width) * 100))
  }, [])

  useEffect(() => {
    const vid = videoRef.current; if (!vid) return
    if (Math.abs(vid.currentTime - currentTime) > 0.3) vid.currentTime = currentTime
  }, [currentTime])

  useEffect(() => {
    const vid = videoRef.current; if (!vid) return
    const handle = () => { if (vid.currentTime >= end) vid.currentTime = start; setCurrentTime(vid.currentTime) }
    vid.addEventListener('timeupdate', handle)
    return () => vid.removeEventListener('timeupdate', handle)
  }, [start, end])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const t = fromPct(getPct(clientX))
      if (dragging === 'start') { const ns = Math.min(t, end - 1); onChange({ trimStart: ns, trimEnd: end }); setCurrentTime(ns) }
      else                      { const ne = Math.max(t, start + 1); onChange({ trimStart: start, trimEnd: ne }); setCurrentTime(ne) }
    }
    const onUp = () => setDragging(null)
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove); window.addEventListener('touchend', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp) }
  }, [dragging, start, end, onChange, getPct, fromPct])

  const fmt = (t) => `${Math.floor(t/60)}:${Math.floor(t%60).toString().padStart(2,'0')}`

  return (
    <div className="video-trimmer">
      <div className="trimmer-preview">
        <video ref={videoRef} src={videoUrl} className="trimmer-video" autoPlay muted playsInline loop />
        <div className="trimmer-time-badge">{fmt(currentTime)}</div>
      </div>
      <div className="trimmer-controls">
        <div className="trimmer-info">
          <span className="trimmer-range-label">Inicio: <strong>{fmt(start)}</strong></span>
          <span className="trimmer-range-label">Fin: <strong>{fmt(end)}</strong></span>
          <span className="trimmer-range-label trimmer-duration">Duración: <strong>{fmt(end - start)}</strong></span>
        </div>
        <div className="trimmer-rail" ref={railRef}>
          <div className="rail-bg" />
          <div className="rail-selected" style={{ left: `${toPercent(start)}%`, width: `${toPercent(end) - toPercent(start)}%` }} />
          <div className="rail-playhead" style={{ left: `${toPercent(currentTime)}%` }} />
          <div className="rail-handle" style={{ left: `${toPercent(start)}%` }} onMouseDown={() => setDragging('start')} onTouchStart={() => setDragging('start')}>
            <div className="handle-grip" />
          </div>
          <div className="rail-handle" style={{ left: `${toPercent(end)}%` }} onMouseDown={() => setDragging('end')} onTouchStart={() => setDragging('end')}>
            <div className="handle-grip" />
          </div>
        </div>
        <p className="trimmer-hint">Arrastra los marcadores para definir el fragmento del ejercicio</p>
      </div>
    </div>
  )
}
