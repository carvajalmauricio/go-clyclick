import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeBusiness } from '../functions/api/_lib.js'
import { buildActions, getActionSettings } from '../src/utils/links.js'
import { BANK_SECTION_ID, getProfileSections } from '../src/utils/banking.js'

test('botones repetidos y enlaces libres conservan su destino y sección tras guardar', () => {
  const payload = {
    name: 'Café Central', whatsapp: '593999111111', actionSettingsVersion: 2,
    sections: [{ id: BANK_SECTION_ID, title: 'Datos Bancarios' }, { id: 'promos', title: 'Promociones' }],
    actionSettings: [
      { id: 'whatsapp-uno', type: 'whatsapp', label: 'Reservas', destination: '593999222222', sectionId: 'promos', order: 0 },
      { id: 'whatsapp-dos', type: 'whatsapp', label: 'Pedidos', destination: '593999333333', sectionId: BANK_SECTION_ID, order: 1 },
      { id: 'web-uno', type: 'custom', label: 'Carta especial', url: 'https://example.com/carta', icon: 'menu', sectionId: 'promos', order: 2 },
    ],
  }
  const result = normalizeBusiness(payload)
  assert.equal(result.ok, true)
  assert.deepEqual(getProfileSections(result.business).map((section) => section.id), [BANK_SECTION_ID, 'promos'])
  assert.deepEqual(buildActions(result.business).map(({ key, label, url, sectionId }) => [key, label, url, sectionId]), [
    ['whatsapp-uno', 'Reservas', 'https://wa.me/593999222222?text=Hola%20Caf%C3%A9%20Central%2C%20vengo%20desde%20su%20perfil%20ClickClick', 'promos'],
    ['whatsapp-dos', 'Pedidos', 'https://wa.me/593999333333?text=Hola%20Caf%C3%A9%20Central%2C%20vengo%20desde%20su%20perfil%20ClickClick', BANK_SECTION_ID],
    ['web-uno', 'Carta especial', 'https://example.com/carta', 'promos'],
  ])
})

test('perfiles antiguos mantienen sus tipos implícitos y permiten migrar a botones explícitos', () => {
  const old = { name: 'Negocio antiguo', website: 'example.com', actionSettings: [{ type: 'whatsapp', label: 'Escríbenos' }] }
  assert.equal(getActionSettings(old).length, 7)
  const saved = normalizeBusiness(old).business
  assert.equal(saved.actionSettingsVersion, 2)
  assert.equal(saved.actionSettings.length, 7)
  assert.equal(buildActions(saved).find((item) => item.key === 'website')?.url, 'https://example.com')
  assert.deepEqual(getActionSettings({ ...saved, actionSettings: [] }), [])
})

test('rechaza enlaces inseguros e identificadores repetidos', () => {
  const base = { name: 'Negocio', actionSettingsVersion: 2 }
  assert.equal(normalizeBusiness({ ...base, actionSettings: [{ id: 'x', type: 'custom', url: 'javascript:alert(1)' }] }).ok, false)
  assert.equal(normalizeBusiness({ ...base, actionSettings: [{ id: 'x', type: 'custom' }, { id: 'x', type: 'custom' }] }).ok, false)
})

test('conserva el orden de secciones y permite mover cuentas fuera de ellas', () => {
  const result = normalizeBusiness({
    name: 'Tienda', sections: [{ id: 'catalogo', title: 'Catálogo' }, { id: BANK_SECTION_ID, title: 'Datos Bancarios' }],
    bankAccounts: [{ id: 'cuenta-uno', bank: 'deuna', url: 'https://example.com/pagar', sectionId: '' }],
  })
  assert.equal(result.ok, true)
  assert.deepEqual(result.business.sections.map((section) => section.id), ['catalogo', BANK_SECTION_ID])
  assert.equal(buildActions(result.business).find((action) => action.key === 'bank-cuenta-uno').sectionId, '')
})


test('botones nuevos conviven con enlaces remotos, fuentes y secciones al volver a guardar', () => {
  const payload = { name: 'Negocio', font: 'poppins', header: { align: 'left' },
    actionSettingsVersion: 2,
    sections: [{ id: 'servicios', title: 'Servicios' }, { id: BANK_SECTION_ID, title: 'Pagos' }],
    actionSettings: [{ id: 'reservas', type: 'whatsapp', destination: '593999222222', sectionId: 'servicios' }],
    links: [{ id: 'catalogo', title: 'Catálogo', url: 'https://example.com/catalogo', layout: 'grid', sectionId: 'servicios' }],
    typography: { titleSize: 34, descriptionSize: 18, buttonSize: 20, lineHeight: 1.7, textPanel: 'dark' },
  }
  const first = normalizeBusiness(payload)
  assert.equal(first.ok, true)
  const second = normalizeBusiness(first.business)
  assert.equal(second.ok, true)
  assert.equal(second.business.font, 'poppins')
  assert.equal(second.business.header.align, 'left')
  assert.deepEqual(second.business.typography, first.business.typography)
  assert.deepEqual(buildActions(second.business), buildActions(first.business))
  assert.deepEqual(buildActions(second.business).map((action) => action.key), ['reservas', 'link-catalogo'])
  assert.equal(buildActions(second.business)[1].layout, 'grid')
})

test('rechaza destinos con esquemas ejecutables o credenciales', () => {
  for (const destination of ['javascript:alert(1)', 'data:text/html,alert(1)', 'https://user:pass@example.com']) {
    assert.equal(normalizeBusiness({ name: 'Prueba', actionSettingsVersion: 2,
      actionSettings: [{ id: 'sitio', type: 'website', destination }] }).ok, false)
  }
})
