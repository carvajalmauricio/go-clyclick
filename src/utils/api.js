// Cliente ligero para la API de ClickClick Go desde el panel admin.
//
// Autenticación: Cloudflare Access (Google + OTP). El navegador ya tiene la
// sesión de Access (cookie CF_Authorization) tras el login. Cloudflare inyecta
// automáticamente el JWT en las peticiones al mismo dominio, así que el cliente
// NO necesita enviar ningún token manualmente.

// Si Access expiró, una petición devuelve una redirección al login. Las
// peticiones administrativas usan redirect: 'manual' para impedir que fetch
// intente seguir esa redirección hacia otro dominio y termine bloqueada por
// CORS. La navegación principal sí puede abrir el login de Access.
//
// Para no entrar en un bucle de recargas (p. ej. en local, donde no hay
// Access, o si el servidor rechaza una sesión válida), solo se redirige una
// vez cada 30 s y nunca en localhost; las llamadas en segundo plano (como la
// lista de solicitudes) pueden pedir que no se redirija.
const REDIRECT_KEY = 'clyclick:auth-redirect'

function canRedirect() {
  if (['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)) return false
  try {
    const last = Number(sessionStorage.getItem(REDIRECT_KEY)) || 0
    if (Date.now() - last < 30_000) return false
    sessionStorage.setItem(REDIRECT_KEY, String(Date.now()))
  } catch { /* Sin sessionStorage: se redirige igual. */ }
  return true
}

function handleAuthRedirect(res, redirectOnAuth = true) {
  const authFailed = res.redirected || res.type === 'opaqueredirect' || res.status === 401 || res.status === 403
  if (!authFailed) return
  if (redirectOnAuth && canRedirect()) {
    window.location.assign('/admin')
    throw new Error('Sesión expirada, reautenticando...')
  }
  throw new Error('Tu sesión no es válida. Vuelve a ingresar al panel para continuar.')
}

async function adminFetch(resource, options = {}, { redirectOnAuth = true } = {}) {
  const res = await fetch(resource, { ...options, redirect: 'manual' })
  handleAuthRedirect(res, redirectOnAuth)
  return res
}

// Devuelve la identidad del usuario autenticado por Access (email, etc.)
export async function getIdentity() {
  try {
    const res = await adminFetch('/admin/api/session', {
      headers: { 'Cache-Control': 'no-cache' },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// Lista el índice de negocios (lectura pública)
export async function listBusinesses() {
  const res = await fetch('/api/businesses', { headers: { 'Cache-Control': 'no-cache' } })
  if (!res.ok) throw new Error(`Error al listar (${res.status})`)
  const data = await res.json()
  return data.businesses || []
}

// Obtiene un negocio completo por slug (lectura pública)
export async function getBusiness(slug) {
  const res = await fetch(`/api/business/${encodeURIComponent(slug)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Error al obtener (${res.status})`)
  return res.json()
}

// Crea o edita un negocio (protegido por Access)
export async function saveBusiness(business, { isEdit = false } = {}) {
  const res = await adminFetch('/admin/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...business, isEdit }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error al guardar (${res.status})`)
  return data
}

// Sube una imagen (logo) a R2 (protegido por Access)
export async function uploadLogo(file, slug) {
  return uploadMedia(file, slug, 'logo')
}

// Sube imágenes o videos usados por el perfil (logo, miniatura o fondo).
export async function uploadMedia(file, slug, kind = 'media') {
  const form = new FormData()
  form.append('file', file)
  form.append('slug', slug || 'general')
  form.append('kind', kind)
  const res = await adminFetch('/admin/api/upload', {
    method: 'POST',
    body: form, // NO fijar Content-Type: el browser pone el boundary
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error al subir (${res.status})`)
  return data
}

// Elimina un negocio (protegido por Access)
export async function deleteBusiness(slug) {
  const res = await adminFetch('/admin/api/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error al eliminar (${res.status})`)
  return data
}

// --- Solicitudes de perfil (página de inicio) ---------------------------------

// Envía una solicitud desde la página de inicio (público).
export async function submitLead(payload) {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.error || 'No se pudo enviar tu solicitud.')
    error.fields = data.fields || {}
    error.status = res.status
    throw error
  }
  return data
}

// Lista las solicitudes recibidas (protegido por Access)
export async function listLeads() {
  const res = await adminFetch('/admin/api/leads', { headers: { 'Cache-Control': 'no-cache' } }, { redirectOnAuth: false })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error al cargar las solicitudes (${res.status})`)
  return data.leads || []
}

async function leadAction(body) {
  const res = await adminFetch('/admin/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error al actualizar la solicitud (${res.status})`)
  return data
}

// Cambia estado, nota interna o perfil creado de una solicitud
export async function updateLead(id, changes) {
  return (await leadAction({ action: 'update', id, changes })).lead
}

export async function deleteLead(id) {
  return leadAction({ action: 'delete', id })
}
