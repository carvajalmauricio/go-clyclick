import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CONTACT, contactMessage, contactWhatsappUrl, formatPhone, leadReplyMessage, normalizePhone, whatsappLink } from '../src/utils/contact.js'
import { RUBROS, SHOWCASE_ROTATION, getRubro, inferRubro, rubroActionSettings, sampleBusiness } from '../src/utils/rubros.js'
import { LEAD_ID_PATTERN, LEAD_LIMITS, applyLeadUpdate, createLeadRecord, leadFromMetadata, leadMetadata, leadToBusiness, newLeadId, validateLead } from '../src/utils/leads.js'
import { nameFromQuery, pickShowcase, SITE } from '../src/utils/site.js'
import { slugify } from '../src/utils/slug.js'
import { ACTION_DEFINITIONS, buildActions } from '../src/utils/links.js'
import { THEMES } from '../src/utils/themes.js'
import { normalizeBusiness, slugify as serverSlugify, upsertIndexEntry } from '../functions/api/_lib.js'
import { homeMetadata } from '../functions/api/_metadata.js'
import { DAILY_LIMIT, PER_IP_LIMIT, onRequestPost as createLead } from '../functions/api/leads.js'
import { onRequestGet as getLeads, onRequestPost as leadAction } from '../functions/admin/api/leads.js'

// --- KV simulado (get/put/delete/list con metadatos) --------------------------
function createKV() {
  const store = new Map()
  return {
    store,
    async get(key) { return store.has(key) ? store.get(key).value : null },
    async put(key, value, options = {}) { store.set(key, { value: String(value), metadata: options.metadata ?? null, ttl: options.expirationTtl }) },
    async delete(key) { store.delete(key) },
    async list({ prefix = '', limit = 1000, cursor } = {}) {
      const names = [...store.keys()].filter((name) => name.startsWith(prefix)).sort()
      const start = cursor ? Number(cursor) : 0
      const next = start + limit
      return {
        keys: names.slice(start, next).map((name) => ({ name, metadata: store.get(name).metadata })),
        list_complete: next >= names.length,
        cursor: next >= names.length ? undefined : String(next),
      }
    },
  }
}

const leadKeys = (kv) => [...kv.store.keys()].filter((key) => key.startsWith('lead:'))
const VALID = { contactName: 'María Pérez', businessName: 'Café La Esquina', whatsapp: '0991234567', email: 'Maria@Correo.com', rubro: 'cafeteria', theme: 'blueprint', message: 'Quiero menú\ny Deuna', source: 'hero', elapsed: 6000 }

function post(env, body, { ip = '203.0.113.7', origin = 'https://go.clyclick.online', raw } = {}) {
  const headers = { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip }
  if (origin) headers.Origin = origin
  return createLead({ env, request: new Request('https://go.clyclick.online/api/leads', { method: 'POST', headers, body: raw ?? JSON.stringify(body) }) })
}

const ADMIN = { Authorization: 'Bearer secreto' }
const adminGet = (env, headers = ADMIN) => getLeads({ env, request: new Request('https://go.clyclick.online/admin/api/leads', { headers }) })
const adminPost = (env, body, headers = ADMIN) => leadAction({ env, request: new Request('https://go.clyclick.online/admin/api/leads', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) })

// --- Contacto -----------------------------------------------------------------

test('normalizePhone entiende números de Ecuador e internacionales', () => {
  assert.equal(normalizePhone('0978735190'), '593978735190')
  assert.equal(normalizePhone('978735190'), '593978735190')
  assert.equal(normalizePhone('+593 97 873 5190'), '593978735190')
  assert.equal(normalizePhone('593978735190'), '593978735190')
  assert.equal(normalizePhone('+1 (555) 123-4567'), '15551234567')
  assert.equal(normalizePhone('0034 612 345 678'), '34612345678')
  assert.equal(normalizePhone('+593 0991234567'), '593991234567', 'sobra el 0 tras el código de país')
  for (const bad of ['', '123', 'hola', '+0 999 999 999', '1234567890123456']) assert.equal(normalizePhone(bad), '', bad)
})

test('formatPhone y los enlaces de WhatsApp usan el número de ClyClick', () => {
  assert.equal(formatPhone('593978735190'), '+593 97 873 5190')
  assert.equal(formatPhone('15551234567'), '+15551234567')
  assert.equal(CONTACT.whatsapp, '593978735190')
  assert.equal(CONTACT.email, 'info@clyclick.online')
  assert.equal(whatsappLink('+593 97 873 5190', 'Hola & chao'), 'https://wa.me/593978735190?text=Hola%20%26%20chao')
  const url = contactWhatsappUrl({ businessName: 'Café La Esquina', rubroLabel: 'Cafetería', themeName: 'Blue Shapes' })
  assert.ok(url.startsWith('https://wa.me/593978735190?text='))
  const text = decodeURIComponent(url.split('?text=')[1])
  assert.match(text, /Negocio: Café La Esquina/)
  assert.match(text, /Rubro: Cafetería/)
  assert.match(text, /Estilo que me gustó: Blue Shapes/)
  assert.match(contactMessage(), /Me interesa crear el perfil digital/)
  assert.doesNotMatch(contactMessage({ businessName: 'X' }), /Rubro|Estilo/)
  assert.equal(leadReplyMessage({ contactName: 'María José Pérez', businessName: 'Café' }).startsWith('¡Hola, María! 👋'), true)
})

// --- Rubros y perfiles de ejemplo --------------------------------------------

test('inferRubro deduce el rubro a partir del nombre del negocio', () => {
  const cases = {
    'Barbería El Parce': 'barberia', 'Pizzería Napoli': 'restaurante', 'Café La Esquina': 'cafeteria', 'Lubricadora CARTHINGS': 'taller',
    'Consultorio Dental Sonrisa': 'salud', 'Consultora Andina': 'profesional', 'Doña Rosa Restaurante': 'restaurante', 'Auto Lujo': 'taller',
    'Dr. Pérez': 'salud', 'Boutique Luna': 'tienda', 'Juan': '', '': '',
  }
  for (const [name, expected] of Object.entries(cases)) assert.equal(inferRubro(name), expected, name)
})

test('cada rubro tiene un perfil de ejemplo válido con icono, tema y botones', () => {
  const icons = readFileSync(new URL('../src/components/Icons.jsx', import.meta.url), 'utf8')
  assert.equal(new Set(RUBROS.map((rubro) => rubro.id)).size, RUBROS.length)
  for (const rubro of RUBROS) {
    assert.ok(THEMES[rubro.theme], `${rubro.id}: tema`)
    assert.ok(icons.includes(`case '${rubro.icon}':`), `${rubro.id}: icono ${rubro.icon}`)
    const business = sampleBusiness({ rubro: rubro.id })
    assert.equal(business.name, rubro.sampleName)
    assert.ok(buildActions(business).length >= 3, `${rubro.id}: botones visibles`)
    const settings = rubroActionSettings(rubro)
    assert.equal(settings.length, ACTION_DEFINITIONS.length)
    assert.deepEqual(settings.slice(0, rubro.actions.length).map((item) => item.type), rubro.actions.map((action) => action.type))
  }
  for (const id of SHOWCASE_ROTATION) assert.equal(getRubro(id).id, id)
  assert.equal(getRubro('nope').id, 'otro')
})

test('sampleBusiness muestra el nombre escrito, su enlace y el estilo elegido', () => {
  const business = sampleBusiness({ rubro: 'barberia', name: '  Barbería El Parce  ', theme: 'rainbow' })
  assert.equal(business.name, 'Barbería El Parce')
  assert.equal(business.slug, 'barberia-el-parce')
  assert.equal(business.theme, 'rainbow')
  assert.equal(sampleBusiness({ rubro: 'barberia', theme: 'inventado' }).theme, 'luxury', 'tema inválido → el del rubro')
  const shop = sampleBusiness({ rubro: 'tienda' })
  assert.ok(buildActions(shop).some((action) => action.bank === 'deuna'), 'la tienda muestra el pago con Deuna')
})

// --- Validación de solicitudes -------------------------------------------------

test('validateLead exige nombre, negocio y WhatsApp y limpia los datos', () => {
  const empty = validateLead({})
  assert.equal(empty.ok, false)
  assert.deepEqual(Object.keys(empty.errors).sort(), ['businessName', 'contactName', 'whatsapp'])
  assert.ok(validateLead({ ...VALID, email: 'no-es-correo' }).errors.email)
  for (const email of ['a@b.co?cc=evil%40evil.com&subject=hi', 'a@b.co#x', 'a/b@c.co', 'a@b']) {
    assert.ok(validateLead({ ...VALID, email }).errors?.email, `correo rechazado: ${email}`)
  }

  const { ok, lead } = validateLead({ ...VALID, contactName: '  María \u0007  Pérez ', message: 'Línea 1\r\n\r\n\r\n\r\nLínea 2\u0000', rubro: 'inventado', theme: 'nope', source: 'x' })
  assert.equal(ok, true)
  assert.equal(lead.contactName, 'María Pérez')
  assert.equal(lead.whatsapp, '593991234567')
  assert.equal(lead.email, 'maria@correo.com')
  assert.equal(lead.message, 'Línea 1\n\nLínea 2')
  assert.equal(lead.rubro, 'otro')
  assert.equal(lead.theme, '')
  assert.equal(lead.source, 'contact')
  assert.equal(validateLead({ ...VALID, message: 'x'.repeat(900) }).lead.message.length, LEAD_LIMITS.message)
})

test('los metadatos de KV caben en 1024 bytes y conservan la solicitud', () => {
  const record = createLeadRecord(validateLead(VALID).lead, 1_790_000_000_000, 'mg5r6x9n-abc123def0')
  const meta = leadMetadata(record)
  const { complete, lead } = leadFromMetadata(record.id, meta)
  assert.equal(complete, true)
  assert.deepEqual(lead, record)

  const huge = { ...record, contactName: '漢'.repeat(80), businessName: '😀'.repeat(40), email: `${'a'.repeat(110)}@x.co`, message: 'ñ'.repeat(500), note: 'é'.repeat(500) }
  const hugeMeta = leadMetadata(huge)
  assert.ok(new TextEncoder().encode(JSON.stringify(hugeMeta)).length <= 1024)
  const partial = leadFromMetadata(huge.id, hugeMeta)
  assert.equal(partial.complete, false, 'si el mensaje no cabe, el panel lee la clave completa')
  assert.equal(partial.lead.contactName, huge.contactName)
  assert.match(newLeadId(), LEAD_ID_PATTERN)
  assert.ok(newLeadId(2_000_000_000_000) < newLeadId(1_000_000_000_000), 'las más recientes van primero en list()')
})

test('applyLeadUpdate solo cambia estado, nota y perfil creado', () => {
  const record = createLeadRecord(validateLead(VALID).lead, 1000, 'mg5r6x9n-abc123def0')
  const next = applyLeadUpdate(record, { status: 'won', note: '  llamar el lunes  ', slug: 'cafe-la-esquina', whatsapp: '000', contactName: 'Hacker' }, 2000)
  assert.equal(next.status, 'won')
  assert.equal(next.note, 'llamar el lunes')
  assert.equal(next.slug, 'cafe-la-esquina')
  assert.equal(next.whatsapp, record.whatsapp)
  assert.equal(next.contactName, record.contactName)
  assert.equal(next.updatedAt, 2000)
  assert.equal(applyLeadUpdate(record, { status: 'inventado' }).status, 'new')
  assert.equal(applyLeadUpdate(record, { slug: '../x"' }).slug, '')
})

test('leadToBusiness precarga un perfil nuevo que el servidor acepta', () => {
  const lead = { ...validateLead(VALID).lead, id: 'x' }
  const prefill = leadToBusiness(lead)
  assert.equal(prefill.name, 'Café La Esquina')
  assert.equal(prefill.category, 'Cafetería')
  assert.equal(prefill.theme, 'blueprint')
  assert.equal(prefill.whatsapp, '+593991234567')
  assert.equal(prefill.email, 'maria@correo.com')
  assert.equal(prefill.showcase, false)
  assert.equal(prefill.actionSettings[0].label, 'Ver la carta')
  assert.equal(leadToBusiness({ ...lead, theme: '' }).theme, 'blueprint', 'sin estilo elegido usa el del rubro')
  const { ok, business } = normalizeBusiness(prefill)
  assert.equal(ok, true)
  assert.equal(business.slug, 'cafe-la-esquina')
  assert.equal(business.showcase, false)
  assert.ok(buildActions(business).some((action) => action.key === 'whatsapp'))
})

// --- POST /api/leads ---------------------------------------------------------

test('POST /api/leads guarda la solicitud con su resumen y cuenta los límites', async () => {
  const kv = createKV()
  const res = await post({ BUSINESSES: kv }, VALID)
  assert.equal(res.status, 201)
  const { id } = await res.json()
  assert.match(id, LEAD_ID_PATTERN)
  const stored = kv.store.get(`lead:${id}`)
  const record = JSON.parse(stored.value)
  assert.equal(record.status, 'new')
  assert.equal(record.businessName, 'Café La Esquina')
  assert.equal(record.whatsapp, '593991234567')
  assert.equal(record.elapsed, undefined, 'no se guardan campos técnicos')
  assert.equal(leadFromMetadata(id, stored.metadata).complete, true)
  const counters = [...kv.store.entries()].filter(([key]) => key.startsWith('ratelimit:'))
  assert.equal(counters.length, 2)
  for (const [key, entry] of counters) assert.ok(entry.ttl >= 60, `${key} expira`)
  assert.ok(counters.every(([key]) => !key.includes('203.0.113.7')), 'la IP no se guarda en claro')
})

test('POST /api/leads descarta bots en silencio y rechaza envíos inválidos', async () => {
  const kv = createKV()
  const env = { BUSINESSES: kv }
  const trap = await post(env, { ...VALID, website: 'http://spam.example' })
  assert.equal(trap.status, 201)
  assert.equal(leadKeys(kv).length, 0, 'el campo trampa no guarda nada')
  assert.equal((await post(env, { ...VALID, elapsed: 300 })).status, 400, 'demasiado rápido')
  assert.equal((await post(env, { ...VALID, elapsed: undefined })).status, 400, 'sin tiempo de llenado')
  const invalid = await post(env, { ...VALID, whatsapp: '12' })
  assert.equal(invalid.status, 400)
  assert.ok((await invalid.json()).fields.whatsapp)
  assert.equal((await post(env, VALID, { origin: 'https://otro-sitio.example' })).status, 403)
  assert.equal((await post(env, VALID, { raw: '{"a":' })).status, 400)
  assert.equal((await post(env, VALID, { raw: JSON.stringify([VALID]) })).status, 400)
  assert.equal((await post(env, { ...VALID, message: 'x'.repeat(5000) })).status, 413)
  assert.equal((await post({}, VALID)).status, 503)
  assert.equal(leadKeys(kv).length, 0)
  assert.equal((await post(env, VALID, { origin: null })).status, 201, 'sin cabecera Origin (no navegador) se acepta')
})

test('POST /api/leads limita las solicitudes por conexión y por día', async () => {
  const kv = createKV()
  const env = { BUSINESSES: kv }
  for (let index = 0; index < PER_IP_LIMIT; index += 1) assert.equal((await post(env, VALID)).status, 201)
  const blocked = await post(env, VALID)
  assert.equal(blocked.status, 429)
  assert.ok(Number(blocked.headers.get('Retry-After')) > 0)
  assert.equal((await post(env, VALID, { ip: '198.51.100.20' })).status, 201, 'otra conexión sí puede')
  assert.equal(leadKeys(kv).length, PER_IP_LIMIT + 1)

  const today = `ratelimit:leads:${new Date().toISOString().slice(0, 10)}`
  await kv.put(today, String(DAILY_LIMIT))
  assert.equal((await post(env, VALID, { ip: '192.0.2.99' })).status, 429, 'tope diario')
})

test('POST /api/leads falla cerrado: si KV no acepta los contadores, no guarda la solicitud', async () => {
  const kv = createKV()
  const put = kv.put.bind(kv)
  kv.put = async (key, value, options) => {
    if (key.startsWith('ratelimit:lead:')) throw new Error('429 Too Many Requests')
    return put(key, value, options)
  }
  const res = await post({ BUSINESSES: kv }, VALID)
  assert.equal(res.status, 429)
  assert.equal(leadKeys(kv).length, 0)

  // El contador diario se reintenta una vez si coincide con otra escritura.
  const kv2 = createKV()
  const put2 = kv2.put.bind(kv2)
  let failures = 1
  kv2.put = async (key, value, options) => {
    if (key.startsWith('ratelimit:leads:') && failures-- > 0) throw new Error('429 Too Many Requests')
    return put2(key, value, options)
  }
  assert.equal((await post({ BUSINESSES: kv2 }, VALID)).status, 201)
  assert.equal(leadKeys(kv2).length, 1)
})

// --- /admin/api/leads --------------------------------------------------------

test('el panel lista las solicitudes (más recientes primero) solo con autorización', async () => {
  const kv = createKV()
  const env = { BUSINESSES: kv, ADMIN_SECRET_KEY: 'secreto' }
  const older = createLeadRecord(validateLead({ ...VALID, businessName: 'Primero' }).lead, 1000, newLeadId(1000))
  const newer = createLeadRecord(validateLead({ ...VALID, businessName: 'Segundo' }).lead, 5000, newLeadId(5000))
  const long = { ...createLeadRecord(validateLead({ ...VALID, businessName: 'Largo', contactName: '漢'.repeat(80) }).lead, 3000, newLeadId(3000)), message: 'ñ'.repeat(500) }
  for (const lead of [older, newer, long]) await kv.put(`lead:${lead.id}`, JSON.stringify(lead), { metadata: leadMetadata(lead) })
  await kv.put('business:otro', '{}')

  assert.equal((await adminGet(env, {})).status, 401)
  const res = await adminGet(env)
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('Cache-Control'), 'no-store')
  const { leads } = await res.json()
  assert.deepEqual(leads.map((lead) => lead.businessName), ['Segundo', 'Largo', 'Primero'])
  assert.equal(leads[1].message, 'ñ'.repeat(500), 'el mensaje completo se lee de la clave')
})

test('con más solicitudes de las que caben en el listado se omiten las más viejas', async () => {
  const kv = createKV()
  const env = { BUSINESSES: kv, ADMIN_SECRET_KEY: 'secreto' }
  for (let index = 0; index < 5005; index += 1) {
    const lead = createLeadRecord(validateLead({ ...VALID, businessName: `Negocio ${index}` }).lead, 1_000_000 + index, newLeadId(1_000_000 + index))
    kv.store.set(`lead:${lead.id}`, { value: JSON.stringify(lead), metadata: leadMetadata(lead) })
  }
  const body = await (await adminGet(env)).json()
  assert.equal(body.truncated, true)
  assert.equal(body.leads.length, 5000)
  assert.equal(body.leads[0].businessName, 'Negocio 5004', 'la más reciente sí aparece')
})

test('el panel actualiza y elimina solicitudes', async () => {
  const kv = createKV()
  const env = { BUSINESSES: kv, ADMIN_SECRET_KEY: 'secreto' }
  const lead = createLeadRecord(validateLead(VALID).lead, 1000, 'aaaaaaaa-111111')
  await kv.put(`lead:${lead.id}`, JSON.stringify(lead), { metadata: leadMetadata(lead) })

  assert.equal((await adminPost(env, { action: 'update', id: lead.id, changes: { status: 'won' } }, {})).status, 401)
  const res = await adminPost(env, { action: 'update', id: lead.id, changes: { status: 'contacted', note: 'Llamar el lunes' } })
  assert.equal(res.status, 200)
  assert.equal((await res.json()).lead.status, 'contacted')
  const stored = kv.store.get(`lead:${lead.id}`)
  assert.equal(JSON.parse(stored.value).note, 'Llamar el lunes')
  assert.equal(leadFromMetadata(lead.id, stored.metadata).lead.status, 'contacted', 'los metadatos también cambian')

  assert.equal((await adminPost(env, { action: 'update', id: 'zzzzzzzz-999999', changes: {} })).status, 404)
  assert.equal((await adminPost(env, { action: 'update', id: '../business:x', changes: {} })).status, 400)
  assert.equal((await adminPost(env, { action: 'borrar-todo', id: lead.id })).status, 400)
  assert.equal((await adminPost(env, { action: 'delete', id: lead.id })).status, 200)
  assert.equal(leadKeys(kv).length, 0)
})

// --- Página de inicio y "mostrar en inicio" ----------------------------------

test('los perfiles existentes aparecen en la página de inicio salvo que se desactive', () => {
  assert.equal(normalizeBusiness({ name: 'A' }).business.showcase, true, 'sin el campo (perfiles existentes): sí')
  assert.equal(normalizeBusiness({ name: 'A', showcase: false }).business.showcase, false)
  const [shown] = upsertIndexEntry([], normalizeBusiness({ name: 'A' }).business)
  assert.equal(shown.showcase, true)
  const [gated] = upsertIndexEntry([], normalizeBusiness({ name: 'B', ageGate: { enabled: true } }).business)
  assert.equal(gated.showcase, false, 'nunca con puerta de edad')

  const picked = pickShowcase([
    { slug: 'viejo', updatedAt: 1 }, { slug: 'oculto', updatedAt: 9, showcase: false },
    { slug: 'adultos', updatedAt: 8, ageGate: true }, { slug: 'nuevo', updatedAt: 5 }, null, { updatedAt: 7 },
  ])
  assert.deepEqual(picked.map((entry) => entry.slug), ['nuevo', 'viejo'])
  assert.equal(pickShowcase(Array.from({ length: 10 }, (_, index) => ({ slug: `s${index}`, updatedAt: index }))).length, 6)
})

test('la página de inicio tiene sus propias etiquetas para compartir', () => {
  const { html, title, description } = homeMetadata('https://go.clyclick.online')
  assert.equal(title, SITE.title)
  assert.equal(description, SITE.description)
  assert.match(html, /<meta property="og:image" content="https:\/\/go\.clyclick\.online\/og-home\.jpg">/)
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/)
  assert.match(html, /<meta name="theme-color" content="#0f0f12">/)
  assert.match(html, /<link rel="canonical" href="https:\/\/go\.clyclick\.online\/">/)
  assert.equal((html.match(/og:title/g) || []).length, 1)
  const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  assert.doesNotMatch(index, /og:|theme-color/, 'index.html no debe traer etiquetas que pisen las de los perfiles')
})

test('slugify es el mismo en el navegador y en el servidor; ?negocio= precarga el nombre', () => {
  for (const value of ['Pizzería Napolí!', '  Café  & Té ', 'ÑANDÚ-2026']) assert.equal(slugify(value), serverSlugify(value))
  assert.equal(nameFromQuery('?negocio=pizzeria-napoli'), 'Pizzeria Napoli')
  assert.equal(nameFromQuery('?negocio=%3Cimg%20src%3Dx%3E'), 'Img Srcx')
  assert.equal(nameFromQuery('?otro=1'), '')
})
