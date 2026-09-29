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
  sunset: {
    id: 'sunset',
    name: 'Sunset Glow',
    bg: '#f97316',
    bgGradient: 'linear-gradient(180deg, #67e8f9 0%, #f9a8d4 48%, #f97316 100%)',
    text: '#3b1722',
    subtext: '#71364a',
    accent: '#ffffff',
    accentText: '#7c2d12',
    card: 'rgba(255,255,255,.88)',
    border: 'rgba(255,255,255,.65)',
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blue Shapes',
    bg: '#284b83',
    bgGradient: 'linear-gradient(145deg, #213d6b 0%, #5273ad 100%)',
    pattern: 'shapes',
    text: '#ffffff',
    subtext: '#dbeafe',
    accent: '#f8fafc',
    accentText: '#1e3a5f',
    card: 'rgba(239,246,255,.9)',
    // Texto sobre las tarjetas claras (el texto general es blanco).
    cardText: '#1e3a5f',
    border: 'rgba(255,255,255,.45)',
  },
  grid: {
    id: 'grid',
    name: 'Editorial Grid',
    bg: '#3f2027',
    bgGradient: 'linear-gradient(180deg, #522b34 0%, #2a151a 100%)',
    pattern: 'grid',
    text: '#fff7ed',
    subtext: '#e8c9bf',
    accent: '#fff1dc',
    accentText: '#3f2027',
    card: 'rgba(255,241,220,.92)',
    cardText: '#3f2027',
    border: 'rgba(255,255,255,.35)',
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    bg: '#26051f',
    bgGradient: 'linear-gradient(165deg, #780b46 0%, #a21caf 42%, #f0abfc 100%)',
    pattern: 'glow',
    text: '#ffffff',
    subtext: '#fae8ff',
    accent: '#ffffff',
    accentText: '#701a75',
    card: 'rgba(255,255,255,.12)',
    border: 'rgba(255,255,255,.5)',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Waves',
    bg: '#0c4a6e',
    bgGradient: 'linear-gradient(170deg, #0e7490 0%, #0c4a6e 55%, #082f49 100%)',
    pattern: 'waves',
    text: '#f0f9ff',
    subtext: '#bae6fd',
    accent: '#5eead4',
    accentText: '#083344',
    card: 'rgba(8,47,73,.72)',
    border: 'rgba(186,230,253,.35)',
  },
  geopop: {
    id: 'geopop',
    name: 'Geo Pop',
    bg: '#fff7ed',
    bgGradient: 'linear-gradient(160deg, #fffbeb 0%, #ffedd5 100%)',
    pattern: 'geo',
    text: '#111827',
    // Subtexto más oscuro (#44403c) para cumplir ~WCAG AA sobre el fondo claro.
    subtext: '#44403c',
    accent: '#6d28d9',
    accentText: '#ffffff',
    card: '#ffffff',
    border: '#e7e5e4',
  },
  // --- Recreaciones de temas populares de Linktree ---------------------------
  // Confetti: confeti pastel cayendo y botones semiopacos que dejan ver el efecto.
  confetti: {
    id: 'confetti',
    name: 'Confetti',
    bg: '#fdf2f8',
    bgGradient: 'linear-gradient(170deg, #fff1f2 0%, #f5f3ff 52%, #ecfeff 100%)',
    pattern: 'confetti',
    text: '#1f2937',
    subtext: '#4b5563',
    accent: '#db2777',
    accentText: '#ffffff',
    card: 'rgba(255,255,255,.72)',
    border: 'rgba(219,39,119,.22)',
  },
  // Rainbow: degradado arcoíris que cambia de tono y botones blancos sólidos.
  rainbow: {
    id: 'rainbow',
    name: 'Rainbow',
    bg: '#e4c1f9',
    bgGradient: 'linear-gradient(135deg, #ffd1dc 0%, #ffe7a3 25%, #c8f7c5 50%, #bde0fe 75%, #e4c1f9 100%)',
    pattern: 'rainbow',
    text: '#1e1b2e',
    subtext: '#3f3a56',
    accent: '#1e1b2e',
    accentText: '#ffffff',
    card: '#ffffff',
    border: 'rgba(255,255,255,.95)',
  },
  // Starry Night: cielo nocturno con partículas que suben y titilan.
  starry: {
    id: 'starry',
    name: 'Starry Night',
    bg: '#0b0a24',
    bgGradient: 'linear-gradient(180deg, #0b0a24 0%, #1e1b4b 62%, #3b0764 100%)',
    pattern: 'stars',
    text: '#f5f3ff',
    subtext: '#c4b5fd',
    accent: '#f472b6',
    accentText: '#1e0b2e',
    card: 'rgba(30,27,75,.66)',
    border: 'rgba(196,181,253,.35)',
  },
}

// Ids de tema por defecto usados por el modo claro/oscuro automático (#16).
// Se eligen dos temas prediseñados con buen contraste en cada modo.
export const DEFAULT_LIGHT_THEME = 'minimal'
export const DEFAULT_DARK_THEME = 'vibrant'

export const THEME_LIST = Object.values(THEMES)

// Formas y texturas del fondo. Compartido por el editor y la validación al guardar.
export const BACKGROUND_PATTERNS = [
  { value: 'none', label: 'Ninguna' },
  { value: 'shapes', label: 'Formas' },
  { value: 'grid', label: 'Cuadrícula' },
  { value: 'glow', label: 'Luces' },
  { value: 'waves', label: 'Ondas' },
  { value: 'geo', label: 'Geométrico' },
  { value: 'confetti', label: 'Confeti' },
  { value: 'rainbow', label: 'Arcoíris' },
  { value: 'stars', label: 'Estrellas' },
]

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

export function getBackgroundStyle(theme, background) {
  const style = { background: theme.bgGradient || theme.bg }
  if (!background || background.type === 'theme') return style
  if (background.type === 'solid') return { background: background.color || theme.bg }
  if (background.type === 'gradient') {
    return {
      background: `linear-gradient(${background.angle ?? 160}deg, ${background.color || theme.bg} 0%, ${background.color2 || theme.accent} 100%)`,
    }
  }
  if (background.type === 'image' && background.url) {
    return {
      backgroundColor: theme.bg,
      backgroundImage: `linear-gradient(rgba(0,0,0,${Number(background.overlay ?? 0.25)}), rgba(0,0,0,${Number(background.overlay ?? 0.25)})), url("${background.url}")`,
      backgroundSize: 'cover',
      backgroundPosition: background.position || 'center',
      backgroundAttachment: 'fixed',
    }
  }
  return style
}

// Id del tema efectivo del perfil (respeta el modo claro/oscuro automático).
export function profileThemeId(business, prefersDark = false) {
  const b = business || {}
  if (b.autoTheme) return prefersDark ? (b.darkTheme || DEFAULT_DARK_THEME) : (b.lightTheme || DEFAULT_LIGHT_THEME)
  return b.theme
}

const HEX = /^#[0-9a-f]{6}$/i

// Color de la parte superior del perfil, usado como `theme-color` para que la
// barra del navegador móvil se funda con la página.
export function themeColor(business, prefersDark = false) {
  const b = business || {}
  const theme = resolveTheme(profileThemeId(b, prefersDark), b.customColors)
  const background = b.background || {}
  if (background.type === 'solid' && HEX.test(background.color || '')) return background.color
  if (background.type === 'gradient') {
    // Con ángulo 0 (hacia arriba) el color final queda arriba.
    const top = Number(background.angle ?? 160) === 0 ? background.color2 : background.color
    if (HEX.test(top || '')) return top
  }
  const first = String(theme.bgGradient || '').match(/#[0-9a-f]{6}\b/i)?.[0]
  return first || theme.bg
}

// --- Utilidades de color (hex y rgba) ---------------------------------------
export function parseColor(value) {
  const input = String(value || '').trim()
  const hex = input.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].split('').map((x) => x + x).join('') : hex[1]
    return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16), a: 1 }
  }
  const rgba = input.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i)
  if (rgba) return { r: Number(rgba[1]), g: Number(rgba[2]), b: Number(rgba[3]), a: rgba[4] === undefined ? 1 : Number(rgba[4]) }
  return null
}

// Luminancia percibida (0-1) de un color hex o rgba mezclado sobre `under`.
export function perceivedLuminance(value, under = '#000000') {
  const color = parseColor(value)
  const base = parseColor(under) || { r: 0, g: 0, b: 0, a: 1 }
  if (!color) return 0
  const mix = (channel) => color[channel] * color.a + base[channel] * (1 - color.a)
  return (0.299 * mix('r') + 0.587 * mix('g') + 0.114 * mix('b')) / 255
}

// Colores de las ventanas del perfil (Compartir, datos bancarios): superficie
// opaca con el color de las tarjetas del tema y un botón principal que siempre
// contrasta con esa superficie.
export function sheetColors(theme) {
  const surfaceLight = perceivedLuminance(theme.card, theme.bg) > 0.6
  const text = cardTextColor(theme)
  const accentLight = perceivedLuminance(theme.accent) > 0.6
  const primary = accentLight !== surfaceLight
    ? { background: theme.accent, color: theme.accentText }
    : { background: text, color: surfaceLight ? '#ffffff' : '#0f0f12' }
  return {
    surface: `linear-gradient(${theme.card}, ${theme.card}), ${theme.bg}`,
    text,
    muted: `color-mix(in srgb, ${text} 68%, transparent)`,
    border: `color-mix(in srgb, ${text} 16%, transparent)`,
    subtle: `color-mix(in srgb, ${text} 8%, transparent)`,
    primary,
    light: surfaceLight,
  }
}

// Color de texto legible sobre theme.card. Algunos temas usan tarjetas claras
// sobre un fondo oscuro (texto general blanco) y definen `cardText`.
export function cardTextColor(theme) {
  return theme.cardText || theme.text
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
