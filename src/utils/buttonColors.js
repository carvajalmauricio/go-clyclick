import { cardTextColor } from './themes.js'

export function normalizeButtonColors(colors) {
  const result = {}
  for (const key of ['background', 'text', 'border']) {
    const value = String(colors?.[key] || '').trim()
    if (/^#[0-9a-f]{6}$/i.test(value)) result[key] = value
  }
  return result
}

// Colores finales de un botón según el acabado elegido. Los colores
// personalizados del botón siempre tienen prioridad sobre los del tema.
export function getButtonColors(action, theme, style = {}) {
  const custom = normalizeButtonColors(action.colors)
  const base = action.primary ? theme.accent : theme.card
  const baseText = action.primary ? theme.accentText : cardTextColor(theme)

  switch (style.variant) {
    case 'outline':
      return {
        background: custom.background || 'transparent',
        text: custom.text || theme.text,
        border: custom.border || theme.text,
      }
    case 'glass':
      // El cristal se tiñe con el color base del botón (acento en el
      // principal), para que su texto (accentText o cardText) siempre contraste.
      return {
        background: custom.background || `color-mix(in srgb, ${base} ${action.primary ? 82 : 73}%, transparent)`,
        text: custom.text || baseText,
        border: custom.border || theme.border,
      }
    case 'gradient': {
      // El degradado parte del color del botón y termina mezclado con el acento
      // (o con el fondo del tema en el botón principal) para dar profundidad.
      const from = custom.background || base
      const blend = action.primary ? theme.bg : theme.accent
      return {
        background: `linear-gradient(135deg, ${from} 0%, color-mix(in srgb, ${from} 62%, ${blend}) 100%)`,
        text: custom.text || baseText,
        border: custom.border || `color-mix(in srgb, ${from} 70%, #ffffff)`,
      }
    }
    case 'neon':
      return {
        background: custom.background || `color-mix(in srgb, ${theme.bg} 55%, transparent)`,
        text: custom.text || theme.text,
        border: custom.border || theme.accent,
      }
    default:
      return {
        background: custom.background || base,
        text: custom.text || baseText,
        border: custom.border || theme.border,
      }
  }
}
