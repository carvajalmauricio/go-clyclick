// ---------------------------------------------------------------------------
// Utilidades compartidas por las Pages Functions de ClickClick Go
// ---------------------------------------------------------------------------

import { BANK_SECTION_ID, getProfileSections, normalizeBankAccounts, validateBankAccounts } from '../../src/utils/banking.js'
import { normalizeButtonColors } from '../../src/utils/buttonColors.js'
import { normalizeAnimation } from '../../src/utils/animations.js'
import { normalizeHeroSlides } from '../../src/utils/heroSlides.js'
import { normalizeButtonStyle, normalizeLayout } from '../../src/utils/buttonStyles.js'
import { LINK_ICONS, buildActions, normalizeLinkIcon, SOCIAL_NETWORK_KEYS, normalizeSocialOrder, normalizeSocialPosition } from '../../src/utils/links.js'
import { BACKGROUND_PATTERNS, THEMES } from '../../src/utils/themes.js'
import { normalizeHeader } from '../../src/utils/header.js'
import { normalizeFont } from '../../src/utils/fonts.js'
import { LANGUAGES } from '../../src/utils/i18n.js'

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

// Restringe la URL de un enlace personalizado a esquemas http(s) seguros.
// Un valor con esquema explícito distinto de http/https (mailto:, tel:, ftp:,
// javascript:, data:, etc.) se descarta (devuelve ''). Los valores sin esquema
// se conservan tal cual; buildCustomLinks les antepone https:// después.
// Nota: los builders de redes sociales manejan mailto:/tel: donde corresponde
// (email/teléfono); esta restricción solo aplica a los enlaces personalizados.
export function sanitizeLinkUrl(value) {
  const url = String(value || '').trim()
  if (!url) return ''
  // ¿Empieza con un esquema explícito "algo:"? (según RFC 3986: letra + [a-z0-9+.-])
  // Ojo: una URL sin esquema con puerto explícito ("dominio.com:8080/x") también
  // encaja con ese patrón. Para no descartar ese enlace legítimo, solo tratamos
  // el valor como "con esquema" cuando lo que sigue a los dos puntos NO son
  // dígitos (un puerto). Así "dominio.com:8080" se conserva y ensureHttp le
  // antepone https://, mientras que javascript:/mailto:/data:/ftp:/etc. se vacían.
  // Primero rechazamos esquemas peligrosos conocidos SIN importar lo que siga a
  // los dos puntos, para no depender de que ensureHttp los neutralice después
  // (defensa en profundidad). Cubre javascript:123, data:123, etc.
  const dangerous = /^(javascript|data|vbscript|file|blob|about|mailto|tel|ftp):/i
  if (dangerous.test(url)) return ''
  // Luego, cualquier otro esquema explícito distinto de http(s) también se vacía,
  // salvo el caso de una URL sin esquema con puerto ("dominio.com:8080/x"): ahí
  // lo que sigue a los dos puntos son dígitos (un puerto), así que se conserva y
  // ensureHttp le antepone https://.
  const schemeMatch = url.match(/^([a-z][a-z0-9+.-]*):(?![0-9])/i)
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase()
    if (scheme !== 'http' && scheme !== 'https') return ''
  }
  return url
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
  const background = business.background || {}
  // Perfiles con puerta de edad: el índice público no expone su portada ni su
  // imagen de fondo (coherente con _metadata.js, que no incrusta el negocio).
  const gated = business.ageGate?.enabled === true
  const entry = {
    slug: business.slug,
    name: business.name || '',
    category: business.category || '',
    logo: business.logo || '',
    updatedAt: business.updatedAt || Date.now(),
    // Datos visuales para la miniatura del listado del admin (#12).
    theme: business.theme || 'vibrant',
    customColors: business.customColors,
    autoTheme: business.autoTheme === true,
    lightTheme: business.lightTheme,
    darkTheme: business.darkTheme,
    background: {
      type: background.type || 'theme',
      color: background.color,
      color2: background.color2,
      angle: background.angle,
      pattern: background.pattern,
      url: background.type === 'image' && !gated ? background.url : undefined,
      overlay: background.overlay,
    },
    buttonStyle: business.buttonStyle,
    header: business.header ? { cover: gated ? '' : business.header.cover, logoShape: business.header.logoShape } : undefined,
    buttons: buildActions(business).length,
    ageGate: gated,
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
  const bankError = validateBankAccounts(payload.bankAccounts)
  if (bankError) return { ok: false, error: bankError }
  const actionSettings = Array.isArray(payload.actionSettings)
    ? payload.actionSettings
        .filter((item) => item && allowedActions.includes(item.type))
        .slice(0, allowedActions.length)
        .map((item, order) => ({
          type: item.type,
          label: String(item.label || '').trim().slice(0, 80),
          enabled: item.enabled !== false,
          order: Number.isFinite(Number(item.order)) ? Number(item.order) : order,
          layout: normalizeLayout(item.layout),
          thumbnail: String(item.thumbnail || '').trim(),
          sectionId: String(item.sectionId || '').trim().slice(0, 80),
          animation: normalizeAnimation(item.animation),
          colors: normalizeButtonColors(item.colors),
        }))
    : []

  // Enlaces personalizados ilimitados (más allá de los 7 tipos fijos).
  // Se descartan las entradas sin título y sin URL. Se limita a MAX_LINKS.
  const MAX_LINKS = 50
  const links = Array.isArray(payload.links)
    ? payload.links
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          id: String(item.id || `link-${Math.random().toString(36).slice(2, 10)}`).trim().slice(0, 80),
          title: String(item.title || '').trim().slice(0, 80),
          url: sanitizeLinkUrl(item.url).slice(0, 2048),
          icon: normalizeLinkIcon(item.icon),
          thumbnail: String(item.thumbnail || '').trim(),
          enabled: item.enabled !== false,
          order: Number.isFinite(Number(item.order)) ? Number(item.order) : 0,
          layout: normalizeLayout(item.layout),
          sectionId: String(item.sectionId || '').trim().slice(0, 80),
          animation: normalizeAnimation(item.animation),
          colors: normalizeButtonColors(item.colors),
        }))
        .filter((item) => item.title || item.url)
        .slice(0, MAX_LINKS)
        .map((item, order) => ({ ...item, order }))
    : []

  const sections = getProfileSections({ sections: Array.isArray(payload.sections)
    ? payload.sections.filter((section) => section && typeof section === 'object').slice(0, 13).map((section, index) => ({
        id: String(section?.id || `section-${index}`).trim().slice(0, 80),
        title: String(section?.title || (section?.id === BANK_SECTION_ID ? 'Datos Bancarios' : '')).trim().slice(0, 60),
      })).filter((section) => section.title)
    : [] })

  const background = payload.background && typeof payload.background === 'object'
    ? {
        type: ['theme', 'solid', 'gradient', 'image', 'video'].includes(payload.background.type) ? payload.background.type : 'theme',
        color: String(payload.background.color || '').trim() || undefined,
        color2: String(payload.background.color2 || '').trim() || undefined,
        angle: Math.max(0, Math.min(360, Number.isFinite(Number(payload.background.angle ?? 160)) ? Number(payload.background.angle ?? 160) : 160)),
        url: String(payload.background.url || '').trim() || undefined,
        position: String(payload.background.position || 'center').trim(),
        overlay: Math.max(0, Math.min(0.75, Number(payload.background.overlay) || 0)),
        blur: Math.max(0, Math.min(30, Number(payload.background.blur) || 0)),
        pattern: BACKGROUND_PATTERNS.some((option) => option.value === payload.background.pattern) ? payload.background.pattern : 'none',
      }
    : { type: 'theme', pattern: 'none', overlay: 0.25 }

  const buttonStyle = normalizeButtonStyle(payload.buttonStyle)

  // Redes sociales: se normaliza cada handle contra la lista de claves válidas
  // del catálogo SOCIAL_NETWORKS. Se descartan claves desconocidas. El objeto
  // siempre existe. socialOrder guarda el orden elegido (solo claves válidas,
  // sin duplicados) y socialPosition indica si la fila va arriba ('top', bajo
  // el hero, por defecto) o abajo ('bottom') del bloque de acciones.
  const socialInput = payload.social && typeof payload.social === 'object' ? payload.social : {}
  const social = {}
  for (const key of SOCIAL_NETWORK_KEYS) {
    social[key] = String(socialInput[key] || '').trim()
  }
  const socialOrder = normalizeSocialOrder(payload.socialOrder ?? socialInput.order)
  const socialPosition = normalizeSocialPosition(payload.socialPosition)

  // #8 Fuente personalizada: se valida contra el catálogo (inválida -> '').
  const font = normalizeFont(payload.font)

  // #16 Modo claro/oscuro automático: booleano + par de temas claro/oscuro.
  // Los ids se validan contra THEMES; los inválidos caen a valores sensatos.
  const autoTheme = payload.autoTheme === true || payload.autoTheme === 'true'
  const validThemeId = (value, fallback) =>
    typeof value === 'string' && Object.prototype.hasOwnProperty.call(THEMES, value) ? value : fallback
  const lightTheme = validThemeId(payload.lightTheme, 'minimal')
  const darkTheme = validThemeId(payload.darkTheme, 'vibrant')

  // #18 Multi-idioma: subconjunto de LANGUAGES sin duplicados; 'es' siempre
  // presente y por defecto. Overrides por idioma solo para name/description/category.
  const requestedLangs = Array.isArray(payload.languages) ? payload.languages : []
  const languages = ['es', ...requestedLangs
    .map((lang) => String(lang || '').toLowerCase().trim())
    .filter((lang) => LANGUAGES.includes(lang) && lang !== 'es')]
    .filter((lang, index, list) => list.indexOf(lang) === index)
  const i18nInput = payload.i18n && typeof payload.i18n === 'object' ? payload.i18n : {}
  const i18n = {}
  for (const lang of LANGUAGES) {
    if (lang === 'es') continue // el español vive en los campos raíz del negocio
    const entry = i18nInput[lang]
    if (!entry || typeof entry !== 'object') continue
    const override = {
      name: String(entry.name || '').trim(),
      description: String(entry.description || '').trim(),
      category: String(entry.category || '').trim(),
    }
    // Solo se conserva si el idioma está habilitado y aporta algún valor.
    if (languages.includes(lang) && (override.name || override.description || override.category)) {
      i18n[lang] = override
    }
  }

  // #19 Puerta de edad / contenido sensible: enabled + minAge (clamp 0-99) + mensaje.
  const ageGateInput = payload.ageGate && typeof payload.ageGate === 'object' ? payload.ageGate : {}
  const rawMinAge = Number(ageGateInput.minAge)
  const minAge = Number.isFinite(rawMinAge) ? Math.max(0, Math.min(99, Math.round(rawMinAge))) : 18
  const ageGate = {
    enabled: ageGateInput.enabled === true || ageGateInput.enabled === 'true',
    minAge,
    message: String(ageGateInput.message || '').trim().slice(0, 300),
  }

  const business = {
    slug,
    name,
    category: String(payload.category || '').trim(),
    description: String(payload.description || '').trim(),
    descriptionColor: /^#[0-9a-f]{6}$/i.test(String(payload.descriptionColor || '').trim())
      ? String(payload.descriptionColor).trim()
      : '',
    logo: String(payload.logo || '').trim(), // URL (R2 en el futuro o externa por ahora)
    // Slides que rotan en la tarjeta de presentación después del slide base
    heroSlides: normalizeHeroSlides(payload.heroSlides),
    // Cabecera: portada, forma/tamaño del logo y alineación
    header: normalizeHeader(payload.header),
    theme: String(payload.theme || 'vibrant'),
    // Fuente personalizada del perfil (#8)
    font,
    // Modo claro/oscuro automático (#16)
    autoTheme,
    lightTheme,
    darkTheme,
    // Multi-idioma ES/EN (#18)
    languages,
    i18n,
    // Puerta de edad / contenido sensible (#19)
    ageGate,
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
    social,
    socialOrder,
    socialPosition,
    actionSettings,
    links,
    bankAccounts: normalizeBankAccounts(payload.bankAccounts, sections),
    sections,
    updatedAt: Date.now(),
    createdAt: Number(payload.createdAt) || Date.now(),
  }

  return { ok: true, business }
}
