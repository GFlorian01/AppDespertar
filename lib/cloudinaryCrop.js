// ponytail: crop is done by Cloudinary on delivery (c_crop + fl_relative), no client-side video re-encoding
export function cropUrl(url, cropAspect, cropX = 0, cropY = 0, cropW = 1, cropH = 1) {
  if (!url || !cropAspect || cropAspect === 'original') return url
  const t = `c_crop,x_${cropX.toFixed(4)},y_${cropY.toFixed(4)},w_${cropW.toFixed(4)},h_${cropH.toFixed(4)},fl_relative`
  return url.replace('/upload/', `/upload/${t}/`)
}
