// Construye las URLs finales de los botones de acción del perfil a partir
// de los datos crudos del negocio.
import { buildBankActions } from './banking.js'
import { normalizeAnimation } from './animations.js'
import { normalizeLayout } from './buttonStyles.js'

// Iconos disponibles para los enlaces personalizados. Todos reutilizan cases
// existentes en src/components/Icons.jsx (no se inventan SVG nuevos).
export const LINK_ICONS = [
  { value: 'link', label: 'Enlace' },
  { value: 'globe', label: 'Sitio web' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'star', label: 'Estrella' },
  { value: 'maps', label: 'Ubicación' },
  { value: 'map', label: 'Mapa' },
  { value: 'menu', label: 'Menú' },
  { value: 'contact', label: 'Contacto' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'bank', label: 'Banco' },
  { value: 'share', label: 'Compartir' },
]

// Normaliza el nombre del icono de un enlace; cadena vacía si no es válido.
export function normalizeLinkIcon(value) {
  return LINK_ICONS.some((option) => option.value === value) ? value : ''
}

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

export function youtubeUrl(handle) {
  if (!handle) return ''
  const h = String(handle).trim()
  if (/^https?:\/\//i.test(h)) return h
  // Acepta "@canal", "canal", "c/nombre", "channel/UC...", "user/nombre"
  if (h.startsWith('@')) return `https://youtube.com/${h}`
  if (/^(c|channel|user)\//i.test(h)) return `https://youtube.com/${h}`
  return `https://youtube.com/@${h}`
}

export function xUrl(handle) {
  if (!handle) return ''
  const h = String(handle).replace(/^@/, '').trim()
  if (/^https?:\/\//i.test(h)) return h
  return `https://x.com/${h}`
}

export function threadsUrl(handle) {
  if (!handle) return ''
  const h = String(handle).replace(/^@/, '').trim()
  if (/^https?:\/\//i.test(h)) return h
  return `https://threads.net/@${h}`
}

export function pinterestUrl(handle) {
  if (!handle) return ''
  const h = String(handle).replace(/^@/, '').trim()
  if (/^https?:\/\//i.test(h)) return h
  return `https://pinterest.com/${h}`
}

export function telegramUrl(handle) {
  if (!handle) return ''
  const h = String(handle).replace(/^@/, '').trim()
  if (/^https?:\/\//i.test(h)) return h
  if (/^t\.me\//i.test(h)) return `https://${h}`
  return `https://t.me/${h}`
}

export function spotifyUrl(handle) {
  if (!handle) return ''
  const h = String(handle).trim()
  if (/^https?:\/\//i.test(h)) return h
  if (/^spotify:/i.test(h)) return h
  // Acepta "artist/ID", "user/ID"; si no trae prefijo, asume perfil de artista
  if (/^(artist|user|show|playlist|album)\//i.test(h)) return `https://open.spotify.com/${h}`
  return `https://open.spotify.com/artist/${h}`
}

export function emailUrl(value) {
  if (!value) return ''
  const v = String(value).trim()
  if (/^mailto:/i.test(v)) return v
  return `mailto:${v}`
}

export function phoneUrl(value) {
  if (!value) return ''
  const v = String(value).trim()
  if (/^tel:/i.test(v)) return v
  // Conserva el prefijo + y los dígitos
  const cleaned = v.replace(/[^\d+]/g, '')
  if (!cleaned) return ''
  return `tel:${cleaned}`
}

export function ensureHttp(url) {
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

// Extrae una dirección legible desde un enlace de Google Maps para poder
// copiarla con un toque. Soporta las formas más comunes:
//   .../maps/place/Direccion+Aqui/...  -> "Direccion Aqui"
//   ...?q=Direccion+Aqui  o  ?query=... -> "Direccion Aqui"
// Devuelve '' si no se puede derivar una dirección (p. ej. enlaces cortos
// tipo maps.app.goo.gl, que no exponen el texto). Nunca lanza.
export function addressFromMapsUrl(mapsUrl) {
  const value = String(mapsUrl || '').trim()
  if (!value) return ''
  let url
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
  } catch {
    return ''
  }
  const decode = (raw) => {
    try {
      return decodeURIComponent(String(raw).replace(/\+/g, ' ')).trim()
    } catch {
      return ''
    }
  }
  // 1) Parámetros de consulta habituales.
  for (const param of ['q', 'query', 'destination']) {
    const found = url.searchParams.get(param)
    if (found) {
      const text = decode(found)
      // Descarta coordenadas puras "lat,lng".
      if (text && !/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(text)) return text
    }
  }
  // 2) Segmento /place/<direccion>/ del path.
  const match = url.pathname.match(/\/place\/([^/]+)/i)
  if (match) {
    const text = decode(match[1])
    if (text && !/^@?-?\d+(\.\d+)?,-?\d+(\.\d+)?/.test(text)) return text
  }
  return ''
}

// Catálogo compartido de redes sociales. El orden define el orden por defecto
// en el editor y en el perfil. Cada entrada expone: key, label, icon (case en
// Icons.jsx), buildUrl (a partir del valor crudo) y placeholder para el editor.
export const SOCIAL_NETWORKS = [
  { key: 'instagram', label: 'Instagram', icon: 'instagram', buildUrl: instagramUrl, placeholder: 'minegocio' },
  { key: 'tiktok', label: 'TikTok', icon: 'tiktok', buildUrl: tiktokUrl, placeholder: 'minegocio' },
  { key: 'facebook', label: 'Facebook', icon: 'facebook', buildUrl: facebookUrl, placeholder: 'minegocio' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin', buildUrl: linkedinUrl, placeholder: 'company/minegocio' },
  { key: 'youtube', label: 'YouTube', icon: 'youtube', buildUrl: youtubeUrl, placeholder: '@micanal' },
  { key: 'x', label: 'X (Twitter)', icon: 'x', buildUrl: xUrl, placeholder: 'minegocio' },
  { key: 'threads', label: 'Threads', icon: 'threads', buildUrl: threadsUrl, placeholder: 'minegocio' },
  { key: 'pinterest', label: 'Pinterest', icon: 'pinterest', buildUrl: pinterestUrl, placeholder: 'minegocio' },
  { key: 'telegram', label: 'Telegram', icon: 'telegram', buildUrl: telegramUrl, placeholder: 'minegocio' },
  { key: 'spotify', label: 'Spotify', icon: 'spotify', buildUrl: spotifyUrl, placeholder: 'artist/ID' },
  { key: 'email', label: 'Email', icon: 'email', buildUrl: emailUrl, placeholder: 'hola@negocio.com' },
  { key: 'phone', label: 'Teléfono', icon: 'phone', buildUrl: phoneUrl, placeholder: '+593999999999' },
]

// Lista de claves de red social válidas (para normalización en _lib.js).
export const SOCIAL_NETWORK_KEYS = SOCIAL_NETWORKS.map((network) => network.key)

const SOCIAL_NETWORK_MAP = new Map(SOCIAL_NETWORKS.map((network) => [network.key, network]))

// Posiciones válidas para la fila de redes sociales respecto al hero.
export const SOCIAL_POSITIONS = ['top', 'bottom']

// Normaliza la posición de las redes; 'top' (bajo el hero) por defecto.
export function normalizeSocialPosition(value) {
  return SOCIAL_POSITIONS.includes(value) ? value : 'top'
}

// Normaliza un array de orden de redes: solo claves válidas, sin duplicados.
export function normalizeSocialOrder(order) {
  if (!Array.isArray(order)) return []
  const seen = new Set()
  const out = []
  for (const key of order) {
    if (SOCIAL_NETWORK_MAP.has(key) && !seen.has(key)) {
      seen.add(key)
      out.push(key)
    }
  }
  return out
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

  const actions = getActionSettings(b)
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
        animation: normalizeAnimation(setting.animation),
        colors: setting.colors,
      }
    })
  return [...actions, ...buildCustomLinks(b), ...buildBankActions(b)]
}

// Convierte los enlaces personalizados del negocio en el mismo formato de
// acción que buildActions, para que compartan el renderizado y el agrupado
// por secciones del perfil. Solo se incluyen los habilitados con URL válida.
export function buildCustomLinks(business) {
  const links = Array.isArray(business?.links) ? business.links : []
  return links
    .filter((link) => link && link.enabled !== false)
    .map((link) => ({ ...link, url: ensureHttp(String(link.url || '').trim()) }))
    .filter((link) => link.url)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((link) => ({
      key: `link-${link.id}`,
      label: link.title || 'Enlace',
      icon: normalizeLinkIcon(link.icon) || 'link',
      url: link.url,
      thumbnail: link.thumbnail || '',
      layout: normalizeLayout(link.layout),
      sectionId: link.sectionId || '',
      animation: normalizeAnimation(link.animation),
      colors: link.colors,
      custom: true,
    }))
}

// Redes sociales activas. Itera el catálogo SOCIAL_NETWORKS, incluye solo las
// redes con valor y resuelve su URL con el builder correspondiente. Respeta el
// orden explícito (business.socialOrder o business.social.order) si existe;
// de lo contrario usa el orden del catálogo. Compatible con perfiles antiguos
// que solo traen las 4 redes originales.
export function buildSocials(business) {
  const s = (business && business.social) || {}
  const explicitOrder = normalizeSocialOrder(
    (business && business.socialOrder) || s.order || []
  )
  // Primero las redes según el orden explícito, luego el resto en orden de catálogo.
  const orderedKeys = [
    ...explicitOrder,
    ...SOCIAL_NETWORK_KEYS.filter((key) => !explicitOrder.includes(key)),
  ]
  const out = []
  for (const key of orderedKeys) {
    const value = s[key]
    if (!value) continue
    const network = SOCIAL_NETWORK_MAP.get(key)
    const url = network.buildUrl(value)
    if (!url) continue
    out.push({ key, url, label: network.label })
  }
  return out
}
