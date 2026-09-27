export function normalizeButtonColors(colors) {
  const result = {}
  for (const key of ['background', 'text', 'border']) {
    const value = String(colors?.[key] || '').trim()
    if (/^#[0-9a-f]{6}$/i.test(value)) result[key] = value
  }
  return result
}

export function getButtonColors(action, theme, style = {}) {
  const custom = normalizeButtonColors(action.colors)
  return {
    background: custom.background || (style.variant === 'outline' ? 'transparent' : style.variant === 'glass' ? `color-mix(in srgb, ${theme.card} 73%, transparent)` : action.primary ? theme.accent : theme.card),
    text: custom.text || (style.variant === 'outline' ? theme.text : action.primary ? theme.accentText : theme.text),
    border: custom.border || (style.variant === 'outline' ? theme.text : theme.border),
  }
}
