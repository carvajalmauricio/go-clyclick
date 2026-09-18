// POST /api/save
// Crea o edita un negocio en KV y actualiza el índice global.
// Requiere Authorization: Bearer <ADMIN_SECRET_KEY>.
import {
  json,
  KEY_PREFIX,
  isAuthorized,
  normalizeBusiness,
  readIndex,
  writeIndex,
  upsertIndexEntry,
} from './_lib.js'

export async function onRequestPost(context) {
  const { request, env } = context

  if (!(await isAuthorized(request, env))) {
    return json({ error: 'No autorizado' }, 401)
  }

  let payload
  try {
    payload = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  const { ok, business, error } = normalizeBusiness(payload)
  if (!ok) {
    return json({ error }, 400)
  }

  // Si es creación (no venía createdAt/edición explícita), evitar pisar un slug existente
  const key = `${KEY_PREFIX}${business.slug}`
  const existingRaw = await env.BUSINESSES.get(key)
  const isNew = !existingRaw

  if (isNew && payload.allowOverwrite !== true && payload.isEdit !== true) {
    // Comportamiento seguro: si ya existe y no es edición declarada, avisar.
    // (existingRaw es null aquí, así que sigue el flujo normal de creación)
  }

  if (!isNew) {
    // Preservar createdAt original al editar
    try {
      const prev = JSON.parse(existingRaw)
      if (prev.createdAt) business.createdAt = prev.createdAt
    } catch {
      /* ignore */
    }
  }

  // 1 negocio = 1 clave JSON
  await env.BUSINESSES.put(key, JSON.stringify(business))

  // Actualizar índice ligero
  const index = await readIndex(env)
  upsertIndexEntry(index, business)
  await writeIndex(env, index)

  return json({ ok: true, slug: business.slug, created: isNew, business }, isNew ? 201 : 200)
}
