import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeBusiness, sanitizeLinkUrl } from '../functions/api/_lib.js'
import { onRequestPost } from '../functions/admin/api/save.js'
import { onRequestGet } from '../functions/api/business/[slug].js'
import { buildActions, buildCustomLinks } from '../src/utils/links.js'

function makeEnv() {
  const records = new Map()
  const env = {
    ADMIN_SECRET_KEY: 'test-only',
    BUSINESSES: {
      get: async (key) => records.get(key) ?? null,
      put: async (key, value) => records.set(key, value),
    },
  }
  const save = (data) =>
    onRequestPost({
      env,
      request: new Request('https://example.com/admin/api/save', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-only', 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    })
  return { env, save }
}

test('los enlaces personalizados sobreviven al guardar y leer (round-trip)', async () => {
  const { env, save } = makeEnv()
  const payload = {
    name: 'Tienda Uno',
    links: [
      { id: 'a', title: 'Catálogo', url: 'tienda.com/catalogo', icon: 'menu', layout: 'grid', enabled: true },
      { id: 'b', title: 'Reservas', url: 'https://reservas.com', icon: 'link', layout: 'icon', sectionId: 'promos', enabled: true },
    ],
  }
  assert.equal((await save(payload)).status, 201)
  const business = await (await onRequestGet({ env, params: { slug: 'tienda-uno' } })).json()
  assert.equal(business.links.length, 2)
  assert.equal(business.links[0].title, 'Catálogo')
  assert.equal(business.links[0].url, 'tienda.com/catalogo')
  assert.equal(business.links[0].layout, 'grid')
  assert.equal(business.links[1].layout, 'icon')
  assert.equal(business.links[0].order, 0)
  assert.equal(business.links[1].order, 1)
})

test('se descartan los enlaces sin título ni URL', () => {
  const result = normalizeBusiness({
    name: 'Negocio',
    links: [
      { title: '', url: '' },
      { title: '  ', url: '   ' },
      { title: 'Válido', url: '' },
      { title: '', url: 'algo.com' },
    ],
  })
  assert.equal(result.ok, true)
  assert.equal(result.business.links.length, 2)
  assert.deepEqual(result.business.links.map((l) => l.title), ['Válido', ''])
})

test('normalizeBusiness descarta esquemas de URL peligrosos en enlaces personalizados', () => {
  const result = normalizeBusiness({
    name: 'Negocio',
    links: [
      { title: 'JS', url: 'javascript:alert(1)' },
      { title: 'Mailto', url: 'mailto:hola@ejemplo.com' },
      { title: 'Tel', url: 'tel:+593999' },
      { title: 'FTP', url: 'ftp://archivos.ejemplo.com' },
      { title: 'Data', url: 'data:text/html,<script>alert(1)</script>' },
      { title: 'HTTPS', url: 'https://ejemplo.com' },
      { title: 'HTTP', url: 'http://ejemplo.com' },
      { title: 'SinEsquema', url: 'ejemplo.com/x' },
    ],
  })
  assert.equal(result.ok, true)
  const byTitle = Object.fromEntries(result.business.links.map((l) => [l.title, l.url]))
  // Los esquemas no http(s) quedan en blanco (el enlace se conserva por título).
  assert.equal(byTitle['JS'], '')
  assert.equal(byTitle['Mailto'], '')
  assert.equal(byTitle['Tel'], '')
  assert.equal(byTitle['FTP'], '')
  assert.equal(byTitle['Data'], '')
  // http(s) y valores sin esquema se conservan.
  assert.equal(byTitle['HTTPS'], 'https://ejemplo.com')
  assert.equal(byTitle['HTTP'], 'http://ejemplo.com')
  assert.equal(byTitle['SinEsquema'], 'ejemplo.com/x')
})

test('sanitizeLinkUrl conserva URLs sin esquema con puerto explícito (host:port)', () => {
  // Un puerto ("dominio:8080") no debe confundirse con un esquema y vaciarse.
  assert.equal(sanitizeLinkUrl('example.com:8080/path'), 'example.com:8080/path')
  assert.equal(sanitizeLinkUrl('mydomain.com:8443/promo'), 'mydomain.com:8443/promo')
  // Los esquemas peligrosos siguen quedando en blanco.
  assert.equal(sanitizeLinkUrl('javascript:alert(1)'), '')
  assert.equal(sanitizeLinkUrl('mailto:x@y.com'), '')
  assert.equal(sanitizeLinkUrl('data:text/html,<script>'), '')
  assert.equal(sanitizeLinkUrl('ftp://archivos.com'), '')
  // http(s) explícito se conserva.
  assert.equal(sanitizeLinkUrl('https://ejemplo.com'), 'https://ejemplo.com')
  assert.equal(sanitizeLinkUrl('http://ejemplo.com:9000'), 'http://ejemplo.com:9000')
})

test('buildCustomLinks nunca produce un href con esquema peligroso', () => {
  // Simula un enlace ya normalizado: la URL peligrosa fue vaciada, así que no
  // aparece en las acciones (queda excluido por no tener URL).
  const normalized = normalizeBusiness({
    name: 'Negocio',
    links: [
      { id: 'js', title: 'Malo', url: 'javascript:alert(1)', enabled: true },
      { id: 'ok', title: 'Bueno', url: 'https://ejemplo.com', enabled: true },
    ],
  }).business
  const built = buildCustomLinks(normalized)
  assert.equal(built.length, 1)
  assert.equal(built[0].url, 'https://ejemplo.com')
  assert.ok(built.every((link) => /^https?:\/\//i.test(link.url)))
})

test('un layout inválido vuelve a classic', () => {
  const result = normalizeBusiness({
    name: 'Negocio',
    links: [{ title: 'X', url: 'x.com', layout: 'inexistente' }],
  })
  assert.equal(result.business.links[0].layout, 'classic')
})

test('buildCustomLinks excluye deshabilitados y sin URL, incluye habilitados con URL', () => {
  const business = {
    links: [
      { id: '1', title: 'Activo', url: 'activo.com', enabled: true },
      { id: '2', title: 'Apagado', url: 'apagado.com', enabled: false },
      { id: '3', title: 'Sin url', url: '', enabled: true },
    ],
  }
  const built = buildCustomLinks(business)
  assert.equal(built.length, 1)
  assert.equal(built[0].key, 'link-1')
  assert.equal(built[0].url, 'https://activo.com')
  assert.equal(built[0].custom, true)
})

test('buildActions sigue devolviendo los 7 tipos fijos primero y luego los enlaces', () => {
  const business = {
    name: 'Café',
    whatsapp: '593999999999',
    website: 'example.com',
    actionSettings: [
      { type: 'whatsapp', animation: 'pulse' },
      { type: 'website', animation: 'bounce', layout: 'featured' },
    ],
    links: [{ id: 'z', title: 'Extra', url: 'extra.com', enabled: true }],
  }
  const keys = buildActions(business).map((a) => a.key)
  // Los tipos fijos activos aparecen primero; el enlace personalizado al final.
  assert.equal(keys[keys.length - 1], 'link-z')
  assert.ok(keys.indexOf('whatsapp') < keys.indexOf('link-z'))
  assert.ok(keys.indexOf('website') < keys.indexOf('link-z'))
  assert.ok(!keys.slice(0, keys.indexOf('link-z')).includes('link-z'))
})

test('el assert existente de 7 tipos de buildActions sigue pasando sin enlaces', () => {
  const business = {
    name: 'Café Aurora',
    whatsapp: '593999999999',
    website: 'example.com',
    phone: '+593999999999',
    actionSettings: [
      { type: 'whatsapp', animation: 'pulse' },
      { type: 'website', animation: 'bounce', layout: 'featured' },
      { type: 'contact', animation: 'none' },
    ],
  }
  assert.deepEqual(buildActions(business).map(({ key, animation }) => [key, animation]), [
    ['whatsapp', 'pulse'], ['website', 'bounce'], ['contact', 'none'],
  ])
})
