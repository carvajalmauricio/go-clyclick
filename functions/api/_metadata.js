import { fontStylesheetUrl } from '../../src/utils/fonts.js'

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
}

// Serializa un objeto para incrustarlo dentro de una etiqueta <script> sin que
// su contenido pueda romper el contexto del script/HTML. Escapa '<', '>', '&'
// y los separadores de línea Unicode U+2028/U+2029 (que rompen literales JS).
// Así un dato con '</script>' o '<' queda neutralizado (p. ej. \u003c/script>).
export function serializeBusinessScript(business) {
  return JSON.stringify(business)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export function profileMetadata(business, origin) {
  const title = String(business.name || 'ClyClick Go')
  const description = String(business.description || `Conoce ${title}: contacto, enlaces y datos del negocio.`)
  const url = new URL(`/${encodeURIComponent(business.slug)}`, origin).href
  let image = new URL('/logo-clyclick.png', origin).href
  try {
    const candidate = new URL(business.logo || image, origin)
    if (['http:', 'https:'].includes(candidate.protocol)) image = candidate.href
  } catch { /* Keep the default image. */ }
  const tags = [
    ['property', 'og:type', 'website'], ['property', 'og:site_name', 'ClyClick Go'],
    ['property', 'og:title', title], ['property', 'og:description', description],
    ['property', 'og:url', url], ['property', 'og:image', image],
    ['name', 'twitter:card', 'summary'], ['name', 'twitter:title', title],
    ['name', 'twitter:description', description], ['name', 'twitter:image', image],
  ].map(([attribute, key, value]) => `<meta ${attribute}="${key}" content="${escapeHtml(value)}">`).join('')
  // Fuente personalizada (#8): se precarga en el primer pintado solo si hay una
  // seleccionada, con display=swap. Si no hay, no se añade ningún <link>.
  const fontHref = fontStylesheetUrl(business.font)
  const fontLink = fontHref ? `<link rel="stylesheet" href="${escapeHtml(fontHref)}">` : ''
  return { title, description, html: `${tags}<link rel="canonical" href="${escapeHtml(url)}">${fontLink}` }
}

export async function addProfileMetadata(response, request, env) {
  const url = new URL(request.url)
  const match = url.pathname.match(/^\/([a-z0-9-]+)\/?$/i)
  if (!match || ['admin', 'api'].includes(match[1].toLowerCase()) || !['GET', 'HEAD'].includes(request.method)
    || !response.ok || !response.headers.get('Content-Type')?.includes('text/html') || !env.BUSINESSES) return response
  const raw = await env.BUSINESSES.get(`business:${match[1].toLowerCase()}`)
  if (!raw) return response
  const business = JSON.parse(raw)
  const metadata = profileMetadata(business, url.origin)
  // Incrusta el negocio completo para que el cliente pinte el perfil al
  // instante (sin fetch ni skeleton) al escanear el QR. El payload va escapado
  // para no poder romper la etiqueta <script>.
  const dataScript = `<script>window.__BUSINESS__=${serializeBusinessScript(business)};</script>`
  return new HTMLRewriter()
    .on('title', { element(element) { element.setInnerContent(metadata.title) } })
    .on('meta[name="description"]', { element(element) { element.setAttribute('content', metadata.description) } })
    .on('head', { element(element) { element.append(metadata.html, { html: true }) } })
    .on('body', { element(element) { element.append(dataScript, { html: true }) } })
    .transform(response)
}
