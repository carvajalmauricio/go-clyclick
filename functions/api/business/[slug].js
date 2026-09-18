// GET /api/business/:slug
// Lee el perfil de un negocio desde Workers KV (1 sola lectura por miss de caché)
// y responde con cabeceras de micro-caching en el Edge de Cloudflare.
export async function onRequestGet(context) {
  const { params, env } = context
  const slug = String(params.slug || '').toLowerCase().trim()

  if (!slug) {
    return json({ error: 'slug requerido' }, 400)
  }

  // env.BUSINESSES es el binding de KV definido en wrangler.toml
  const raw = await env.BUSINESSES.get(`business:${slug}`)

  if (!raw) {
    return json({ error: 'Negocio no encontrado' }, 404)
  }

  return new Response(raw, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Micro-caching en el Edge: 1a llamada consulta KV, el resto sale de caché
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
    },
  })
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
