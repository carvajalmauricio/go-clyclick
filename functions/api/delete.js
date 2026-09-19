// POST /api/delete
// Elimina un negocio de KV y lo quita del índice global.
// Requiere Cloudflare Access o Authorization: Bearer <ADMIN_SECRET_KEY>.
// Body: { "slug": "pizzeria-napoli" }
import {
  json,
  KEY_PREFIX,
  isAuthorized,
  slugify,
  readIndex,
  writeIndex,
  removeIndexEntry,
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

  const slug = slugify(payload?.slug)
  if (!slug) {
    return json({ error: 'slug requerido' }, 400)
  }

  const key = `${KEY_PREFIX}${slug}`
  const existing = await env.BUSINESSES.get(key)
  if (!existing) {
    return json({ error: 'Negocio no encontrado' }, 404)
  }

  await env.BUSINESSES.delete(key)

  const index = await readIndex(env)
  const updated = removeIndexEntry(index, slug)
  await writeIndex(env, updated)

  return json({ ok: true, slug, deleted: true })
}
