// POST /api/leads
// Recibe una solicitud de perfil desde la página de inicio (público).
// Protecciones: mismo origen, tamaño máximo, campo trampa para bots, tiempo
// mínimo de llenado, validación de datos y límites por conexión y por día
// que fallan cerrados (protegen la cuota de escrituras de KV: como mucho
// 3 escrituras por solicitud y DAILY_LIMIT solicitudes al día). Un script
// decidido puede agotar el cupo diario del formulario (WhatsApp sigue
// disponible); para frenarlo de verdad: Turnstile o una regla WAF.
// Cada solicitud aceptada se guarda como `lead:<id>` con su resumen en los
// metadatos (ver leads.js).
import { json } from './_lib.js'
import { LEAD_KEY_PREFIX, MIN_FILL_MS, createLeadRecord, leadMetadata, validateLead } from '../../src/utils/leads.js'

export const MAX_BODY_BYTES = 4096
export const PER_IP_LIMIT = 5
export const PER_IP_WINDOW_S = 3600
export const DAILY_LIMIT = 150

export const RETRY_DELAY_MS = 1100

const BUSY_MESSAGE = 'Recibimos varias solicitudes desde tu conexión. Inténtalo más tarde o escríbenos por WhatsApp.'
const FULL_MESSAGE = 'No pudimos recibir tu solicitud en este momento. Escríbenos por WhatsApp y te atendemos enseguida.'
const RETRY_MESSAGE = 'Estamos recibiendo muchas solicitudes. Inténtalo de nuevo en unos segundos o escríbenos por WhatsApp.'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function sameHost(origin, requestUrl) {
  try {
    return new URL(origin).host === new URL(requestUrl).host
  } catch {
    return false
  }
}

// Huella de la conexión (no se guarda la IP en claro).
async function connectionKey(request, env) {
  const ip = request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    || 'local'
  const data = new TextEncoder().encode(`${env.LEAD_SALT || 'clyclick-leads'}:${ip}`)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data))
  return [...digest.slice(0, 12)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function readJson(kv, key) {
  try {
    const raw = await kv.get(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.BUSINESSES) return json({ error: FULL_MESSAGE }, 503)

  const origin = request.headers.get('Origin')
  if (origin && !sameHost(origin, request.url)) {
    return json({ error: 'Origen no permitido' }, 403)
  }

  if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY_BYTES) {
    return json({ error: 'La solicitud es demasiado grande.' }, 413)
  }
  let text
  try {
    text = await request.text()
  } catch {
    return json({ error: 'Datos inválidos' }, 400)
  }
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return json({ error: 'La solicitud es demasiado grande.' }, 413)
  }
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    return json({ error: 'Datos inválidos' }, 400)
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return json({ error: 'Datos inválidos' }, 400)
  }

  // Campo trampa: los bots lo llenan. Se responde como si todo fuera bien,
  // pero no se guarda nada.
  if (String(payload.website || '').trim()) return json({ ok: true }, 201)

  const elapsed = Number(payload.elapsed)
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) {
    return json({ error: 'Revisa tus datos y vuelve a enviar la solicitud.' }, 400)
  }

  const result = validateLead(payload)
  if (!result.ok) return json({ error: 'Revisa los datos marcados.', fields: result.errors }, 400)

  const kv = env.BUSINESSES
  const now = Date.now()
  const rateKey = `ratelimit:lead:${await connectionKey(request, env)}`
  const dayKey = `ratelimit:leads:${new Date(now).toISOString().slice(0, 10)}`
  const [rate, dayRaw] = await Promise.all([readJson(kv, rateKey), kv.get(dayKey).catch(() => null)])
  const windowOpen = rate && Number(rate.reset) > now
  const used = windowOpen ? Number(rate.count) || 0 : 0
  if (used >= PER_IP_LIMIT) {
    return json({ error: BUSY_MESSAGE }, 429, { 'Retry-After': String(Math.ceil((Number(rate.reset) - now) / 1000)) })
  }
  let today = Number(dayRaw) || 0
  if (today >= DAILY_LIMIT) return json({ error: FULL_MESSAGE }, 429)

  // Los contadores se escriben ANTES de guardar la solicitud y, si KV no los
  // acepta, la solicitud se rechaza (fallan cerrados). KV admite una sola
  // escritura por segundo en la misma clave, así que una ráfaga no los salta:
  // como mucho entra una solicitud por segundo. El contador diario se
  // reintenta una vez (con el valor actualizado) por si coinciden dos
  // personas en el mismo segundo.
  const reset = windowOpen ? Number(rate.reset) : now + PER_IP_WINDOW_S * 1000
  try {
    await kv.put(rateKey, JSON.stringify({ count: used + 1, reset }), { expirationTtl: Math.max(60, Math.ceil((reset - now) / 1000)) })
  } catch {
    return json({ error: RETRY_MESSAGE }, 429, { 'Retry-After': '5' })
  }
  try {
    await kv.put(dayKey, String(today + 1), { expirationTtl: 2 * 24 * 3600 })
  } catch {
    await sleep(RETRY_DELAY_MS)
    try {
      today = Number(await kv.get(dayKey)) || 0
      if (today >= DAILY_LIMIT) return json({ error: FULL_MESSAGE }, 429)
      await kv.put(dayKey, String(today + 1), { expirationTtl: 2 * 24 * 3600 })
    } catch {
      return json({ error: RETRY_MESSAGE }, 429, { 'Retry-After': '5' })
    }
  }

  const record = createLeadRecord(result.lead, now)
  await kv.put(`${LEAD_KEY_PREFIX}${record.id}`, JSON.stringify(record), { metadata: leadMetadata(record) })
  return json({ ok: true, id: record.id }, 201)
}
