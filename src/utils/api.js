// Cliente ligero para la API de ClickClick Go desde el panel admin.
//
// Autenticación: Cloudflare Access (Google + OTP). El navegador ya tiene la
// sesión de Access (cookie CF_Authorization) tras el login. Cloudflare inyecta
// automáticamente el JWT en las peticiones al mismo dominio, así que el cliente
// NO necesita enviar ningún token manualmente.

// Si Access ya expiró, una petición puede devolver una redirección al login.
// fetch la sigue de forma opaca; detectamos ese caso y forzamos recarga para
// que Access muestre su pantalla de login.
function handleAuthRedirect(res) {
  if (res.redirected || res.type === 'opaqueredirect') {
    window.location.reload()
    throw new Error('Sesión expirada, reautenticando...')
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error('No autorizado. Vuelve a iniciar sesión.')
  }
}

// Devuelve la identidad del usuario autenticado por Access (email, etc.)
export async function getIdentity() {
  try {
    const res = await fetch('/cdn-cgi/access/get-identity')
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
  const res = await fetch('/admin/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...business, isEdit }),
  })
  handleAuthRedirect(res)
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
  const res = await fetch('/admin/api/upload', {
    method: 'POST',
    body: form, // NO fijar Content-Type: el browser pone el boundary
  })
  handleAuthRedirect(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error al subir (${res.status})`)
  return data
}

// Elimina un negocio (protegido por Access)
export async function deleteBusiness(slug) {
  const res = await fetch('/admin/api/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  })
  handleAuthRedirect(res)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error al eliminar (${res.status})`)
  return data
}
