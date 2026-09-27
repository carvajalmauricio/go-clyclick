// Catálogo de fuentes personalizadas para los perfiles públicos.
// Cada entrada define:
//   - value:     id persistido en business.font ('' = fuente por defecto del tema)
//   - label:     nombre visible en el editor
//   - family:    stack CSS de font-family que se aplica al perfil
//   - googleName: nombre del recurso en fonts.googleapis.com (con '+' por espacio)
// El catálogo es la única fuente de verdad: se comparte entre editor,
// normalización (validación) y perfil (carga del stylesheet).
export const FONTS = [
  { value: 'poppins', label: 'Poppins', family: "'Poppins', sans-serif", googleName: 'Poppins:wght@400;500;600;700' },
  { value: 'montserrat', label: 'Montserrat', family: "'Montserrat', sans-serif", googleName: 'Montserrat:wght@400;500;600;700' },
  { value: 'inter', label: 'Inter', family: "'Inter', sans-serif", googleName: 'Inter:wght@400;500;600;700' },
  { value: 'lora', label: 'Lora', family: "'Lora', serif", googleName: 'Lora:wght@400;500;600;700' },
  { value: 'playfair', label: 'Playfair Display', family: "'Playfair Display', serif", googleName: 'Playfair+Display:wght@400;500;600;700' },
  { value: 'nunito', label: 'Nunito', family: "'Nunito', sans-serif", googleName: 'Nunito:wght@400;500;600;700' },
  { value: 'oswald', label: 'Oswald', family: "'Oswald', sans-serif", googleName: 'Oswald:wght@400;500;600;700' },
  { value: 'dancing', label: 'Dancing Script', family: "'Dancing Script', cursive", googleName: 'Dancing+Script:wght@400;500;600;700' },
]

// Valida el id de fuente contra el catálogo. Devuelve '' (fuente del tema)
// para valores desconocidos o vacíos.
export function normalizeFont(value) {
  const id = String(value || '').trim()
  return FONTS.some((font) => font.value === id) ? id : ''
}

// Devuelve la entrada del catálogo o null si no hay fuente seleccionada.
export function getFont(value) {
  const id = normalizeFont(value)
  return id ? FONTS.find((font) => font.value === id) : null
}

// URL del stylesheet de Google Fonts para la fuente elegida (con display=swap),
// o '' si no hay fuente seleccionada.
export function fontStylesheetUrl(value) {
  const font = getFont(value)
  if (!font) return ''
  return `https://fonts.googleapis.com/css2?family=${font.googleName}&display=swap`
}
