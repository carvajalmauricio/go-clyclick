import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeBusiness } from '../functions/api/_lib.js'
import { onRequestPost } from '../functions/admin/api/save.js'
import { onRequestGet } from '../functions/api/business/[slug].js'
import { normalizeFont, fontStylesheetUrl, getFont, FONTS } from '../src/utils/fonts.js'
import { t } from '../src/utils/i18n.js'

// --- #8 Fuentes personalizadas -------------------------------------------------

test('normalizeFont valida contra el catálogo y cae a "" si es inválida', () => {
  assert.equal(normalizeFont('poppins'), 'poppins')
  assert.equal(normalizeFont('  montserrat '), 'montserrat')
  assert.equal(normalizeFont('comic-sans'), '')
  assert.equal(normalizeFont(''), '')
  assert.equal(normalizeFont(undefined), '')
  assert.equal(normalizeFont(null), '')
})

test('fontStylesheetUrl solo devuelve URL con display=swap para fuentes válidas', () => {
  assert.equal(fontStylesheetUrl(''), '')
  assert.equal(fontStylesheetUrl('nope'), '')
  const url = fontStylesheetUrl('poppins')
  assert.match(url, /^https:\/\/fonts\.googleapis\.com\/css2\?family=Poppins/)
  assert.match(url, /display=swap/)
  assert.ok(getFont('poppins'))
  assert.equal(getFont('nope'), null)
})

test('el catálogo de fuentes tiene entre 6 y 8 opciones', () => {
  assert.ok(FONTS.length >= 6 && FONTS.length <= 8)
})

test('normalizeBusiness persiste font válida y descarta inválida', () => {
  assert.equal(normalizeBusiness({ name: 'N', font: 'lora' }).business.font, 'lora')
  assert.equal(normalizeBusiness({ name: 'N', font: 'inexistente' }).business.font, '')
  assert.equal(normalizeBusiness({ name: 'N' }).business.font, '')
})

// --- #16 Modo claro/oscuro automático -----------------------------------------

test('autoTheme se normaliza a booleano y los temas claro/oscuro se validan', () => {
  const on = normalizeBusiness({ name: 'N', autoTheme: true, lightTheme: 'geopop', darkTheme: 'ocean' }).business
  assert.equal(on.autoTheme, true)
  assert.equal(on.lightTheme, 'geopop')
  assert.equal(on.darkTheme, 'ocean')

  const off = normalizeBusiness({ name: 'N', autoTheme: 'nope', lightTheme: 'inventado', darkTheme: 42 }).business
  assert.equal(off.autoTheme, false)
  assert.equal(off.lightTheme, 'minimal')
  assert.equal(off.darkTheme, 'vibrant')
})

// --- #18 Multi-idioma ---------------------------------------------------------

test('languages es siempre un subconjunto de [es,en] con es por defecto', () => {
  assert.deepEqual(normalizeBusiness({ name: 'N' }).business.languages, ['es'])
  assert.deepEqual(normalizeBusiness({ name: 'N', languages: ['en'] }).business.languages, ['es', 'en'])
  assert.deepEqual(normalizeBusiness({ name: 'N', languages: ['en', 'es', 'fr', 'en'] }).business.languages, ['es', 'en'])
  assert.deepEqual(normalizeBusiness({ name: 'N', languages: ['fr', 'de'] }).business.languages, ['es'])
})

test('los overrides i18n conservan solo idiomas habilitados y campos conocidos', () => {
  const b = normalizeBusiness({
    name: 'N',
    languages: ['en'],
    i18n: {
      en: { name: 'English name', description: 'Desc', category: 'Cat', bogus: 'x' },
      fr: { name: 'Ignorado' },
    },
  }).business
  assert.deepEqual(b.i18n.en, { name: 'English name', description: 'Desc', category: 'Cat' })
  assert.equal(b.i18n.fr, undefined)
})

test('los overrides i18n se descartan si el idioma no está habilitado', () => {
  const b = normalizeBusiness({ name: 'N', languages: ['es'], i18n: { en: { name: 'X' } } }).business
  assert.deepEqual(b.i18n, {})
})

test('t(lang,key) traduce y cae a español ante idioma o clave desconocidos', () => {
  assert.equal(t('en', 'saveContact'), 'Save contact')
  assert.equal(t('es', 'saveContact'), 'Guardar contacto')
  // Idioma desconocido -> español
  assert.equal(t('fr', 'saveContact'), 'Guardar contacto')
  // Clave desconocida -> devuelve la propia clave
  assert.equal(t('en', 'noExiste'), 'noExiste')
  // Interpolación
  assert.equal(t('es', 'ageGateQuestion', { age: 18 }), '¿Eres mayor de 18 años?')
})

// --- #19 Puerta de edad -------------------------------------------------------

test('ageGate normaliza enabled/minAge/message y hace clamp de la edad', () => {
  const on = normalizeBusiness({ name: 'N', ageGate: { enabled: true, minAge: 21, message: 'Solo adultos' } }).business
  assert.deepEqual(on.ageGate, { enabled: true, minAge: 21, message: 'Solo adultos' })

  const clampHigh = normalizeBusiness({ name: 'N', ageGate: { enabled: true, minAge: 500 } }).business.ageGate
  assert.equal(clampHigh.minAge, 99)
  const clampLow = normalizeBusiness({ name: 'N', ageGate: { enabled: true, minAge: -5 } }).business.ageGate
  assert.equal(clampLow.minAge, 0)

  const defaults = normalizeBusiness({ name: 'N' }).business.ageGate
  assert.deepEqual(defaults, { enabled: false, minAge: 18, message: '' })

  const badAge = normalizeBusiness({ name: 'N', ageGate: { enabled: 'true', minAge: 'x' } }).business.ageGate
  assert.equal(badAge.enabled, true)
  assert.equal(badAge.minAge, 18)
})

// --- Round-trip save + GET ----------------------------------------------------

test('save + GET conserva font, autoTheme, temas, idiomas, i18n y ageGate', async () => {
  const records = new Map()
  const env = {
    ADMIN_SECRET_KEY: 'test-only',
    BUSINESSES: {
      get: async (key) => records.get(key) ?? null,
      put: async (key, value) => records.set(key, value),
    },
  }
  const payload = {
    name: 'Bar Nocturno',
    font: 'oswald',
    autoTheme: true,
    lightTheme: 'geopop',
    darkTheme: 'luxury',
    languages: ['en'],
    i18n: { en: { name: 'Night Bar', description: 'Late night', category: 'Bar' } },
    ageGate: { enabled: true, minAge: 21, message: 'Solo mayores' },
  }
  const res = await onRequestPost({
    env,
    request: new Request('https://example.com/admin/api/save', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-only', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  })
  assert.equal(res.status, 201)
  const business = await (await onRequestGet({ env, params: { slug: 'bar-nocturno' } })).json()
  assert.equal(business.font, 'oswald')
  assert.equal(business.autoTheme, true)
  assert.equal(business.lightTheme, 'geopop')
  assert.equal(business.darkTheme, 'luxury')
  assert.deepEqual(business.languages, ['es', 'en'])
  assert.deepEqual(business.i18n.en, { name: 'Night Bar', description: 'Late night', category: 'Bar' })
  assert.deepEqual(business.ageGate, { enabled: true, minAge: 21, message: 'Solo mayores' })
})
