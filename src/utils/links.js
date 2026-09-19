// Construye las URLs finales de los botones de acción del perfil a partir
// de los datos crudos del negocio.

// Normaliza un número para WhatsApp (solo dígitos, con código de país).
export function whatsappUrl(number, message) {
  const digits = String(number || '').replace(/[^\d]/g, '')
  if (!digits) return ''
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${digits}${text}`
}

export function instagramUrl(handle) {
  if (!handle) return ''
  const h = String(handle).replace(/^@/, '').trim()
  if (/^https?:\/\//i.test(h)) return h
  return `https://instagram.com/${h}`
}

export function tiktokUrl(handle) {
  if (!handle) return ''
  const h = String(handle).replace(/^@/, '').trim()
  if (/^https?:\/\//i.test(h)) return h
  return `https://tiktok.com/@${h}`
}

export function facebookUrl(handle) {
  if (!handle) return ''
  const h = String(handle).trim()
  if (/^https?:\/\//i.test(h)) return h
  return `https://facebook.com/${h}`
}

export function linkedinUrl(handle) {
  if (!handle) return ''
  const h = String(handle).trim()
  if (/^https?:\/\//i.test(h)) return h
  // Acepta "company/nombre" o "in/usuario"; si no trae prefijo, asume company
  if (h.startsWith('company/') || h.startsWith('in/')) return `https://linkedin.com/${h}`
  return `https://linkedin.com/company/${h.replace(/^@/, '')}`
}

export function ensureHttp(url) {
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

export const ACTION_DEFINITIONS = [
  { type: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', field: 'whatsapp', valueLabel: 'Número con código de país' },
  { type: 'review', label: 'Déjanos 5 estrellas en Google', icon: 'star', field: 'googleReviewUrl', valueLabel: 'Enlace de reseñas de Google' },
  { type: 'maps', label: 'Cómo llegar (Google Maps)', icon: 'maps', field: 'mapsUrl', valueLabel: 'Enlace de Google Maps' },
  { type: 'waze', label: 'Abrir en Waze', icon: 'map', field: 'wazeUrl', valueLabel: 'Enlace de Waze' },
  { type: 'menu', label: 'Ver menú / catálogo', icon: 'menu', field: 'menuUrl', valueLabel: 'Enlace del menú o catálogo' },
  { type: 'website', label: 'Sitio web', icon: 'globe', field: 'website', valueLabel: 'Sitio web' },
  { type: 'contact', label: 'Guardar contacto', icon: 'contact', field: 'phone', valueLabel: 'Usa los datos de la sección Contacto' },
]

export function getActionSettings(business) {
  const saved = Array.isArray(business?.actionSettings) ? business.actionSettings : []
  const byType = new Map(saved.map((item) => [item.type, item]))
  return ACTION_DEFINITIONS.map((definition, index) => ({
    type: definition.type,
    label: definition.label,
    enabled: true,
    order: index,
    layout: 'classic',
    thumbnail: '',
    sectionId: '',
    animation: 'none',
    ...(byType.get(definition.type) || {}),
  })).sort((a, b) => a.order - b.order)
}

// Devuelve la lista de acciones activas del negocio, en orden de prioridad,
// lista para renderizar como botones.
export function buildActions(business) {
  const b = business || {}
  const urls = {
    whatsapp: b.whatsapp ? whatsappUrl(b.whatsapp, `Hola ${b.name || ''}, vengo desde su perfil ClickClick`) : '',
    review: b.googleReviewUrl ? ensureHttp(b.googleReviewUrl) : '',
    maps: b.mapsUrl ? ensureHttp(b.mapsUrl) : '',
    waze: b.wazeUrl ? ensureHttp(b.wazeUrl) : '',
    menu: b.menuUrl ? ensureHttp(b.menuUrl) : '',
    website: b.website ? ensureHttp(b.website) : '',
    contact: b.phone || b.email || b.whatsapp ? '#contact' : '',
  }
  const definitions = new Map(ACTION_DEFINITIONS.map((item) => [item.type, item]))

  return getActionSettings(b)
    .filter((setting) => setting.enabled !== false && urls[setting.type])
    .map((setting) => {
      const definition = definitions.get(setting.type)
      return {
        key: setting.type,
        label: setting.label || definition.label,
        icon: definition.icon,
        url: urls[setting.type],
        primary: setting.type === 'whatsapp',
        highlight: setting.type === 'review',
        isContact: setting.type === 'contact',
        layout: setting.layout || 'classic',
        thumbnail: setting.thumbnail || '',
        sectionId: setting.sectionId || '',
        animation: setting.animation || 'none',
      }
    })
}

// Redes sociales activas
export function buildSocials(business) {
  const s = (business && business.social) || {}
  const out = []
  if (s.instagram) out.push({ key: 'instagram', url: instagramUrl(s.instagram) })
  if (s.tiktok) out.push({ key: 'tiktok', url: tiktokUrl(s.tiktok) })
  if (s.facebook) out.push({ key: 'facebook', url: facebookUrl(s.facebook) })
  if (s.linkedin) out.push({ key: 'linkedin', url: linkedinUrl(s.linkedin) })
  return out
}
