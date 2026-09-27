import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeBusiness } from '../functions/api/_lib.js'
import { onRequestPost } from '../functions/admin/api/save.js'
import { onRequestGet } from '../functions/api/business/[slug].js'
import { BANK_SECTION_ID, buildBankActions, getProfileSections, paymentUrl } from '../src/utils/banking.js'
import { buildActions } from '../src/utils/links.js'
import { getButtonColors } from '../src/utils/buttonColors.js'
import { THEMES } from '../src/utils/themes.js'

test('guardar y volver a cargar conserva cuentas del mismo banco, enlaces y colores independientes', async () => {
  const store = new Map()
  const env = { ADMIN_SECRET_KEY: 'test-only', BUSINESSES: {
    get: async (key) => store.get(key) ?? null,
    put: async (key, value) => store.set(key, value),
  } }
  const payload = {
    name: 'Prueba bancaria', whatsapp: '593999999999',
    actionSettings: [{ type: 'whatsapp', colors: { background: '#123456', text: '#ffffff', border: '#abcdef' } }],
    sections: [{ id: 'pagos', title: 'Otras cuentas' }],
    bankAccounts: [
      { id: 'g1', bank: 'guayaquil', holder: 'Titular uno', number: '0012345678', accountType: 'checking', colors: { background: '#ff00aa' }, animation: 'bounce' },
      { id: 'g2', bank: 'guayaquil', holder: 'Titular dos', number: '0098765432', url: 'https://example.com/pagar?cuenta=2', sectionId: 'pagos', qrImage: 'must-not-persist' },
      { id: 'd1', bank: 'deuna', url: 'https://example.com/deuna' },
      { id: 'p1', bank: 'produbanco', url: 'https://example.com/produbanco' },
      { id: 'p2', bank: 'pacifico', holder: 'Titular tres', number: '00001234', enabled: false },
      { id: 'pi1', bank: 'pichincha', holder: 'Titular cuatro', number: '00004321' },
    ],
  }
  const response = await onRequestPost({ env, request: new Request('https://example.com/admin/api/save', {
    method: 'POST', headers: { Authorization: 'Bearer test-only', 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  }) })
  assert.equal(response.status, 201)
  const saved = await (await onRequestGet({ env, params: { slug: 'prueba-bancaria' } })).json()
  assert.equal(saved.bankAccounts.length, 6)
  assert.equal(saved.bankAccounts[0].number, '0012345678')
  assert.equal(saved.bankAccounts[1].number, '0098765432')
  assert.equal(saved.bankAccounts[1].qrImage, undefined)
  assert.deepEqual(saved.sections.map(({ id }) => id), ['pagos', BANK_SECTION_ID])
  const actions = buildActions(saved)
  assert.deepEqual(actions.find(({ key }) => key === 'whatsapp').colors, payload.actionSettings[0].colors)
  const bankActions = actions.filter(({ bank }) => bank)
  assert.equal(bankActions.length, 5)
  assert.equal(bankActions[0].url, '')
  assert.equal(bankActions[0].bankAccount.holder, 'Titular uno')
  assert.equal(bankActions[0].sectionId, BANK_SECTION_ID)
  assert.equal(bankActions[1].url, payload.bankAccounts[1].url)
  assert.equal(bankActions[1].sectionId, 'pagos')
  assert.equal(bankActions[4].bank, 'pichincha')
})

test('enlaces inválidos, bancos desconocidos y cuentas incompletas no se guardan', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,test', '//example.com', 'https://', 'https://user:pass@example.com', '00020101021234567890']) {
    assert.equal(paymentUrl(url), '')
    assert.equal(normalizeBusiness({ name: 'Prueba', bankAccounts: [{ id: 'a', bank: 'deuna', url }] }).ok, false)
  }
  for (const account of [null, { id: 'a', bank: 'unknown' }, { id: 'a', bank: 'guayaquil' }, { id: 'a', bank: 'pacifico', url: 'https://example.com' }, { id: 'a', bank: 'pichincha', url: 'https://example.com' }]) {
    assert.equal(normalizeBusiness({ name: 'Prueba', bankAccounts: [account] }).ok, false)
  }
  const account = { id: 'same', bank: 'deuna', url: 'https://example.com' }
  assert.equal(normalizeBusiness({ name: 'Prueba', bankAccounts: [account, account] }).ok, false)
})

test('la sección bancaria aparece una vez y las cuentas sin sección vuelven a ella', () => {
  assert.deepEqual(getProfileSections({}), [{ id: BANK_SECTION_ID, title: 'Datos Bancarios' }])
  const existing = { sections: [{ id: BANK_SECTION_ID, title: 'Transferencias' }] }
  assert.deepEqual(getProfileSections(existing), existing.sections)
  const normalized = normalizeBusiness({ name: 'Prueba', ...existing, bankAccounts: [{ id: 'a', bank: 'pacifico', holder: 'Titular', number: '0001', sectionId: 'deleted' }] }).business
  assert.equal(normalized.bankAccounts[0].sectionId, BANK_SECTION_ID)
  assert.equal(buildBankActions(normalized)[0].sectionId, BANK_SECTION_ID)
  assert.equal(buildBankActions({ bankAccounts: [{ id: 'draft', bank: 'deuna' }] }).length, 0)
})

test('colores por botón prevalecen en todos los acabados y pueden restablecerse', () => {
  for (const variant of ['filled', 'outline', 'glass']) {
    const custom = { background: '#123456', text: '#ffffff', border: '#abcdef' }
    const rendered = getButtonColors({ primary: true, colors: custom }, THEMES.vibrant, { variant })
    assert.deepEqual(rendered, custom)
    const restored = getButtonColors({ primary: true, colors: {} }, THEMES.vibrant, { variant })
    assert.notEqual(restored.background, custom.background)
  }
  const saved = normalizeBusiness({ name: 'Prueba', actionSettings: [{ type: 'website', colors: { background: 'invalid', text: '#123456' } }] }).business
  assert.deepEqual(saved.actionSettings[0].colors, { text: '#123456' })
})
