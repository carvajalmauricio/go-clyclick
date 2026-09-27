import test from 'node:test'
import assert from 'node:assert/strict'
import { addProfileMetadata, serializeBusinessScript } from '../functions/api/_metadata.js'

// ---------------------------------------------------------------------------
// Polyfill mínimo de HTMLRewriter para node:test.
//
// El entorno de Cloudflare Workers expone HTMLRewriter de forma nativa, pero
// node no. Este polyfill implementa solo lo que usa addProfileMetadata:
//   - .on('title'|'meta[name="description"]'|'head'|'body', { element })
//   - element.setInnerContent(text)
//   - element.setAttribute(name, value)
//   - element.append(html, { html: true })
// Trabaja sobre el texto HTML del Response y devuelve un nuevo Response.
// ---------------------------------------------------------------------------
class FakeHTMLRewriter {
  constructor() {
    this.handlers = []
  }

  on(selector, handler) {
    this.handlers.push([selector, handler])
    return this
  }

  transform(response) {
    const rewriter = this
    return {
      async text() {
        let html = await response.text()
        for (const [selector, handler] of rewriter.handlers) {
          html = applyHandler(html, selector, handler)
        }
        return html
      },
    }
  }
}

function applyHandler(html, selector, handler) {
  if (!handler || typeof handler.element !== 'function') return html

  if (selector === 'title') {
    return html.replace(/<title>[\s\S]*?<\/title>/i, (match) => {
      const inner = match.replace(/^<title>/i, '').replace(/<\/title>$/i, '')
      const element = makeElement(inner)
      handler.element(element)
      // setInnerContent (sin { html: true }) escapa el texto en HTMLRewriter real.
      const escaped = String(element.innerContent).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return `<title>${escaped}</title>`
    })
  }

  if (selector === 'meta[name="description"]') {
    return html.replace(/<meta name="description"[^>]*>/i, (match) => {
      const contentMatch = match.match(/content="([^"]*)"/i)
      const element = makeElement('', { content: contentMatch ? contentMatch[1] : '' })
      handler.element(element)
      // HTMLRewriter escapa el valor de los atributos; replicamos ese comportamiento.
      const escaped = String(element.attributes.content).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      return `<meta name="description" content="${escaped}">`
    })
  }

  if (selector === 'head' || selector === 'body') {
    const closing = `</${selector}>`
    const element = makeElement('')
    handler.element(element)
    const index = html.toLowerCase().indexOf(closing)
    if (index === -1) return html + element.appended.join('')
    return html.slice(0, index) + element.appended.join('') + html.slice(index)
  }

  return html
}

function makeElement(innerContent, attributes = {}) {
  return {
    innerContent,
    attributes,
    appended: [],
    setInnerContent(text) {
      this.innerContent = text
    },
    setAttribute(name, value) {
      this.attributes[name] = value
    },
    append(fragment) {
      this.appended.push(fragment)
    },
  }
}

const HTML_TEMPLATE = '<!doctype html><html lang="es"><head><title>ClyClick Go</title><meta name="description" content="default"></head><body><div id="root"></div></body></html>'

function makeEnv(records) {
  return {
    BUSINESSES: {
      get: async (key) => records.get(key) ?? null,
    },
  }
}

function makeHtmlResponse() {
  return new Response(HTML_TEMPLATE, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

test('serializeBusinessScript neutraliza </script> y otros caracteres peligrosos', () => {
  const serialized = serializeBusinessScript({
    slug: 'cafe',
    description: '</script><img src=x onerror=alert(1)> & < > tail',
  })
  // No debe quedar ningún '<', '>' ni '&' crudo que rompa la etiqueta script.
  assert.doesNotMatch(serialized, /</)
  assert.doesNotMatch(serialized, />/)
  assert.doesNotMatch(serialized, /&(?!amp)/)
  assert.match(serialized, /\\u003c\/script\\u003e/)
  // El contenido sigue siendo JSON válido tras revertir el escape del script.
  const revived = JSON.parse(serialized.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\u0026/g, '&'))
  assert.equal(revived.slug, 'cafe')
})

test('addProfileMetadata incrusta window.__BUSINESS__ para carga instantánea', async () => {
  const business = { slug: 'cafe-aurora', name: 'Café Aurora', description: 'Tu pausa favorita' }
  const records = new Map([[`business:cafe-aurora`, JSON.stringify(business)]])
  globalThis.HTMLRewriter = FakeHTMLRewriter
  try {
    const response = await addProfileMetadata(
      makeHtmlResponse(),
      new Request('https://example.test/cafe-aurora'),
      makeEnv(records),
    )
    const html = await response.text()
    assert.match(html, /window\.__BUSINESS__=/)
    assert.match(html, /"slug":"cafe-aurora"/)
    // El script incrustado va dentro del <body>, antes de cerrarlo.
    assert.match(html, /window\.__BUSINESS__=[\s\S]*<\/body>/)
  } finally {
    delete globalThis.HTMLRewriter
  }
})

test('addProfileMetadata escapa datos con </script> para no romper la etiqueta', async () => {
  const business = { slug: 'malicioso', name: 'Malo', description: '</script><script>alert(1)</script>' }
  const records = new Map([[`business:malicioso`, JSON.stringify(business)]])
  globalThis.HTMLRewriter = FakeHTMLRewriter
  try {
    const response = await addProfileMetadata(
      makeHtmlResponse(),
      new Request('https://example.test/malicioso'),
      makeEnv(records),
    )
    const html = await response.text()
    // El payload no debe contener un </script> real ni un <script> inyectado.
    const scriptOpenCount = (html.match(/<script>/gi) || []).length
    // Solo la etiqueta legítima que abre window.__BUSINESS__.
    assert.equal(scriptOpenCount, 1)
    assert.match(html, /\\u003c\/script\\u003e/)
    assert.doesNotMatch(html, /<\/script><script>alert/)
  } finally {
    delete globalThis.HTMLRewriter
  }
})

test('addProfileMetadata NO incrusta el negocio cuando la puerta de edad está activa', async () => {
  // Contenido sensible: el negocio no debe viajar en el HTML antes de confirmar
  // la edad. El cliente cae a la ruta de fetch tras confirmar en la puerta.
  const business = {
    slug: 'adulto',
    name: 'Bar Nocturno',
    description: 'Un bar',
    // Contenido sensible que NO debe viajar en el HTML: enlaces y datos internos.
    links: [{ id: 'x', title: 'ContenidoSensibleSecreto', url: 'https://ejemplo.com', enabled: true }],
    ageGate: { enabled: true, minAge: 18 },
  }
  const records = new Map([[`business:adulto`, JSON.stringify(business)]])
  globalThis.HTMLRewriter = FakeHTMLRewriter
  try {
    const response = await addProfileMetadata(
      makeHtmlResponse(),
      new Request('https://example.test/adulto'),
      makeEnv(records),
    )
    const html = await response.text()
    // No hay payload completo incrustado ni el contenido sensible en el código fuente.
    assert.doesNotMatch(html, /window\.__BUSINESS__/)
    assert.doesNotMatch(html, /ContenidoSensibleSecreto/)
    // Sí se incrusta la config no sensible de la puerta para pintarla al instante.
    assert.match(html, /window\.__AGE_GATE__/)
    assert.match(html, /"enabled":true/)
    // Los metadatos (título) sí se aplican, para SEO/preview de la ruta.
    assert.match(html, /Bar Nocturno/)
  } finally {
    delete globalThis.HTMLRewriter
  }
})

test('addProfileMetadata SÍ incrusta el negocio cuando la puerta de edad está desactivada', async () => {
  const business = { slug: 'normal', name: 'Café', description: 'Rico', ageGate: { enabled: false, minAge: 18 } }
  const records = new Map([[`business:normal`, JSON.stringify(business)]])
  globalThis.HTMLRewriter = FakeHTMLRewriter
  try {
    const response = await addProfileMetadata(
      makeHtmlResponse(),
      new Request('https://example.test/normal'),
      makeEnv(records),
    )
    const html = await response.text()
    assert.match(html, /window\.__BUSINESS__/)
    assert.match(html, /"slug":"normal"/)
  } finally {
    delete globalThis.HTMLRewriter
  }
})

test('addProfileMetadata no incrusta datos para rutas que no son perfiles', async () => {
  const records = new Map([[`business:cafe`, JSON.stringify({ slug: 'cafe', name: 'Café' })]])
  globalThis.HTMLRewriter = FakeHTMLRewriter
  try {
    const response = await addProfileMetadata(
      makeHtmlResponse(),
      new Request('https://example.test/api'),
      makeEnv(records),
    )
    const html = await response.text()
    assert.doesNotMatch(html, /window\.__BUSINESS__/)
  } finally {
    delete globalThis.HTMLRewriter
  }
})
