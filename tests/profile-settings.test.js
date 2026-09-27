import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeBusiness } from '../functions/api/_lib.js'
import { onRequestPost } from '../functions/admin/api/save.js'
import { onRequestGet } from '../functions/api/business/[slug].js'
import { buildActions } from '../src/utils/links.js'

test('el perfil público conserva el color y las animaciones tras guardar y editar', async () => {
  const records = new Map()
  const env = {
    ADMIN_SECRET_KEY: 'test-only',
    BUSINESSES: {
      get: async (key) => records.get(key) ?? null,
      put: async (key, value) => records.set(key, value),
    },
  }
  const payload = {
    name: 'Café Aurora',
    description: 'Tu pausa favorita',
    descriptionColor: '#ffcc66',
    whatsapp: '593999999999',
    website: 'example.com',
    actionSettings: [
      { type: 'whatsapp', animation: 'pulse' },
      { type: 'website', animation: 'bounce', layout: 'featured' },
      { type: 'contact', animation: 'none' },
    ],
  }
  async function save(data) {
    return onRequestPost({
      env,
      request: new Request('https://example.com/admin/api/save', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-only', 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    })
  }
  assert.equal((await save(payload)).status, 201)
  const response = await onRequestGet({ env, params: { slug: 'cafe-aurora' } })
  const business = await response.json()
  assert.equal(business.descriptionColor, '#ffcc66')
  assert.deepEqual(buildActions(business).map(({ key, animation }) => [key, animation]), [
    ['whatsapp', 'pulse'], ['website', 'bounce'], ['contact', 'none'],
  ])
  assert.equal((await save({ ...business, descriptionColor: '', isEdit: true })).status, 200)
  const updated = await (await onRequestGet({ env, params: { slug: business.slug } })).json()
  assert.equal(updated.descriptionColor, '')
  assert.deepEqual(updated.actionSettings, business.actionSettings)
})

test('los perfiles antiguos y colores inválidos usan el color del tema', () => {
  for (const descriptionColor of [undefined, null, '', 'invalid', '#xyzxyz', '#123456; color:red']) {
    const result = normalizeBusiness({ name: 'Negocio', descriptionColor })
    assert.equal(result.ok, true)
    assert.equal(result.business.descriptionColor, '')
  }
  assert.equal(normalizeBusiness({ name: 'Negocio', descriptionColor: ' #AbC123 ' }).business.descriptionColor, '#AbC123')
})
