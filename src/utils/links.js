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

// Devuelve la lista de acciones activas del negocio, en orden de prioridad,
// lista para renderizar como botones.
export function buildActions(business) {
  const b = business || {}
  const actions = []

  if (b.whatsapp) {
    actions.push({
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: 'whatsapp',
      url: whatsappUrl(b.whatsapp, `Hola ${b.name || ''}, vengo desde su perfil ClickClick`),
      primary: true,
    })
  }
  if (b.googleReviewUrl) {
    actions.push({
      key: 'review',
      label: 'Déjanos 5 estrellas en Google',
      icon: 'star',
      url: ensureHttp(b.googleReviewUrl),
      highlight: true,
    })
  }
  if (b.mapsUrl) {
    actions.push({ key: 'maps', label: 'Cómo llegar (Google Maps)', icon: 'maps', url: ensureHttp(b.mapsUrl) })
  }
  if (b.wazeUrl) {
    actions.push({ key: 'waze', label: 'Abrir en Waze', icon: 'map', url: ensureHttp(b.wazeUrl) })
  }
  if (b.menuUrl) {
    actions.push({ key: 'menu', label: 'Ver menú / catálogo', icon: 'menu', url: ensureHttp(b.menuUrl) })
  }
  if (b.website) {
    actions.push({ key: 'website', label: 'Sitio web', icon: 'globe', url: ensureHttp(b.website) })
  }

  // Enlaces personalizados adicionales
  if (Array.isArray(b.links)) {
    for (const l of b.links) {
      if (l && l.enabled !== false && l.value) {
        actions.push({
          key: `custom-${actions.length}`,
          label: l.label || l.value,
          icon: 'link',
          url: ensureHttp(l.value),
        })
      }
    }
  }

  return actions
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
