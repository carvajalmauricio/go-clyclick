// Catálogo de estilos de botón compartido por el editor, el perfil y la
// validación al guardar. Agregar una opción aquí la habilita en todas partes.

export const BUTTON_SHAPES = [
  { value: 'square', label: 'Recto', radius: '8px' },
  { value: 'rounded', label: 'Redondeado', radius: '16px' },
  { value: 'pill', label: 'Píldora', radius: '999px' },
  { value: 'leaf', label: 'Hoja', radius: '22px 6px 22px 6px' },
  { value: 'bubble', label: 'Burbuja', radius: '22px 22px 22px 6px' },
]

export const BUTTON_VARIANTS = [
  { value: 'filled', label: 'Relleno' },
  { value: 'outline', label: 'Borde' },
  { value: 'glass', label: 'Cristal' },
  { value: 'gradient', label: 'Degradado' },
  { value: 'neon', label: 'Neón' },
]

export const BUTTON_SHADOWS = [
  { value: 'none', label: 'Sin sombra' },
  { value: 'soft', label: 'Suave' },
  { value: 'solid', label: 'Sólida' },
]

// Presentación de cada botón/enlace. Compartido por el editor, el perfil y la
// validación al guardar (actionSettings.layout y links[].layout).
export const BUTTON_LAYOUTS = [
  { value: 'classic', label: 'Clásico' },
  { value: 'featured', label: 'Destacado' },
  { value: 'grid', label: 'Cuadrícula 2 col' },
  { value: 'icon', label: 'Solo icono' },
]

export const DEFAULT_BUTTON_LAYOUT = 'classic'

export function normalizeLayout(value) {
  return BUTTON_LAYOUTS.some((option) => option.value === value) ? value : DEFAULT_BUTTON_LAYOUT
}

// 100% fills one of the two columns; smaller sizes preserve both columns.
export function normalizeGridScale(value) {
  const number = Number(value ?? 1)
  return Number.isFinite(number) ? Math.max(0.6, Math.min(1, number)) : 1
}

export function gridDimensions(value, fontSize = 14) {
  const scale = normalizeGridScale(value)
  return { scale, width: `${Math.round(scale * 100)}%`, icon: 40 * scale,
    fontSize: fontSize * scale, paddingX: 12 * scale, paddingY: 10 * scale }
}

// Radius may be a number, multiple pixel values (leaf), or a percentage.
export function scaleCssPixels(value, scale) {
  if (typeof value === 'number') return value * scale
  return String(value).replace(/(-?[\d.]+)px/g, (_, size) => `${Number(size) * scale}px`)
}

export const DEFAULT_BUTTON_STYLE = { shape: 'rounded', variant: 'filled', shadow: 'soft' }

const pick = (options, value, fallback) => (options.some((option) => option.value === value) ? value : fallback)

export function normalizeButtonStyle(value) {
  if (!value || typeof value !== 'object') return { ...DEFAULT_BUTTON_STYLE }
  return {
    shape: pick(BUTTON_SHAPES, value.shape, DEFAULT_BUTTON_STYLE.shape),
    variant: pick(BUTTON_VARIANTS, value.variant, DEFAULT_BUTTON_STYLE.variant),
    shadow: pick(BUTTON_SHADOWS, value.shadow, DEFAULT_BUTTON_STYLE.shadow),
  }
}

// Radios equivalentes para tarjetas altas (Destacado / Cuadrícula). Un radio de
// 999px en una tarjeta de 200px de alto la convierte en un óvalo y recorta la
// imagen y el título; estas versiones conservan el carácter de cada forma.
const CARD_RADIUS = {
  square: '8px',
  rounded: '16px',
  pill: '28px',
  leaf: '28px 8px 28px 8px',
  bubble: '24px 24px 24px 8px',
}

export function buttonRadius(shape, layout = 'classic') {
  const option = BUTTON_SHAPES.find((item) => item.value === shape) || BUTTON_SHAPES[1]
  if (layout === 'featured' || layout === 'grid') return CARD_RADIUS[option.value]
  // Solo icono: la píldora se muestra como círculo perfecto.
  if (layout === 'icon' && option.value === 'pill') return '50%'
  return option.radius
}

export function buttonBorderWidth(variant) {
  return variant === 'outline' || variant === 'neon' ? 2 : 1
}

// Sombra final del botón. El acabado neón siempre añade su resplandor.
export function buttonShadow(style = {}, theme, borderColor) {
  const base = style.shadow === 'solid'
    ? `5px 5px 0 ${theme.border}`
    : style.shadow === 'none'
      ? ''
      : '0 8px 24px rgba(0,0,0,.14)'
  if (style.variant === 'neon') {
    const glow = `0 0 14px color-mix(in srgb, ${borderColor} 70%, transparent), inset 0 0 10px color-mix(in srgb, ${borderColor} 35%, transparent)`
    return base ? `${glow}, ${base}` : glow
  }
  return base || 'none'
}
