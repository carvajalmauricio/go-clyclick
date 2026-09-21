import { authorize, json } from './api/_lib.js'

// Middleware global:
// - aplica defensa en profundidad al panel administrativo;
// - añade CORS básico a las respuestas de la API.
export async function onRequest(context) {
  const { request, next, env } = context
  const url = new URL(request.url)

  // Cloudflare Access protege /admin en el dominio personalizado, pero el
  // dominio directo *.pages.dev no comparte esa aplicación de Access. Esta
  // validación en el origen impide que cualquiera de esos accesos alternativos
  // llegue a servir la SPA administrativa sin un JWT válido.
  if (isAdminPath(url.pathname) && !isLocalDevelopment(url.hostname)) {
    const auth = await authorize(request, env)
    if (!auth.ok) {
      return json(
        { error: 'No autorizado. Ingresa al panel desde https://go.clyclick.online/admin.' },
        401,
        {
          'Cache-Control': 'no-store',
          'WWW-Authenticate': 'Cloudflare-Access',
        }
      )
    }
  }

  // Preflight CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }

  const response = await next()
  const newHeaders = new Headers(response.headers)
  for (const [key, value] of Object.entries(corsHeaders())) {
    newHeaders.set(key, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}

function isAdminPath(pathname) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

function isLocalDevelopment(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}
