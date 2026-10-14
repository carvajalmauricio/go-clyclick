import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeBusiness } from '../functions/api/_lib.js'
import { buildActions, buildSocials } from '../src/utils/links.js'
import { editorContent, patchContent } from '../src/utils/editorContent.js'
import { moveContent, normalizeContentOrder } from '../src/utils/contentOrder.js'
import { THEMES, BACKGROUND_PATTERNS } from '../src/utils/themes.js'
import { contrastRatio } from '../src/utils/typography.js'
import { onRequestPost as publish } from '../functions/admin/api/save.js'

const fixture = () => ({
  name: 'Training', font: 'poppins', actionSettingsVersion: 2,
  sections: [{ id: 'clases', title: 'Clases' }, { id: 'planes', title: 'Planes' }],
  actionSettings: [{ id: 'reservas', type: 'whatsapp', destination: '593999111111', sectionId: 'clases' }],
  links: [{ id: 'plan', title: 'Plan mensual', url: 'https://example.com/plan', sectionId: 'clases' }],
  social: { instagram: 'training', tiktok: 'training', facebook: 'training' },
  socialDisplay: { instagram: 'buttons', tiktok: 'both', facebook: 'hidden' },
  socialSections: { instagram: 'clases', tiktok: 'planes' },
  contentOrder: ['link-plan', 'social:instagram', 'reservas', 'social:tiktok'],
})

test('the editor and public profile share mixed button ordering after repeated saves', () => {
  const first = normalizeBusiness(fixture())
  assert.equal(first.ok, true)
  const second = normalizeBusiness(first.business)
  assert.equal(second.ok, true)
  assert.deepEqual(buildActions(second.business).map((item) => item.key), fixture().contentOrder)
  assert.deepEqual(editorContent(second.business).map((item) => item.key), fixture().contentOrder)
  assert.deepEqual(buildActions(first.business), buildActions(second.business))
})

test('social icon/button/both/hidden choices use a single stored destination', () => {
  const b = normalizeBusiness(fixture()).business
  assert.deepEqual(buildSocials(b).map((item) => item.key), ['tiktok'])
  assert.deepEqual(buildSocials(b, 'buttons').map((item) => item.key), ['instagram', 'tiktok'])
  b.social.instagram = 'newhandle'
  assert.equal(buildActions(b).find((item) => item.key === 'social:instagram').url, 'https://instagram.com/newhandle')
  assert.equal(buildActions(b).some((item) => item.key === 'social:facebook'), false)
  assert.deepEqual(buildSocials({ social: { instagram: 'legacy' } }).map((item) => item.key), ['instagram'])
})

test('moving entries between sections preserves destinations, styles and independent IDs', () => {
  const b = normalizeBusiness(fixture()).business
  for (const entry of editorContent(b)) {
    const changed = { ...b, ...patchContent(b, entry, { sectionId: 'planes' }) }
    const saved = normalizeBusiness(changed).business
    const before = buildActions(b).find((item) => item.key === entry.key)
    const after = buildActions(saved).find((item) => item.key === entry.key)
    assert.equal(after.sectionId, 'planes')
    assert.equal(after.url, before.url)
    assert.equal(after.layout, before.layout)
  }
})

test('asynchronous thumbnail updates preserve edits made while uploading', () => {
  const b = normalizeBusiness(fixture()).business
  const entry = editorContent(b).find((item) => item.kind === 'link')
  const latest = { ...b, links: [{ ...b.links[0], title: 'Updated during upload' }] }
  const result = patchContent(latest, entry, { thumbnail: '/api/assets/thumb.webp' })
  assert.equal(result.links[0].title, 'Updated during upload')
  assert.equal(result.links[0].thumbnail, '/api/assets/thumb.webp')
})

test('explicit empty destinations do not use general contact values', () => {
  const b = normalizeBusiness({ name: 'Test', whatsapp: '593999111111', actionSettingsVersion: 2,
    actionSettings: [{ id: 'own', type: 'whatsapp', useOwnDestination: true, destination: '' }, { id: 'general', type: 'whatsapp' }] }).business
  assert.deepEqual(buildActions(b).map((item) => item.key), ['general'])
})

test('invalid ordering and orphan social/link sections are normalized safely', () => {
  assert.deepEqual(normalizeContentOrder(['x', 'x', null, {}, 'unknown'], ['x']), ['x'])
  const b = fixture()
  b.socialSections.instagram = 'deleted'
  b.links[0].sectionId = 'deleted'
  b.contentOrder.push('obsolete', 'social:instagram')
  const saved = normalizeBusiness(b).business
  assert.equal(saved.socialSections.instagram, '')
  assert.equal(saved.links[0].sectionId, '')
  assert.equal(saved.contentOrder.includes('obsolete'), false)
  assert.equal(saved.contentOrder.filter((key) => key === 'social:instagram').length, 1)
  assert.deepEqual(moveContent([{ key: 'a' }, { key: 'b' }, { key: 'c' }], 'c', 'a').map((item) => item.key), ['c', 'a', 'b'])
})

test('fitness themes save with their movement pattern and readable text', () => {
  for (const id of ['volt', 'pulse', 'ignite']) {
    const theme = THEMES[id]
    const saved = normalizeBusiness({ name: 'Training', theme: id, background: { type: 'theme', pattern: theme.pattern } }).business
    assert.equal(saved.theme, id)
    assert.equal(saved.background.pattern, theme.pattern)
    assert.ok(BACKGROUND_PATTERNS.some((pattern) => pattern.value === theme.pattern))
    assert.ok(contrastRatio(theme.text, theme.card) >= 4.5, `${id}: card text`)
    assert.ok(contrastRatio(theme.subtext, theme.bg) >= 4.5, `${id}: supporting text`)
    assert.ok(contrastRatio(theme.accentText, theme.accent) >= 4.5, `${id}: primary button`)
  }
})

test('publishing stores the integrated profile and preserves it when editing again', async () => {
  const records = new Map()
  const env = { ADMIN_SECRET_KEY: 'test-only', BUSINESSES: {
    get: async (key) => records.get(key) ?? null,
    put: async (key, value) => records.set(key, value),
  } }
  const send = (payload) => publish({ env, request: new Request('https://example.test/admin/api/save', {
    method: 'POST', headers: { Authorization: 'Bearer test-only', 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  }) })
  const payload = { ...fixture(), slug: 'training-test', theme: 'pulse', header: { align: 'left' },
    typography: { titleSize: 34, buttonSize: 20, descriptionSize: 18, lineHeight: 1.8, textPanel: 'dark' },
    background: { type: 'theme', pattern: 'neon-orbit' },
  }
  assert.equal((await send(payload)).status, 201)
  const first = JSON.parse(records.get('business:training-test'))
  assert.equal(first.theme, 'pulse')
  assert.equal(first.header.align, 'left')
  assert.equal(first.font, 'poppins')
  assert.equal(first.typography.titleSize, 34)
  assert.deepEqual(buildActions(first).map((entry) => entry.key), payload.contentOrder)
  assert.equal((await send({ ...first, isEdit: true })).status, 200)
  const second = JSON.parse(records.get('business:training-test'))
  assert.deepEqual(buildActions(second), buildActions(first))
  assert.deepEqual(second.typography, first.typography)
  const before = [...records]
  const bad = await send({ ...first, isEdit: true, actionSettings: [null] })
  assert.equal(bad.status, 400)
  assert.deepEqual([...records], before)
})
