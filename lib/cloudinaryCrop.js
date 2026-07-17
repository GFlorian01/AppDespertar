const RATIOS = { '1:1': 1, '9:16': 9 / 16, '16:9': 16 / 9 }

// ponytail: crop is done by Cloudinary on delivery (c_crop + g_xy_center), no client-side video re-encoding
export function cropUrl(url, cropAspect, cropX = 0.5, cropY = 0.5) {
  const ratio = RATIOS[cropAspect]
  if (!url || !ratio) return url
  const t = `c_crop,ar_${ratio},g_xy_center,x_${cropX.toFixed(4)},y_${cropY.toFixed(4)},fl_relative`
  return url.replace('/upload/', `/upload/${t}/`)
}
