// Textos de la página de inicio compartidos por el servidor (etiquetas para
// compartir en redes, ver functions/api/_metadata.js) y el navegador.
export const SITE = {
  title: 'ClyClick · Tu negocio, a un toque de tus clientes',
  description: 'Creamos el perfil digital de tu negocio: WhatsApp, reseñas de Google, ubicación, menú y pagos en un solo enlace, con su código QR.',
  themeColor: '#0f0f12',
  image: '/og-home.jpg',
}

// Negocios para "Ejemplos reales" de la página de inicio: los que se pueden
// mostrar (sin desactivar y sin puerta de edad), más recientes primero.
export function pickShowcase(entries, max = 6) {
  return (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry && entry.slug && entry.showcase !== false && !entry.ageGate)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, max)
}

// "?negocio=pizzeria-napoli" (desde un enlace libre) → "Pizzeria Napoli".
export function nameFromQuery(search) {
  const raw = new URLSearchParams(search || '').get('negocio') || ''
  return raw
    .replace(/[-_]+/g, ' ')
    .replace(/[^\p{L}\p{N} .&'’]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
    .replace(/(^|\s)\p{L}/gu, (match) => match.toUpperCase())
}
