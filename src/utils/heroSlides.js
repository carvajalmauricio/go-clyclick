// Slides de la tarjeta de presentación (logo, título, descripción y categoría).
// El primer slide siempre es la presentación base del negocio; los slides
// adicionales rotan después de él. Compartido por el editor, el perfil y la
// validación al guardar.

export const HERO_SLIDES_LIMIT = 10
export const HERO_INTERVAL_MIN = 2
export const HERO_INTERVAL_MAX = 30
export const HERO_INTERVAL_DEFAULT = 3

export const DEFAULT_HERO_SLIDES = { enabled: false, interval: HERO_INTERVAL_DEFAULT, items: [] }

const text = (value, max) => String(value ?? '').trim().slice(0, max)

export function normalizeInterval(value) {
  const seconds = Number(value)
  if (!Number.isFinite(seconds)) return HERO_INTERVAL_DEFAULT
  return Math.max(HERO_INTERVAL_MIN, Math.min(HERO_INTERVAL_MAX, Math.round(seconds * 2) / 2))
}

export function normalizeHeroSlides(value) {
  if (!value || typeof value !== 'object') return { ...DEFAULT_HERO_SLIDES }
  const items = Array.isArray(value.items)
    ? value.items
        .filter((item) => item && typeof item === 'object')
        .slice(0, HERO_SLIDES_LIMIT)
        .map((item, index) => ({
          id: text(item.id, 80) || `slide-${index}`,
          image: text(item.image, 500),
          title: text(item.title, 80),
          description: text(item.description, 200),
          category: text(item.category, 60),
        }))
        // Un slide sin contenido no aporta nada en la rotación.
        .filter((item) => item.image || item.title || item.description || item.category)
    : []
  return { enabled: value.enabled === true, interval: normalizeInterval(value.interval), items }
}

// Lista final de slides que muestra el perfil. Si los slides están apagados o
// no hay slides adicionales, solo existe la presentación base.
export function getHeroSlides(business) {
  const base = {
    id: 'base',
    isBase: true,
    image: business.logo || '',
    title: business.name || '',
    description: business.description || '',
    category: business.category || '',
  }
  const config = business.heroSlides
  if (!config?.enabled || !Array.isArray(config.items)) return [base]
  const extra = config.items
    .filter((item) => item && (item.image || item.title || item.description || item.category))
    .map((item, index) => ({
      id: item.id || `slide-${index}`,
      isBase: false,
      // Sin imagen propia, el slide reutiliza el logo del negocio.
      image: item.image || business.logo || '',
      title: item.title || '',
      description: item.description || '',
      category: item.category || '',
    }))
  return [base, ...extra]
}
