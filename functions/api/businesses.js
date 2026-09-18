// GET /api/businesses
// Devuelve el índice ligero de negocios para el panel admin (sin KV.list()).
// Público de lectura, pero devuelve solo metadatos (no datos sensibles).
import { json, readIndex } from './_lib.js'

export async function onRequestGet(context) {
  const { env } = context
  const index = await readIndex(env)
  // Ordenar por actualización más reciente
  index.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  return json(
    { ok: true, count: index.length, businesses: index },
    200,
    { 'Cache-Control': 'no-store' } // el admin siempre quiere datos frescos
  )
}
