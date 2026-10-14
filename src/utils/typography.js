import { getFont } from './fonts.js'
import { descriptionColor } from './heroDescription.js'
export const FONTS = [
  { id: 'system', name: 'Moderna · Sistema', family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { id: 'arial', name: 'Clásica · Arial', family: 'Arial, Helvetica, sans-serif' },
  { id: 'georgia', name: 'Editorial · Georgia', family: 'Georgia, "Times New Roman", serif' },
  { id: 'verdana', name: 'Amplia · Verdana', family: 'Verdana, Geneva, sans-serif' },
  { id: 'trebuchet', name: 'Amigable · Trebuchet', family: '"Trebuchet MS", Arial, sans-serif' },
]

function clamp(value, fallback, min, max) {
  const number = Number(value ?? fallback)
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback
}

export function normalizeTypography(value) {
  return {
    font: FONTS.some((font) => font.id === value?.font) ? value.font : 'system',
    titleSize: clamp(value?.titleSize, 26, 22, 40),
    descriptionSize: clamp(value?.descriptionSize, 14, 14, 22),
    buttonSize: clamp(value?.buttonSize, 16, 14, 22),
    lineHeight: clamp(value?.lineHeight, 1.5, 1.3, 2),
    textPanel: ['dark', 'light'].includes(value?.textPanel) ? value.textPanel : 'none',
  }
}

export function textPresentation(business, theme) {
  const typography = normalizeTypography(business.typography)
  const panel = typography.textPanel
  return {
    typography,
    family: getFont(business.font)?.family || (business.typography?.font ? FONTS.find((font) => font.id === typography.font).family : undefined),
    background: panel === 'dark' ? '#111111' : panel === 'light' ? '#ffffff' : undefined,
    title: panel === 'dark' ? '#ffffff' : panel === 'light' ? '#18181b' : theme.text,
    description: panel === 'dark' ? '#ffffff' : panel === 'light' ? '#18181b' : descriptionColor(business, theme),
  }
}

// Only opaque hex pairs are measured; media, gradients and transparency require visual review.
export function contrastRatio(foreground, background) {
  const luminance = (color) => {
    if (!/^#[0-9a-f]{6}$/i.test(color || '')) return null
    const rgb = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16) / 255)
      .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]
  }
  const a = luminance(foreground), b = luminance(background)
  return a === null || b === null ? null : (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
}
