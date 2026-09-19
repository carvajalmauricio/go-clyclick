// ---------------------------------------------------------------------------
// Utilidades compartidas por las Pages Functions de ClickClick Go
// ---------------------------------------------------------------------------

export const KEY_PREFIX = 'business:'
export const INDEX_KEY = 'businesses:index'

// Respuesta JSON estándar
export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  })
}

// Convierte un texto en un slug seguro para URL: "Pizzería Napolí!" -> "pizzeria-napoli"
export function slugify(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // solo alfanumérico, espacios y guiones
    .replace(/\s+/g, '-') // espacios -> guiones
    .replace(/-+/g, '-') // colapsa guiones repetidos
    .replace(/^-|-$/g, '') // sin guiones al inicio/fin
}

// ---------------------------------------------------------------------------
// Autorización
//
// Modo principal: Cloudflare Access (Google + OTP).
//   Cloudflare inyecta la cabecera "Cf-Access-Jwt-Assertion" en cada request
//   que ya pasó por el login de Access. Validamos ese JWT (firma RS256 +
//   claim "aud") contra las claves públicas del team (JWKS).
//   Requiere las variables de entorno:
//     - ACCESS_TEAM_DOMAIN  (ej. "miequipo.cloudflareaccess.com")
//     - ACCESS_AUD          (Application Audience tag de la app Access)
//
// Modo compatibilidad (fallback): si Access NO está configurado todavía,
//   se acepta el token Bearer contra env.ADMIN_SECRET_KEY. Esto evita romper
//   producción durante la transición. Una vez Access esté activo y verificado,
//   se puede quitar el secret ADMIN_SECRET_KEY para desactivar el fallback.
// ---------------------------------------------------------------------------

// Devuelve { ok: boolean, email?: string, reason?: string }
export async function authorize(request, env) {
  // 1) Intentar Cloudflare Access si está configurado
  if (env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD) {
    const jwt = request.headers.get('Cf-Access-Jwt-Assertion')
    if (jwt) {
      const res = await verifyAccessJwt(jwt, env.ACCESS_TEAM_DOMAIN, env.ACCESS_AUD)
      if (res.ok) return { ok: true, email: res.email }
      return { ok: false, reason: res.reason || 'Access JWT inválido' }
    }
    // Sin cabecera de Access: intentar fallback por token si existe
  }

  // 2) Fallback: token Bearer (transición / desarrollo local)
  if (env.ADMIN_SECRET_KEY) {
    const header = request.headers.get('Authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
    if (token && timingSafeEqual(token, env.ADMIN_SECRET_KEY)) {
      return { ok: true, email: 'token-admin' }
    }
  }

  return { ok: false, reason: 'No autorizado' }
}

// Compat: versión booleana usada por los endpoints existentes.
export async function isAuthorized(request, env) {
  const res = await authorize(request, env)
  return res.ok
}

// --- Verificación del JWT de Cloudflare Access (RS256) ---

const jwksCache = new Map() // teamDomain -> { keys, exp }

async function getAccessKeys(teamDomain) {
  const cached = jwksCache.get(teamDomain)
  if (cached && cached.exp > Date.now()) return cached.keys

  const url = `https://${teamDomain}/cdn-cgi/access/certs`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error('No se pudieron obtener las claves de Access')
  const data = await resp.json()
  const keys = data.keys || []
  // Cachear 1 hora
  jwksCache.set(teamDomain, { keys, exp: Date.now() + 60 * 60 * 1000 })
  return keys
}

async function verifyAccessJwt(token, teamDomain, expectedAud) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return { ok: false, reason: 'JWT mal formado' }

    const [headerB64, payloadB64, sigB64] = parts
    const header = JSON.parse(b64urlToString(headerB64))
    const payload = JSON.parse(b64urlToString(payloadB64))

    // Validar claims básicos
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && now >= payload.exp) return { ok: false, reason: 'JWT expirado' }
    if (payload.nbf && now < payload.nbf) return { ok: false, reason: 'JWT aún no válido' }

    // aud puede ser string o array
    const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    if (!auds.includes(expectedAud)) return { ok: false, reason: 'aud no coincide' }

    // Emisor debe ser el team domain
    if (payload.iss && payload.iss !== `https://${teamDomain}`) {
      return { ok: false, reason: 'iss no coincide' }
    }

    // Buscar la clave por kid y verificar la firma
    const keys = await getAccessKeys(teamDomain)
    const jwk = keys.find((k) => k.kid === header.kid)
    if (!jwk) return { ok: false, reason: 'kid desconocido' }

    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const enc = new TextEncoder()
    const signed = enc.encode(`${headerB64}.${payloadB64}`)
    const signature = b64urlToBytes(sigB64)

    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, signed)
    if (!valid) return { ok: false, reason: 'Firma inválida' }

    return { ok: true, email: payload.email || payload['custom:email'] || '' }
  } catch (e) {
    return { ok: false, reason: 'Error validando JWT' }
  }
}

function b64urlToString(b64url) {
  return new TextDecoder().decode(b64urlToBytes(b64url))
}

function b64urlToBytes(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : ''
  const bin = atob(b64 + pad)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

// Comparación de strings en tiempo constante para evitar timing attacks
function timingSafeEqual(a, b) {
  const enc = new TextEncoder()
  const ba = enc.encode(a)
  const bb = enc.encode(b)
  if (ba.length !== bb.length) return false
  let diff = 0
  for (let i = 0; i < ba.length; i++) {
    diff |= ba[i] ^ bb[i]
  }
  return diff === 0
}

// Lee el índice global de negocios (array ligero). Nunca lanza; devuelve [] si no existe.
export async function readIndex(env) {
  try {
    const raw = await env.BUSINESSES.get(INDEX_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Escribe el índice global de negocios
export async function writeIndex(env, index) {
  await env.BUSINESSES.put(INDEX_KEY, JSON.stringify(index))
}

// Inserta o actualiza una entrada del índice a partir de un negocio completo
export function upsertIndexEntry(index, business) {
  const entry = {
    slug: business.slug,
    name: business.name || '',
    category: business.category || '',
    logo: business.logo || '',
    updatedAt: business.updatedAt || Date.now(),
  }
  const idx = index.findIndex((e) => e.slug === business.slug)
  if (idx >= 0) {
    index[idx] = entry
  } else {
    index.push(entry)
  }
  return index
}

// Elimina una entrada del índice por slug
export function removeIndexEntry(index, slug) {
  return index.filter((e) => e.slug !== slug)
}

// Normaliza y valida el payload de un negocio que llega desde el admin.
// Devuelve { ok, business, error }.
export function normalizeBusiness(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Payload inválido' }
  }

  const name = String(payload.name || '').trim()
  if (!name) {
    return { ok: false, error: 'El nombre del negocio es obligatorio' }
  }

  // El slug puede venir dado; si no, se deriva del nombre.
  let slug = slugify(payload.slug || payload.name)
  if (!slug) {
    return { ok: false, error: 'No se pudo generar un slug válido' }
  }

  const allowedActions = ['whatsapp', 'review', 'maps', 'waze', 'menu', 'website', 'contact']
  const actionSettings = Array.isArray(payload.actionSettings)
    ? payload.actionSettings
        .filter((item) => item && allowedActions.includes(item.type))
        .slice(0, allowedActions.length)
        .map((item, order) => ({
          type: item.type,
          label: String(item.label || '').trim().slice(0, 80),
          enabled: item.enabled !== false,
          order: Number.isFinite(Number(item.order)) ? Number(item.order) : order,
          layout: item.layout === 'featured' ? 'featured' : 'classic',
          thumbnail: String(item.thumbnail || '').trim(),
          sectionId: String(item.sectionId || '').trim().slice(0, 80),
          animation: ['pulse', 'bounce'].includes(item.animation) ? item.animation : 'none',
        }))
    : []

  const sections = Array.isArray(payload.sections)
    ? payload.sections.slice(0, 12).map((section, index) => ({
        id: String(section?.id || `section-${index}`).trim().slice(0, 80),
        title: String(section?.title || '').trim().slice(0, 60),
      })).filter((section) => section.title)
    : []

  const background = payload.background && typeof payload.background === 'object'
    ? {
        type: ['theme', 'solid', 'gradient', 'image', 'video'].includes(payload.background.type) ? payload.background.type : 'theme',
        color: String(payload.background.color || '').trim() || undefined,
        color2: String(payload.background.color2 || '').trim() || undefined,
        angle: Math.max(0, Math.min(360, Number(payload.background.angle) || 160)),
        url: String(payload.background.url || '').trim() || undefined,
        position: String(payload.background.position || 'center').trim(),
        overlay: Math.max(0, Math.min(0.75, Number(payload.background.overlay) || 0)),
        pattern: ['none', 'shapes', 'grid', 'glow'].includes(payload.background.pattern) ? payload.background.pattern : 'none',
      }
    : { type: 'theme', pattern: 'none', overlay: 0.25 }

  const buttonStyle = payload.buttonStyle && typeof payload.buttonStyle === 'object'
    ? {
        shape: ['square', 'rounded', 'pill'].includes(payload.buttonStyle.shape) ? payload.buttonStyle.shape : 'rounded',
        variant: ['filled', 'outline', 'glass'].includes(payload.buttonStyle.variant) ? payload.buttonStyle.variant : 'filled',
        shadow: ['none', 'soft', 'solid'].includes(payload.buttonStyle.shadow) ? payload.buttonStyle.shadow : 'soft',
      }
    : { shape: 'rounded', variant: 'filled', shadow: 'soft' }

  const business = {
    slug,
    name,
    category: String(payload.category || '').trim(),
    description: String(payload.description || '').trim(),
    logo: String(payload.logo || '').trim(), // URL (R2 en el futuro o externa por ahora)
    theme: String(payload.theme || 'vibrant'),
    background,
    buttonStyle,
    // Colores personalizados (solo se usan si theme === 'custom')
    customColors:
      payload.customColors && typeof payload.customColors === 'object'
        ? {
            accent: String(payload.customColors.accent || '').trim() || undefined,
            bg: String(payload.customColors.bg || '').trim() || undefined,
            bgGradient: String(payload.customColors.bgGradient || '').trim() || undefined,
            text: String(payload.customColors.text || '').trim() || undefined,
          }
        : undefined,
    // Datos de contacto directo usados por los botones del perfil
    whatsapp: String(payload.whatsapp || '').trim(),
    googleReviewUrl: String(payload.googleReviewUrl || '').trim(),
    mapsUrl: String(payload.mapsUrl || '').trim(),
    wazeUrl: String(payload.wazeUrl || '').trim(),
    menuUrl: String(payload.menuUrl || '').trim(),
    // vCard
    phone: String(payload.phone || '').trim(),
    email: String(payload.email || '').trim(),
    website: String(payload.website || '').trim(),
    // Redes
    social: {
      instagram: String(payload.social?.instagram || '').trim(),
      tiktok: String(payload.social?.tiktok || '').trim(),
      facebook: String(payload.social?.facebook || '').trim(),
      linkedin: String(payload.social?.linkedin || '').trim(),
    },
    actionSettings,
    sections,
    updatedAt: Date.now(),
    createdAt: Number(payload.createdAt) || Date.now(),
  }

  return { ok: true, business }
}
