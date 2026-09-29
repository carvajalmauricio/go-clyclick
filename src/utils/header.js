// Opciones de la cabecera del perfil (portada, forma y tamaño del logo y
// alineación). Compartido por el editor, el perfil y la validación al guardar.

export const LOGO_SHAPES = [
  { value: 'circle', label: 'Círculo' },
  { value: 'rounded', label: 'Redondeado' },
  { value: 'square', label: 'Cuadrado' },
]

export const LOGO_SIZES = [
  { value: 'sm', label: 'Pequeño', px: 80 },
  { value: 'md', label: 'Mediano', px: 104 },
  { value: 'lg', label: 'Grande', px: 132 },
]

export const HEADER_ALIGNS = [
  { value: 'center', label: 'Centrado' },
  { value: 'left', label: 'Izquierda' },
]

export const DEFAULT_HEADER = { cover: '', logoShape: 'circle', logoSize: 'md', align: 'center' }

const pick = (options, value, fallback) => (options.some((option) => option.value === value) ? value : fallback)

// Solo se aceptan imágenes propias (/api/assets/...) o URLs http(s).
export function safeImageUrl(value) {
  const url = String(value || '').trim().slice(0, 2048)
  if (!url) return ''
  if (/^\/api\/assets\/[\w\-./]+$/.test(url) && !url.includes('..')) return url
  return /^https?:\/\/[^\s"'<>]+$/i.test(url) ? url : ''
}

export function normalizeHeader(value) {
  const input = value && typeof value === 'object' ? value : {}
  return {
    cover: safeImageUrl(input.cover),
    logoShape: pick(LOGO_SHAPES, input.logoShape, DEFAULT_HEADER.logoShape),
    logoSize: pick(LOGO_SIZES, input.logoSize, DEFAULT_HEADER.logoSize),
    align: pick(HEADER_ALIGNS, input.align, DEFAULT_HEADER.align),
  }
}

// Tamaño del logo en px (el modo compacto lo reduce un 20 %).
export function logoPixels(size, compact = false) {
  const px = (LOGO_SIZES.find((option) => option.value === size) || LOGO_SIZES[1]).px
  return compact ? Math.round(px * 0.8) : px
}

export function logoRadius(shape, px) {
  if (shape === 'square') return Math.round(px * 0.1)
  if (shape === 'rounded') return Math.round(px * 0.26)
  return '50%'
}
