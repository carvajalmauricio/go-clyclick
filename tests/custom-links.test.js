import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeBusiness } from '../functions/api/_lib.js'
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
