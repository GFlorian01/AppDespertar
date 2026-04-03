'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

export default function VideoTrimmer({ videoUrl, duration, trimStart, trimEnd, onChange }) {
  const videoRef  = useRef(null)
  const railRef   = useRef(null)
  const [currentTime, setCurrentTime] = useState(trimStart || 0)
  const [dragging,    setDragging]    = useState(null)
  const [playing,     setPlaying]     = useState(true)

  const start = trimStart ?? 0
  const end   = trimEnd   ?? duration ?? 0

  const toPercent = (t) => duration ? (t / duration) * 100 : 0
  const fromPct   = useCallback((pct) => Math.max(0, Math.min(duration, (pct / 100) * duration)), [duration])
  const getPct    = useCallback((clientX) => {
    const rail = railRef.current; if (!rail) return 0
    const { left, width } = rail.getBoundingClientRect()
    return Math.max(0, Math.min(100, ((clientX - left) / width) * 100))
  }, [])

  // Sync seek
  useEffect(() => {
    const vid = videoRef.current; if (!vid) return
    if (Math.abs(vid.currentTime - currentTime) > 0.5) vid.currentTime = currentTime
  }, [currentTime])

  // Loop within trim range
  useEffect(() => {
    const vid = videoRef.current; if (!vid) return
    const handle = () => {
      if (vid.currentTime >= end || vid.currentTime < start - 0.1) {
        vid.currentTime = start
      }
      setCurrentTime(vid.currentTime)
    }
    vid.addEventListener('timeupdate', handle)
    return () => vid.removeEventListener('timeupdate', handle)
  }, [start, end])

  // Drag logic
  useEffect(() => {
    if (!dragging) return
    const vid = videoRef.current
    if (vid) { vid.pause(); setPlaying(false) }

    const onMove = (e) => {
      e.preventDefault()
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const t = fromPct(getPct(clientX))
      if (dragging === 'start') {
        const ns = Math.min(t, end - 0.5)
        onChange({ trimStart: ns, trimEnd: end })
        setCurrentTime(ns)
        if (vid) vid.currentTime = ns
      } else {
        const ne = Math.max(t, start + 0.5)
        onChange({ trimStart: start, trimEnd: ne })
        setCurrentTime(ne)
        if (vid) vid.currentTime = ne
      }
    }
    const onUp = () => setDragging(null)

    window.addEventListener('mousemove',  onMove, { passive: false })
    window.addEventListener('mouseup',    onUp)
    window.addEventListener('touchmove',  onMove, { passive: false })
    window.addEventListener('touchend',   onUp)
    return () => {
      window.removeEventListener('mousemove',  onMove)
      window.removeEventListener('mouseup',    onUp)
      window.removeEventListener('touchmove',  onMove)
      window.removeEventListener('touchend',   onUp)
    }
  }, [dragging, start, end, onChange, getPct, fromPct])

  const togglePlay = () => {
    const vid = videoRef.current; if (!vid) return
    if (vid.paused) { vid.currentTime = start; vid.play(); setPlaying(true) }
    else            { vid.pause(); setPlaying(false) }
  }

  const fmt = (t) => `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`

  const startPct   = toPercent(start)
  const endPct     = toPercent(end)
  const currentPct = toPercent(currentTime)

  return (
    <div className="vt-root">

      {/* ── Video preview ── */}
      <div className="vt-preview">
        <video
          ref={videoRef}
          src={videoUrl}
          className="vt-video"
          autoPlay muted playsInline
        />

        {/* Overlay: time + play button */}
        <div className="vt-overlay">
          <button className="vt-play-btn" onClick={togglePlay}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <div className="vt-time-chip">{fmt(currentTime)}</div>
        </div>

        {/* Start / End labels on video */}
        <div className="vt-marker-label vt-marker-start">▶ {fmt(start)}</div>
        <div className="vt-marker-label vt-marker-end">{fmt(end)} ◀</div>
      </div>

      {/* ── Info row ── */}
      <div className="vt-info-row">
        <div className="vt-info-chip">
          <span className="vt-info-lbl">Inicio</span>
          <span className="vt-info-val">{fmt(start)}</span>
        </div>
        <div className="vt-info-chip vt-info-dur">
          <span className="vt-info-lbl">Duración</span>
          <span className="vt-info-val">{fmt(end - start)}</span>
        </div>
        <div className="vt-info-chip">
          <span className="vt-info-lbl">Fin</span>
          <span className="vt-info-val">{fmt(end)}</span>
        </div>
      </div>

      {/* ── Rail ── */}
      <div className="vt-rail-wrap" ref={railRef}>
        {/* Track */}
        <div className="vt-track-bg" />
        <div className="vt-track-sel" style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }} />

        {/* Playhead */}
        <div className="vt-playhead" style={{ left: `${currentPct}%` }} />

        {/* Start handle */}
        <div
          className="vt-handle vt-handle-start"
          style={{ left: `${startPct}%` }}
          onMouseDown={(e) => { e.preventDefault(); setDragging('start') }}
          onTouchStart={(e) => { e.preventDefault(); setDragging('start') }}
        >
          <div className="vt-handle-bar" />
          <div className="vt-handle-label">{fmt(start)}</div>
        </div>

        {/* End handle */}
        <div
          className="vt-handle vt-handle-end"
          style={{ left: `${endPct}%` }}
          onMouseDown={(e) => { e.preventDefault(); setDragging('end') }}
          onTouchStart={(e) => { e.preventDefault(); setDragging('end') }}
        >
          <div className="vt-handle-bar" />
          <div className="vt-handle-label">{fmt(end)}</div>
        </div>
      </div>

      <p className="vt-hint">Arrastra los marcadores naranjas para recortar el fragmento</p>
    </div>
  )
}

const PlayIcon  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const PauseIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
