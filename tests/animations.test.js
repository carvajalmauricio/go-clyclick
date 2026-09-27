import assert from 'node:assert/strict'
import test from 'node:test'
import { onRequestPost } from '../functions/admin/api/save.js'
import { onRequestGet } from '../functions/api/business/[slug].js'
import { buildActions } from '../src/utils/links.js'

test('cada animación se conserva al guardar y cargar botones normales y cuentas bancarias', async () => {
  const records = new Map()
  const env = { ADMIN_SECRET_KEY: 'test-only', BUSINESSES: {
    get: async (key) => records.get(key) ?? null,
    put: async (key, value) => records.set(key, value),
  } }
  for (const animation of ['pulse', 'bounce', 'glow', 'none', 'unknown']) {
    const response = await onRequestPost({ env, request: new Request('https://example.com/admin/api/save', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-only', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Animaciones', isEdit: true, website: 'https://example.com',
        actionSettings: [{ type: 'website', animation }],
        bankAccounts: [{ id: 'bank-demo', bank: 'deuna', url: 'https://example.com/pago', animation }],
      }),
    }) })
    assert.ok(response.ok)
    const business = await (await onRequestGet({ env, params: { slug: 'animaciones' } })).json()
    const expected = animation === 'unknown' ? 'none' : animation
    assert.equal(business.actionSettings[0].animation, expected)
    assert.equal(business.bankAccounts[0].animation, expected)
    assert.deepEqual(buildActions(business).map((action) => action.animation), [expected, expected])
  }
})
