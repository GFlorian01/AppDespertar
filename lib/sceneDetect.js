/**
 * Detect scene changes in a video using frame-by-frame pixel comparison.
 * No dependencies — uses Canvas API and HTML5 video element.
 */

export async function detectScenes(videoUrl, options = {}) {
  const {
    sampleInterval = 0.5,     // seconds between samples
    threshold      = 0.18,    // luminance diff threshold (0–1)
    minDuration    = 2.0,     // minimum scene duration in seconds
    onProgress,
  } = options

  return new Promise((resolve, reject) => {
    const video  = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx    = canvas.getContext('2d', { willReadFrequently: true })

    video.crossOrigin = 'anonymous'
    video.muted       = true
    video.preload     = 'auto'
    video.playsInline = true
    video.src         = videoUrl

    video.onerror = () => reject(new Error('Error al cargar video para análisis'))

    video.onloadedmetadata = async () => {
      const { duration, videoWidth, videoHeight } = video

      // Small canvas for performance
      const scale  = Math.min(1, 160 / videoWidth)
      canvas.width  = Math.round(videoWidth  * scale)
      canvas.height = Math.round(videoHeight * scale)

      const scenes     = []
      let prevData     = null
      let sceneStart   = 0
      const totalSteps = Math.ceil(duration / sampleInterval)

      for (let i = 0; i <= totalSteps; i++) {
        const time = Math.min(i * sampleInterval, duration)

        try { await seekTo(video, time) } catch { continue }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

        if (prevData) {
          const diff = frameDiff(prevData, data)

          if (diff > threshold && (time - sceneStart) >= minDuration) {
            scenes.push({ start: sceneStart, end: time })
            sceneStart = time
          }
        }

        prevData = new Uint8ClampedArray(data)
        if (onProgress) onProgress(Math.round((i / totalSteps) * 100))
      }

      // Final scene
      if (duration - sceneStart >= minDuration) {
        scenes.push({ start: sceneStart, end: duration })
      }

      // If no cuts detected, return the whole video as one scene
      if (scenes.length === 0) {
        scenes.push({ start: 0, end: duration })
      }

      resolve(scenes)
    }
  })
}

function seekTo(video, time) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('seek timeout')), 3000)
    const handler = () => { clearTimeout(timeout); resolve() }
    video.onseeked = handler
    video.currentTime = time
  })
}

function frameDiff(prev, curr) {
  let sum = 0
  const pixels = prev.length / 4
  for (let i = 0; i < prev.length; i += 4) {
    const lP = prev[i] * 0.299 + prev[i + 1] * 0.587 + prev[i + 2] * 0.114
    const lC = curr[i] * 0.299 + curr[i + 1] * 0.587 + curr[i + 2] * 0.114
    sum += Math.abs(lP - lC) / 255
  }
  return sum / pixels
}
