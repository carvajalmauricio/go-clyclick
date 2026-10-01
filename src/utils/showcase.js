// Perfiles reales de la página de inicio: los que rota el teléfono de la
// portada y los de la sección "Ejemplos reales".
import { pickShowcase } from './site.js'
import { SHOWCASE_ROTATION, getRubro, sampleBusiness } from './rubros.js'

// Perfiles publicados que se pueden mostrar ("Mostrar en la página de inicio"
// activado y sin puerta de edad), más recientes primero.
export async function fetchShowcaseProfiles(fetcher = (...args) => globalThis.fetch(...args)) {
  const res = await fetcher('/api/businesses')
  if (!res.ok) throw new Error(`Índice no disponible (${res.status})`)
  const { businesses } = await res.json()
  const profiles = await Promise.all(pickShowcase(businesses).map((entry) => (
    fetcher(`/api/business/${encodeURIComponent(entry.slug)}`)
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
  )))
  return profiles.filter((business) => business && business.slug && business.ageGate?.enabled !== true && business.showcase !== false)
}

// Lo que rota el teléfono de la portada: los perfiles reales. Solo si no hay
// ninguno (o no se pudieron cargar) se usan los ejemplos por rubro.
export function heroRotation(profiles) {
  if (Array.isArray(profiles) && profiles.length) {
    return profiles.map((business) => ({ kind: 'real', id: business.slug, label: business.name, business }))
  }
  return SHOWCASE_ROTATION.map((id) => ({ kind: 'sample', id, label: getRubro(id).label, business: sampleBusiness({ rubro: id }) }))
}

// Fondo de video → su degradado (o el tema) mientras la página termina de
// cargar o con ahorro de datos, para no descargar el video antes que el resto.
export function withoutVideo(business) {
  const background = business?.background
  if (background?.type !== 'video') return business
  const fallback = background.color
    ? { ...background, type: 'gradient', color2: background.color2 || background.color }
    : { ...background, type: 'theme' }
  return { ...business, background: fallback }
}
