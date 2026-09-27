import test from 'node:test'
import assert from 'node:assert/strict'
import { onRequestPost } from '../functions/api/save.js'
import { normalizeBusiness } from '../functions/api/_lib.js'
import { profileMetadata } from '../functions/api/_metadata.js'
import { getBackgroundStyle, THEMES } from '../src/utils/themes.js'

test('rechaza creaciones duplicadas sin modificar el negocio o índice; permite editar', async () => {
  const records = new Map()
  const env = { ADMIN_SECRET_KEY: 'test', BUSINESSES: {
    get: async (key) => records.get(key) ?? null,
    put: async (key, value) => records.set(key, value),
  } }
  const save = (payload) => onRequestPost({ env, request: new Request('https://example.test/api/save', {
    method: 'POST', headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  }) })
  const initial = { name: 'Original', slug: 'prueba', background: { type: 'image', url: '/fondo.png', blur: 18, overlay: .5 } }
  assert.equal((await save(initial)).status, 201)
  const before = [...records]
  assert.equal((await save({ ...initial, name: 'Duplicado', allowOverwrite: true })).status, 409)
  assert.deepEqual([...records], before)
  assert.equal((await save({ ...initial, name: 'Editado', isEdit: true })).status, 200)
  const stored = JSON.parse(records.get('business:prueba'))
  assert.equal(stored.name, 'Editado')
  assert.equal(stored.background.blur, 18)
  assert.equal(stored.background.overlay, .5)
})

test('preserva dirección cero y limita el desenfoque para imagen y video', () => {
  for (const type of ['image', 'video']) {
    for (const [blur, expected] of [[undefined, 0], [-4, 0], [15, 15], [100, 30], ['invalid', 0]]) {
      const { business } = normalizeBusiness({ name: 'Prueba', background: { type, angle: 0, blur } })
      assert.equal(business.background.blur, expected)
      assert.equal(business.background.angle, 0)
    }
  }
  assert.match(getBackgroundStyle(THEMES.vibrant, { type: 'gradient', angle: 0 }).background, /^linear-gradient\(0deg/)
})

test('metadatos escapan texto y convierten imagen y enlace a URLs absolutas', () => {
  const meta = profileMetadata({ name: 'Café "A" <script>', slug: 'cafe-a', description: 'A & B', logo: '/api/assets/logo.png' }, 'https://example.test')
  assert.match(meta.html, /Café &quot;A&quot; &lt;script&gt;/)
  assert.match(meta.html, /A &amp; B/)
  assert.match(meta.html, /https:\/\/example.test\/api\/assets\/logo.png/)
  assert.match(meta.html, /rel="canonical" href="https:\/\/example.test\/cafe-a"/)
  assert.doesNotMatch(profileMetadata({ name: 'Test', slug: 'test', logo: 'javascript:alert(1)' }, 'https://example.test').html, /javascript:/)
})
