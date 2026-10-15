import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeBusiness } from '../functions/api/_lib.js'
import { buildActions } from '../src/utils/links.js'
import { buildVCard } from '../src/utils/vcard.js'
import { copyBusinessContact, normalizeContactCard } from '../src/utils/contactCard.js'

const fixture = () => ({ name: 'Gimnasio', slug: 'gym', category: 'Training', phone: '593111111111', whatsapp: '593222222222', email: 'gym@example.com', website: 'example.com', description: 'Descripción del negocio' })

test('legacy contact buttons continue to download business data', () => {
  const b = fixture()
  const action = buildActions(b).find((item) => item.isContact)
  assert.equal(buildVCard(action.contactBusiness), buildVCard(b))
})

test('each custom contact preserves independent data after saving twice', () => {
  const b = { ...fixture(), actionSettingsVersion: 2, actionSettings: [
    { id: 'coach', type: 'contact', label: 'Guardar entrenador', contactMode: 'custom', contactData: { name: 'Ana', organization: 'Equipo A', phone: '593999999999', email: 'ana@example.com' } },
    { id: 'sales', type: 'contact', contactMode: 'custom', contactData: { name: 'Ventas', organization: 'Equipo B', phone: '593888888888' } },
    { id: 'general', type: 'contact' },
  ] }
  const first = normalizeBusiness(b)
  assert.equal(first.ok, true)
  const second = normalizeBusiness(first.business)
  assert.equal(second.ok, true)
  const actions = buildActions(second.business)
  const coach = buildVCard(actions[0].contactBusiness)
  assert.match(coach, /FN:Ana/)
  assert.match(coach, /ORG:Equipo A/)
  assert.match(coach, /593999999999/)
  assert.match(coach, /ana@example.com/)
  assert.doesNotMatch(coach, /gym@example.com|593111111111|593222222222|NOTE:|URL:|TITLE:/)
  assert.match(buildVCard(actions[1].contactBusiness), /FN:Ventas/)
  assert.equal(actions[2].contactBusiness.name, 'Gimnasio')
  assert.deepEqual(first.business.actionSettings, second.business.actionSettings)
})

test('cleared custom fields stay omitted and later business changes do not alter them', () => {
  const b = fixture()
  const contactData = { ...copyBusinessContact(b), organization: '', email: '', phone: '', whatsapp: '', website: '', category: '', description: '' }
  const settings = [{ id: 'own', type: 'contact', contactMode: 'custom', contactData }]
  const changed = { ...b, name: 'Otro negocio', phone: '593123456789', actionSettingsVersion: 2, actionSettings: settings }
  const card = buildVCard(buildActions(changed)[0].contactBusiness)
  assert.match(card, /FN:Gimnasio/)
  assert.doesNotMatch(card, /ORG:|EMAIL:|TEL;|URL:|TITLE:|NOTE:|Otro negocio|593123456789/)
  const general = { ...changed, actionSettings: [{ ...settings[0], contactMode: 'business' }] }
  assert.match(buildVCard(buildActions(general)[0].contactBusiness), /FN:Otro negocio/)
})

test('a name-only custom contact works without general contact data; blank names hide it', () => {
  const b = { name: 'Business', actionSettingsVersion: 2, actionSettings: [{ id: 'own', type: 'contact', contactMode: 'custom', contactData: { name: 'Ana' } }] }
  assert.equal(buildActions(b).length, 1)
  b.actionSettings[0].contactData.name = '  '
  assert.equal(buildActions(b).length, 0)
})

test('normalization limits fields and vCard escaping prevents injected properties', () => {
  const contact = normalizeContactCard({ name: 'Ana\r\nEMAIL:fake@example.com', organization: 'A;B,C', website: '', phone: '1'.repeat(100), unexpected: 'ignored' })
  assert.equal(contact.phone.length, 80)
  assert.equal(contact.unexpected, undefined)
  const card = buildVCard(contact)
  assert.match(card, /FN:Ana\\nEMAIL:fake@example.com/)
  assert.match(card, /ORG:A\\;B\\,C/)
  assert.equal(card.includes('\r\nEMAIL:'), false)
})
