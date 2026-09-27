function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
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
  return { title, description, html: `${tags}<link rel="canonical" href="${escapeHtml(url)}">` }
}

export async function addProfileMetadata(response, request, env) {
  const url = new URL(request.url)
  const match = url.pathname.match(/^\/([a-z0-9-]+)\/?$/i)
  if (!match || ['admin', 'api'].includes(match[1].toLowerCase()) || !['GET', 'HEAD'].includes(request.method)
    || !response.ok || !response.headers.get('Content-Type')?.includes('text/html') || !env.BUSINESSES) return response
  const raw = await env.BUSINESSES.get(`business:${match[1].toLowerCase()}`)
  if (!raw) return response
  const metadata = profileMetadata(JSON.parse(raw), url.origin)
  return new HTMLRewriter()
    .on('title', { element(element) { element.setInnerContent(metadata.title) } })
    .on('meta[name="description"]', { element(element) { element.setAttribute('content', metadata.description) } })
    .on('head', { element(element) { element.append(metadata.html, { html: true }) } })
    .transform(response)
}
