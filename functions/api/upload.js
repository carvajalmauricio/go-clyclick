// POST /api/upload
// Sube una imagen (logo) al bucket R2 y devuelve la URL pública servida por /api/assets/*.
// Requiere Cloudflare Access o Authorization: Bearer <ADMIN_SECRET_KEY>.
// Body: multipart/form-data con campos "file" (imagen) y "slug" (negocio).
import { json, isAuthorized, slugify } from './_lib.js'

const ALLOWED = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_VIDEO_BYTES = 25 * 1024 * 1024

export async function onRequestPost(context) {
  const { request, env } = context

  if (!(await isAuthorized(request, env))) {
    return json({ error: 'No autorizado' }, 401)
  }

  if (!env.ASSETS_BUCKET) {
    return json({ error: 'R2 no está configurado (binding ASSETS_BUCKET)' }, 500)
  }

  let form
  try {
    form = await request.formData()
  } catch {
    return json({ error: 'Se esperaba multipart/form-data' }, 400)
  }

  const file = form.get('file')
  const slug = slugify(form.get('slug') || 'general')
  const requestedKind = String(form.get('kind') || 'media')
  const kind = ['logo', 'thumbnail', 'background'].includes(requestedKind) ? requestedKind : 'media'

  if (!file || typeof file === 'string') {
    return json({ error: 'Falta el archivo "file"' }, 400)
  }

  const ext = ALLOWED[file.type]
  if (!ext) {
    return json({ error: `Tipo no permitido: ${file.type}. Usa PNG, JPG, WEBP, SVG, GIF, MP4 o WEBM.` }, 400)
  }

  const buffer = await file.arrayBuffer()
  const isVideo = file.type.startsWith('video/')
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (buffer.byteLength > maxBytes) {
    return json({ error: `El archivo supera ${isVideo ? 25 : 5} MB` }, 400)
  }

  const key = `businesses/${slug}/${kind}-${Date.now()}.${ext}`

  await env.ASSETS_BUCKET.put(key, buffer, {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  })

  // URL servida por nuestra función de assets (misma zona, cache Edge)
  const url = `/api/assets/${key}`

  return json({ ok: true, key, url }, 201)
}
