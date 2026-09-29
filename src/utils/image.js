// Recorte y compresión de imágenes en el navegador antes de subirlas (#11).
// La matemática del recorte es pura (sin DOM); el dibujo usa canvas.

// Formatos de salida por uso. `width` es el ancho final en px.
export const CROP_PRESETS = {
  logo: { title: 'Recortar logo', aspect: 1, width: 512, shape: 'circle', kind: 'logo' },
  cover: { title: 'Recortar portada', aspect: 3, width: 1500, shape: 'rect', kind: 'cover' },
  thumbSquare: { title: 'Recortar miniatura', aspect: 1, width: 800, shape: 'rect', kind: 'thumbnail' },
  thumbWide: { title: 'Recortar miniatura (16:9)', aspect: 16 / 9, width: 1280, shape: 'rect', kind: 'thumbnail' },
  slide: { title: 'Recortar imagen del slide', aspect: 1, width: 640, shape: 'circle', kind: 'slide' },
}

// Tipos que se pueden recortar. GIF (animado) y SVG (vectorial) se suben tal cual.
export function canProcess(file) {
  return ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file?.type)
}

// Escala mínima para que la imagen cubra por completo el área de recorte.
export function coverScale(natural, view) {
  return Math.max(view.width / natural.width, view.height / natural.height)
}

// Mantiene la imagen cubriendo el área: el desplazamiento (esquina superior
// izquierda de la imagen respecto al área) nunca deja huecos.
export function clampOffset(offset, natural, view, scale) {
  const width = natural.width * scale
  const height = natural.height * scale
  return {
    x: Math.min(0, Math.max(view.width - width, offset.x)),
    y: Math.min(0, Math.max(view.height - height, offset.y)),
  }
}

// Desplazamiento que centra la imagen en el área.
export function centeredOffset(natural, view, scale) {
  return { x: (view.width - natural.width * scale) / 2, y: (view.height - natural.height * scale) / 2 }
}

// Cambia el zoom conservando fijo el punto central del área.
export function zoomAround(offset, natural, view, fromScale, toScale) {
  const cx = (view.width / 2 - offset.x) / fromScale
  const cy = (view.height / 2 - offset.y) / fromScale
  return clampOffset({ x: view.width / 2 - cx * toScale, y: view.height / 2 - cy * toScale }, natural, view, toScale)
}

// Rectángulo de la imagen original (en px reales) que corresponde al área.
export function sourceRect(offset, view, scale) {
  return { x: -offset.x / scale, y: -offset.y / scale, width: view.width / scale, height: view.height / scale }
}

// Tamaño final: nunca se agranda por encima de la resolución disponible.
export function outputSize(rect, preset) {
  const width = Math.max(1, Math.round(Math.min(preset.width, rect.width)))
  return { width, height: Math.max(1, Math.round(width / preset.aspect)) }
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    img.src = src
  })
}

// Codifica el canvas en WebP; si el navegador no lo soporta, usa PNG para
// imágenes con transparencia y JPEG para fotos.
async function encode(canvas, sourceType) {
  const toBlob = (type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality))
  const webp = await toBlob('image/webp', 0.86)
  if (webp && webp.type === 'image/webp') return webp
  return sourceType === 'image/jpeg' || sourceType === 'image/jpg' ? toBlob('image/jpeg', 0.86) : toBlob('image/png')
}

function toFile(blob, originalName) {
  const ext = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }[blob.type] || 'img'
  const base = String(originalName || 'imagen').replace(/\.[^.]+$/, '')
  return new File([blob], `${base}.${ext}`, { type: blob.type })
}

// Dibuja el recorte y lo devuelve como File listo para subir.
export async function cropToFile(img, rect, preset, file) {
  const size = outputSize(rect, preset)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, size.width, size.height)
  return toFile(await encode(canvas, file.type), file.name)
}

// Solo compresión (sin recorte), p. ej. para imágenes de fondo.
export async function compressImage(file, maxDimension = 2000) {
  if (!canProcess(file)) return file
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const ratio = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * ratio)
    canvas.height = Math.round(img.naturalHeight * ratio)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    const compressed = toFile(await encode(canvas, file.type), file.name)
    // Si no se gana nada, se conserva el original.
    return compressed.size < file.size ? compressed : file
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
