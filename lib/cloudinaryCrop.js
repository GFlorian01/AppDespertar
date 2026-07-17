// ponytail: crop is applied client-side via CSS instead of a Cloudinary video
// transform. Cloudinary re-encodes video on-the-fly per unique transform URL,
// which is slow/unreliable for a crop nobody has requested yet — that's what
// showed up as thumbnails stuck black after cutting exercises with a crop.
// This works in frame-fraction space (0-1), so it needs no knowledge of the
// video's native pixel size: stretch the whole frame into an oversized,
// shifted box so only the cropped rectangle lands inside the container.
export function cropStyle(cropAspect, cropX = 0, cropY = 0, cropW = 1, cropH = 1) {
  if (!cropAspect || cropAspect === 'original') return undefined
  return {
    position: 'absolute', inset: 0,
    width: `${100 / cropW}%`, height: `${100 / cropH}%`,
    left: `${-(cropX / cropW) * 100}%`, top: `${-(cropY / cropH) * 100}%`,
    objectFit: 'fill',
  }
}
