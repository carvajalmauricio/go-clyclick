// GET /admin/api/session
// Confirma la sesión de Cloudflare Access y expone únicamente la identidad
// mínima que necesita el panel. Evita depender de /cdn-cgi/access/get-identity,
// que queda fuera de una aplicación de Access limitada a la ruta /admin.
import { authorize, json } from '../../api/_lib.js'

export async function onRequestGet(context) {
  const auth = await authorize(context.request, context.env)

  if (!auth.ok) {
    return json({ error: 'No autorizado' }, 401, { 'Cache-Control': 'no-store' })
  }

  return json(
    { ok: true, email: auth.email || '' },
    200,
    { 'Cache-Control': 'no-store' }
  )
}
