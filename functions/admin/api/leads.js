// GET  /admin/api/leads            → lista las solicitudes (más recientes primero)
// POST /admin/api/leads { action } → 'update' (estado, nota, perfil creado) o 'delete'
// Protegido por Cloudflare Access (middleware) y comprobado de nuevo aquí.
import { authorize, json } from '../../api/_lib.js'
import { LEAD_ID_PATTERN, LEAD_KEY_PREFIX, applyLeadUpdate, leadFromMetadata, leadMetadata } from '../../../src/utils/leads.js'

const NO_STORE = { 'Cache-Control': 'no-store' }
const MAX_PAGES = 5 // hasta 5000 solicitudes
const MAX_FULL_READS = 100

// Los ids empiezan con el tiempo invertido: list() devuelve primero las más
// recientes, así que si hay más de MAX_PAGES páginas se omiten las más viejas.
export async function listLeads(kv) {
  const keys = []
  let cursor
  let truncated = false
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await kv.list({ prefix: LEAD_KEY_PREFIX, cursor, limit: 1000 })
    keys.push(...(result.keys || []))
    if (result.list_complete || !result.cursor) break
    cursor = result.cursor
    if (page === MAX_PAGES - 1) truncated = true
  }

  const leads = []
  const pending = []
  for (const key of keys) {
    const id = key.name.slice(LEAD_KEY_PREFIX.length)
    const { complete, lead } = leadFromMetadata(id, key.metadata)
    if (complete) leads.push(lead)
    else pending.push({ id, lead })
  }

  // Solicitudes cuyo mensaje o nota no cabe en los metadatos: se lee la clave.
  const toRead = pending.slice(0, MAX_FULL_READS)
  for (let index = 0; index < toRead.length; index += 10) {
    const batch = await Promise.all(toRead.slice(index, index + 10).map(async ({ id, lead }) => {
      try {
        const raw = await kv.get(`${LEAD_KEY_PREFIX}${id}`)
        return raw ? { ...JSON.parse(raw), id } : null // null: se borró entre list() y get()
      } catch {
        return lead
      }
    }))
    leads.push(...batch.filter(Boolean))
  }
  for (const { lead } of pending.slice(MAX_FULL_READS)) if (lead) leads.push(lead)

  return { leads: leads.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), truncated }
}

export async function onRequestGet({ request, env }) {
  const auth = await authorize(request, env)
  if (!auth.ok) return json({ error: 'No autorizado' }, 401, NO_STORE)
  const { leads, truncated } = await listLeads(env.BUSINESSES)
  return json({ ok: true, count: leads.length, truncated, leads }, 200, NO_STORE)
}

export async function onRequestPost({ request, env }) {
  const auth = await authorize(request, env)
  if (!auth.ok) return json({ error: 'No autorizado' }, 401, NO_STORE)

  let payload
  try {
    payload = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400, NO_STORE)
  }
  const id = String(payload?.id || '')
  if (!LEAD_ID_PATTERN.test(id)) return json({ error: 'Solicitud inválida' }, 400, NO_STORE)
  const key = `${LEAD_KEY_PREFIX}${id}`

  if (payload.action === 'delete') {
    await env.BUSINESSES.delete(key)
    return json({ ok: true }, 200, NO_STORE)
  }
  if (payload.action !== 'update') return json({ error: 'Acción no válida' }, 400, NO_STORE)

  const raw = await env.BUSINESSES.get(key)
  if (!raw) return json({ error: 'La solicitud ya no existe.' }, 404, NO_STORE)
  let lead
  try {
    lead = JSON.parse(raw)
  } catch {
    return json({ error: 'La solicitud está dañada.' }, 500, NO_STORE)
  }
  const next = applyLeadUpdate({ ...lead, id }, payload.changes || {})
  await env.BUSINESSES.put(key, JSON.stringify(next), { metadata: leadMetadata(next) })
  return json({ ok: true, lead: next }, 200, NO_STORE)
}
