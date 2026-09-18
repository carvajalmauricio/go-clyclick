// Temas prediseñados para los perfiles públicos.
// Cada tema define colores usados por PublicProfile y el simulador móvil.

export const THEMES = {
  vibrant: {
    id: 'vibrant',
    name: 'ClickClick Vibrant',
    bg: '#0f0f12',
    bgGradient: 'linear-gradient(160deg, #1a1a20 0%, #0f0f12 100%)',
    text: '#ffffff',
    subtext: '#a1a1aa',
    accent: '#F49120',
    accentText: '#0f0f12',
    card: '#1c1c22',
    border: '#2a2a32',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal Clean',
    bg: '#f7f7f8',
    bgGradient: 'linear-gradient(160deg, #ffffff 0%, #f0f0f2 100%)',
    text: '#18181b',
    subtext: '#71717a',
    accent: '#2563eb',
    accentText: '#ffffff',
    card: '#ffffff',
    border: '#e4e4e7',
  },
  luxury: {
    id: 'luxury',
    name: 'Midnight Luxury',
    bg: '#0a0a0a',
    bgGradient: 'linear-gradient(160deg, #14110b 0%, #0a0a0a 100%)',
    text: '#f5f0e6',
    subtext: '#9c8f78',
    accent: '#d4af37',
    accentText: '#0a0a0a',
    card: '#16130d',
    border: '#2b2416',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Garden',
    bg: '#07130f',
    bgGradient: 'linear-gradient(160deg, #0d241c 0%, #07130f 100%)',
    text: '#eafaf1',
    subtext: '#9dc9b4',
    accent: '#10b981',
    accentText: '#052e22',
    card: '#0e1f19',
    border: '#1c3b30',
  },
}

export const THEME_LIST = Object.values(THEMES)

// Devuelve un tema por id, con soporte para tema personalizado.
// Si theme === 'custom', usa customColors para el fondo y el acento, y calcula
// automáticamente colores legibles (texto, tarjetas, bordes) según si el fondo
// es claro u oscuro, para que el nombre y los textos siempre se vean.
export function resolveTheme(themeId, customColors) {
  if (themeId === 'custom' && customColors) {
    const bg = customColors.bg || '#0f0f12'
    const accent = customColors.accent || '#F49120'
    const light = isLightColor(bg)

    // Si el usuario fijó un texto explícito, se respeta; si no, se autocalcula.
    const text = customColors.text || (light ? '#18181b' : '#ffffff')
    const subtext = light ? '#52525b' : '#a1a1aa'
    const card = light ? '#ffffff' : '#1c1c22'
    const border = light ? '#e4e4e7' : '#2a2a32'
    const accentText = isLightColor(accent) ? '#0f0f12' : '#ffffff'

    return {
      id: 'custom',
      name: 'Personalizado',
      bg,
      bgGradient: customColors.bgGradient || bg,
      text,
      subtext,
      accent,
      accentText,
      card,
      border,
    }
  }
  return THEMES[themeId] || THEMES.vibrant
}

// Determina si un color hex es "claro" (para elegir texto oscuro sobre él).
// Usa luminancia percibida. Devuelve true si es claro.
export function isLightColor(hex) {
  const c = String(hex || '').replace('#', '')
  if (c.length !== 3 && c.length !== 6) return false
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  // Luminancia percibida (ITU-R BT.601)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6
}
