import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeBusiness } from '../functions/api/_lib.js'
import { onRequestPost } from '../functions/admin/api/save.js'
import { onRequestGet } from '../functions/api/business/[slug].js'
import { buildSocials, normalizeSocialPosition, SOCIAL_NETWORK_KEYS } from '../src/utils/links.js'

// Utilidad: KV falso en memoria + guardar vía el endpoint admin.
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

test('cada nueva red produce la URL correcta (incluye mailto: y tel:)', () => {
  const business = normalizeBusiness({
    name: 'Negocio',
    social: {
      youtube: '@micanal',
      x: '@minegocio',
      threads: 'minegocio',
      pinterest: 'minegocio',
      telegram: '@minegocio',
      spotify: 'artist/123',
      email: 'hola@negocio.com',
      phone: '+593 99 999 9999',
    },
  }).business
  const byKey = Object.fromEntries(buildSocials(business).map((s) => [s.key, s.url]))
  assert.equal(byKey.youtube, 'https://youtube.com/@micanal')
  assert.equal(byKey.x, 'https://x.com/minegocio')
  assert.equal(byKey.threads, 'https://threads.net/@minegocio')
  assert.equal(byKey.pinterest, 'https://pinterest.com/minegocio')
  assert.equal(byKey.telegram, 'https://t.me/minegocio')
  assert.equal(byKey.spotify, 'https://open.spotify.com/artist/123')
  assert.equal(byKey.email, 'mailto:hola@negocio.com')
  assert.equal(byKey.phone, 'tel:+593999999999')
})

test('las URLs completas se respetan tal cual', () => {
  const business = normalizeBusiness({
    name: 'Negocio',
    social: { youtube: 'https://youtube.com/@otro', email: 'mailto:ya@formateado.com' },
  }).business
  const byKey = Object.fromEntries(buildSocials(business).map((s) => [s.key, s.url]))
  assert.equal(byKey.youtube, 'https://youtube.com/@otro')
  assert.equal(byKey.email, 'mailto:ya@formateado.com')
})

test('cada red incluye su etiqueta legible', () => {
  const business = normalizeBusiness({ name: 'Negocio', social: { instagram: 'x' } }).business
  const [ig] = buildSocials(business)
  assert.equal(ig.label, 'Instagram')
})

test('normalizeBusiness descarta claves de red desconocidas', () => {
  const business = normalizeBusiness({
    name: 'Negocio',
    social: { instagram: 'ok', desconocida: 'valor', hacker: 'x' },
  }).business
  assert.equal(business.social.instagram, 'ok')
  assert.equal(business.social.desconocida, undefined)
  assert.equal(business.social.hacker, undefined)
  // El objeto siempre contiene exactamente las claves válidas.
  assert.deepEqual(Object.keys(business.social).sort(), [...SOCIAL_NETWORK_KEYS].sort())
})

test('socialPosition normaliza a top/bottom con default top', () => {
  assert.equal(normalizeSocialPosition(undefined), 'top')
  assert.equal(normalizeSocialPosition(''), 'top')
  assert.equal(normalizeSocialPosition('lado'), 'top')
  assert.equal(normalizeSocialPosition('bottom'), 'bottom')
  assert.equal(normalizeSocialPosition('top'), 'top')
  assert.equal(normalizeBusiness({ name: 'N' }).business.socialPosition, 'top')
  assert.equal(normalizeBusiness({ name: 'N', socialPosition: 'bottom' }).business.socialPosition, 'bottom')
  assert.equal(normalizeBusiness({ name: 'N', socialPosition: 'raro' }).business.socialPosition, 'top')
})

test('buildSocials respeta el orden explícito y luego el catálogo', () => {
  const business = normalizeBusiness({
    name: 'Negocio',
    social: { instagram: 'a', tiktok: 'b', youtube: '@c' },
    socialOrder: ['youtube', 'instagram'],
  }).business
  assert.deepEqual(buildSocials(business).map((s) => s.key), ['youtube', 'instagram', 'tiktok'])
})

test('socialOrder descarta claves inválidas y duplicadas al normalizar', () => {
  const business = normalizeBusiness({
    name: 'Negocio',
    social: { instagram: 'a' },
    socialOrder: ['instagram', 'instagram', 'desconocida', 'tiktok'],
  }).business
  assert.deepEqual(business.socialOrder, ['instagram', 'tiktok'])
})

test('un perfil antiguo de 4 redes sigue funcionando', () => {
  const business = normalizeBusiness({
    name: 'Negocio',
    social: { instagram: 'ig', tiktok: 'tt', facebook: 'fb', linkedin: 'company/li' },
  }).business
  const byKey = Object.fromEntries(buildSocials(business).map((s) => [s.key, s.url]))
  assert.equal(byKey.instagram, 'https://instagram.com/ig')
  assert.equal(byKey.tiktok, 'https://tiktok.com/@tt')
  assert.equal(byKey.facebook, 'https://facebook.com/fb')
  assert.equal(byKey.linkedin, 'https://linkedin.com/company/li')
})

test('redes y posición sobreviven al round-trip guardar + GET', async () => {
  const { env, save } = makeEnv()
  const payload = {
    name: 'Café Aurora',
    social: { instagram: 'aurora', telegram: '@aurora', email: 'hola@aurora.com' },
    socialOrder: ['telegram', 'instagram'],
    socialPosition: 'bottom',
  }
  assert.equal((await save(payload)).status, 201)
  const business = await (await onRequestGet({ env, params: { slug: 'cafe-aurora' } })).json()
  assert.equal(business.social.instagram, 'aurora')
  assert.equal(business.social.telegram, '@aurora')
  assert.equal(business.social.email, 'hola@aurora.com')
  assert.deepEqual(business.socialOrder, ['telegram', 'instagram'])
  assert.equal(business.socialPosition, 'bottom')
  assert.deepEqual(buildSocials(business).map((s) => s.key), ['telegram', 'instagram', 'email'])
})
