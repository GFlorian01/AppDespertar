'use client'

import { useRef, useEffect } from 'react'

export default function TrimmedVideo({ src, trimStart = 0, trimEnd = 0, className }) {
  const ref = useRef(null)
  const start = trimStart || 0
  const end   = trimEnd   || 0
  useEffect(() => {
    const vid = ref.current; if (!vid) return
    vid.currentTime = start
    vid.play().catch(() => {})
    const onTime = () => { if (end > start && vid.currentTime >= end) vid.currentTime = start }
    vid.addEventListener('timeupdate', onTime)
    return () => vid.removeEventListener('timeupdate', onTime)
  }, [src, start, end])
  return <video ref={ref} src={src} className={className} muted playsInline preload="auto" />
}
