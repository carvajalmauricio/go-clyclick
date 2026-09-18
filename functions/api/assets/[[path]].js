// GET /api/assets/*
// Sirve un objeto (imagen) desde el bucket R2 con cache de Edge de larga duración.
// Público de lectura.
export async function onRequestGet(context) {
  const { params, env } = context

  if (!env.ASSETS_BUCKET) {
    return new Response('R2 no configurado', { status: 500 })
  }

  // params.path es un array de segmentos con la ruta catch-all
  const parts = Array.isArray(params.path) ? params.path : [params.path]
  const key = parts.join('/')

  if (!key) {
    return new Response('Ruta requerida', { status: 400 })
  }

  const object = await env.ASSETS_BUCKET.get(key)
  if (!object) {
    return new Response('No encontrado', { status: 404 })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  // Cache Edge + navegador de larga duración (los nombres llevan timestamp -> inmutables)
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  return new Response(object.body, { headers })
}
