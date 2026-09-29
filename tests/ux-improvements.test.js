import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { COALESCE_MS, HISTORY_LIMIT, createHistory, historyReducer } from '../src/utils/history.js'
import { DEFAULT_HEADER, logoPixels, logoRadius, normalizeHeader, safeImageUrl } from '../src/utils/header.js'
import { getSectionIssues, hasErrors, pendingIssues } from '../src/utils/sectionIssues.js'
import { THEMES, THEME_LIST, parseColor, perceivedLuminance, profileThemeId, sheetColors, themeColor } from '../src/utils/themes.js'
import { CROP_PRESETS, canProcess, centeredOffset, clampOffset, coverScale, outputSize, sourceRect, zoomAround } from '../src/utils/image.js'
import { LINK_ICONS, normalizeLinkIcon } from '../src/utils/links.js'
import { comboFromEvent } from '../src/components/admin/useHotkeys.js'
import { normalizeBusiness, upsertIndexEntry } from '../functions/api/_lib.js'
import { profileMetadata } from '../functions/api/_metadata.js'
import { onRequestPost as upload } from '../functions/api/upload.js'

// --- Deshacer / rehacer (#4) --------------------------------------------------

const patch = (state, value, at) => historyReducer(state, { type: 'patch', patch: value, at })

test('historial: cada cambio se puede deshacer y rehacer en orden', () => {
  let state = createHistory({ name: 'A', color: 'x' })
  state = patch(state, { name: 'B' }, 0)
  state = patch(state, { color: 'y' }, 10_000)
  assert.deepEqual(state.present, { name: 'B', color: 'y' })
  state = historyReducer(state, { type: 'undo' })
  assert.deepEqual(state.present, { name: 'B', color: 'x' })
  state = historyReducer(state, { type: 'undo' })
  assert.deepEqual(state.present, { name: 'A', color: 'x' })
  assert.equal(historyReducer(state, { type: 'undo' }), state, 'sin pasos previos no cambia')
  state = historyReducer(state, { type: 'redo' })
  assert.deepEqual(state.present, { name: 'B', color: 'x' })
})

test('historial: agrupa cambios seguidos del mismo campo, pero no más allá de la ventana', () => {
  let state = createHistory({ name: '' })
  state = patch(state, { name: 'H' }, 0)
  state = patch(state, { name: 'Ho' }, 300)
  state = patch(state, { name: 'Hol' }, 600)
  assert.equal(state.past.length, 1, 'escribir de corrido es un solo paso')
  // La ventana se mide desde el inicio del grupo: un párrafo largo no es un solo paso.
  state = patch(state, { name: 'Hola' }, COALESCE_MS + 1)
  assert.equal(state.past.length, 2)
  // Otro campo abre un paso nuevo aunque sea inmediato.
  state = patch(state, { other: 1 }, COALESCE_MS + 2)
  assert.equal(state.past.length, 3)
})

test('historial: un cambio nuevo borra lo rehacible y los cambios sin efecto no crean pasos', () => {
  let state = createHistory({ a: 1 })
  state = patch(state, { a: 2 }, 0)
  state = historyReducer(state, { type: 'undo' })
  assert.equal(state.future.length, 1)
  state = patch(state, { a: 3 }, 5000)
  assert.equal(state.future.length, 0)
  assert.equal(patch(state, { a: 3 }, 9000), state)
})

test('historial: acepta cambios como función sobre el estado más reciente (subidas asíncronas)', () => {
  let state = createHistory({ header: { cover: '', align: 'center' } })
  state = patch(state, { header: { cover: '', align: 'left' } }, 0)
  // Simula una subida que empezó antes del cambio de alineación.
  state = patch(state, (prev) => ({ header: { ...prev.header, cover: '/api/assets/c.webp' } }), 5000)
  assert.deepEqual(state.present.header, { cover: '/api/assets/c.webp', align: 'left' })
})

test('historial: replace es deshacible, reset limpia y hay un límite de pasos', () => {
  let state = createHistory({ a: 1 })
  state = historyReducer(state, { type: 'replace', value: { a: 0 } })
  assert.deepEqual(historyReducer(state, { type: 'undo' }).present, { a: 1 })
  assert.equal(historyReducer(state, { type: 'reset', value: { b: 1 } }).past.length, 0)
  for (let i = 0; i < HISTORY_LIMIT + 20; i += 1) state = patch(state, { a: i + 10 }, i * 10_000)
  assert.equal(state.past.length, HISTORY_LIMIT)
})

// --- Cabecera (#7) ------------------------------------------------------------

test('normalizeHeader valida opciones y cae a valores por defecto', () => {
  assert.deepEqual(normalizeHeader(undefined), DEFAULT_HEADER)
  assert.deepEqual(normalizeHeader({ logoShape: 'triangle', logoSize: 'xl', align: 'right', cover: 'javascript:alert(1)' }), DEFAULT_HEADER)
  assert.deepEqual(
    normalizeHeader({ logoShape: 'square', logoSize: 'lg', align: 'left', cover: '/api/assets/businesses/a/cover-1.webp' }),
    { cover: '/api/assets/businesses/a/cover-1.webp', logoShape: 'square', logoSize: 'lg', align: 'left' },
  )
})

test('safeImageUrl solo acepta assets propios o http(s) sin caracteres peligrosos', () => {
  assert.equal(safeImageUrl('/api/assets/businesses/x/logo.png'), '/api/assets/businesses/x/logo.png')
  assert.equal(safeImageUrl('https://cdn.example.com/a.jpg'), 'https://cdn.example.com/a.jpg')
  for (const bad of ['javascript:alert(1)', 'data:image/png;base64,AAA', '/api/assets/../secret', '/otra/ruta.png', 'https://x.com/a".png', 'https://x.com/<b>', '']) {
    assert.equal(safeImageUrl(bad), '', bad)
  }
})

test('logoPixels y logoRadius calculan tamaño y forma del logo', () => {
  assert.equal(logoPixels('sm'), 80)
  assert.equal(logoPixels('md'), 104)
  assert.equal(logoPixels('lg'), 132)
  assert.equal(logoPixels('lg', true), Math.round(132 * 0.8))
  assert.equal(logoPixels('nope'), 104)
  assert.equal(logoRadius('circle', 100), '50%')
  assert.equal(logoRadius('rounded', 100), 26)
  assert.equal(logoRadius('square', 100), 10)
})

test('normalizeBusiness guarda la cabecera validada', () => {
  const { business } = normalizeBusiness({ name: 'Café', header: { cover: 'javascript:x', logoShape: 'rounded', logoSize: 'sm', align: 'left', extra: 1 } })
  assert.deepEqual(business.header, { cover: '', logoShape: 'rounded', logoSize: 'sm', align: 'left' })
  assert.deepEqual(normalizeBusiness({ name: 'Café' }).business.header, DEFAULT_HEADER)
})

// --- Avance por sección (#14) -------------------------------------------------

test('getSectionIssues: el nombre vacío y las cuentas incompletas bloquean la publicación', () => {
  const issues = getSectionIssues({ name: '  ', bankAccounts: [{ id: 'a', bank: 'pichincha' }] })
  assert.ok(hasErrors(issues.basic))
  assert.ok(hasErrors(issues.bank))
  const ok = getSectionIssues({ name: 'Café', logo: '/l.png', bankAccounts: [{ id: 'a', bank: 'pichincha', holder: 'Ana', number: '123' }] })
  for (const list of Object.values(ok)) assert.equal(hasErrors(list), false)
})

test('getSectionIssues: avisos de slides, enlaces y email; botones fijos sin destino son informativos', () => {
  const issues = getSectionIssues({
    name: 'Café',
    heroSlides: { enabled: true, items: [{ id: 's', title: '' }] },
    links: [{ id: '1', url: '', enabled: true }, { id: '2', url: 'https://x.com', title: '', enabled: true }, { id: '3', url: '', enabled: false }],
    email: 'hola@',
  })
  assert.deepEqual(issues.slides.map((i) => i.text), ['1 slide sin título'])
  assert.deepEqual(pendingIssues(issues.actions).map((i) => i.text), ['1 enlace sin URL', '1 enlace sin título'])
  const info = issues.actions.find((i) => i.level === 'info')
  assert.match(info.text, /sin destino/)
  assert.equal(pendingIssues([info]).length, 0, 'lo informativo no cuenta como pendiente')
  assert.equal(issues.contact[0].text, 'El email no parece válido')
  assert.deepEqual(getSectionIssues({ name: 'x', heroSlides: { enabled: true, items: [] } }).slides[0].text, 'Activado sin slides')
})

// --- Temas: theme-color y ventanas (#2, #12) ----------------------------------

test('profileThemeId respeta el modo claro/oscuro automático', () => {
  assert.equal(profileThemeId({ theme: 'ocean' }), 'ocean')
  const auto = { theme: 'ocean', autoTheme: true, lightTheme: 'confetti', darkTheme: 'starry' }
  assert.equal(profileThemeId(auto, false), 'confetti')
  assert.equal(profileThemeId(auto, true), 'starry')
  assert.equal(profileThemeId({ autoTheme: true }, true), 'vibrant')
  assert.equal(profileThemeId(undefined), undefined)
})

test('themeColor toma el color superior del fondo', () => {
  assert.equal(themeColor({ theme: 'rainbow' }), '#ffd1dc', 'primer color del degradado del tema')
  assert.equal(themeColor({ theme: 'minimal', background: { type: 'solid', color: '#123456' } }), '#123456')
  assert.equal(themeColor({ background: { type: 'gradient', color: '#111111', color2: '#eeeeee', angle: 180 } }), '#111111')
  assert.equal(themeColor({ background: { type: 'gradient', color: '#111111', color2: '#eeeeee', angle: 0 } }), '#eeeeee', 'hacia arriba, el final queda arriba')
  assert.equal(themeColor({ theme: 'custom', customColors: { bg: '#abcdef' } }), '#abcdef')
  assert.equal(themeColor({ autoTheme: true, lightTheme: 'minimal', darkTheme: 'starry' }, true), '#0b0a24')
  for (const theme of THEME_LIST) assert.match(themeColor({ theme: theme.id }), /^#[0-9a-f]{6}$/i, theme.id)
})

test('parseColor y perceivedLuminance entienden hex y rgba mezclado sobre un fondo', () => {
  assert.deepEqual(parseColor('#fff'), { r: 255, g: 255, b: 255, a: 1 })
  assert.deepEqual(parseColor('rgba(10, 20, 30, .5)'), { r: 10, g: 20, b: 30, a: 0.5 })
  assert.equal(parseColor('color-mix(in srgb, red, blue)'), null)
  assert.equal(perceivedLuminance('#ffffff'), 1)
  assert.ok(perceivedLuminance('rgba(255,255,255,.12)', '#000000') < 0.2, 'blanco casi transparente sobre negro es oscuro')
})

test('sheetColors: el botón principal siempre contrasta con la superficie de la ventana', () => {
  for (const theme of THEME_LIST) {
    const colors = sheetColors(theme)
    const surfaceLight = perceivedLuminance(theme.card, theme.bg) > 0.6
    const buttonLight = perceivedLuminance(colors.primary.background) > 0.6
    assert.notEqual(buttonLight, surfaceLight, `${theme.id}: botón principal sin contraste`)
    assert.match(colors.surface, /^linear-gradient\(.+\), .+$/, `${theme.id}: la superficie es opaca (tarjeta sobre fondo)`)
  }
  // Blue Shapes: acento blanco sobre tarjeta clara → usa el texto de tarjeta.
  assert.equal(sheetColors(THEMES.blueprint).primary.background, THEMES.blueprint.cardText)
})

// --- Recorte de imágenes (#11) ------------------------------------------------

test('recorte: la imagen cubre el área, se centra y no deja huecos al moverla', () => {
  const natural = { width: 1000, height: 500 }
  const view = { width: 300, height: 300 }
  const scale = coverScale(natural, view)
  assert.equal(scale, 0.6)
  const offset = centeredOffset(natural, view, scale)
  assert.deepEqual(offset, { x: -150, y: 0 })
  assert.deepEqual(sourceRect(offset, view, scale), { x: 250, y: -0, width: 500, height: 500 })
  assert.deepEqual(clampOffset({ x: 80, y: -50 }, natural, view, scale), { x: 0, y: 0 })
  assert.deepEqual(clampOffset({ x: -999, y: 0 }, natural, view, scale), { x: -300, y: 0 })
})

test('recorte: el zoom conserva el centro y la salida no supera la resolución disponible', () => {
  const natural = { width: 1000, height: 500 }
  const view = { width: 300, height: 300 }
  const scale = coverScale(natural, view)
  const zoomed = zoomAround(centeredOffset(natural, view, scale), natural, view, scale, scale * 2)
  const rect = sourceRect(zoomed, view, scale * 2)
  assert.equal(rect.x + rect.width / 2, 500, 'mismo centro horizontal')
  assert.equal(rect.y + rect.height / 2, 250, 'mismo centro vertical')
  assert.deepEqual(outputSize({ width: 500 }, CROP_PRESETS.logo), { width: 500, height: 500 }, 'no se agranda')
  assert.deepEqual(outputSize({ width: 4000 }, CROP_PRESETS.cover), { width: 1500, height: 500 })
  assert.deepEqual(outputSize({ width: 4000 }, CROP_PRESETS.thumbWide), { width: 1280, height: 720 })
})

test('recorte: solo se procesan PNG, JPEG y WebP', () => {
  assert.ok(canProcess({ type: 'image/png' }))
  assert.ok(canProcess({ type: 'image/webp' }))
  assert.equal(canProcess({ type: 'image/gif' }), false)
  assert.equal(canProcess({ type: 'image/svg+xml' }), false)
  assert.equal(canProcess(undefined), false)
})

// --- Iconos (#8) y atajos (#16) -----------------------------------------------

test('cada icono del catálogo de enlaces tiene su SVG y se valida en el servidor', () => {
  const icons = readFileSync(new URL('../src/components/Icons.jsx', import.meta.url), 'utf8')
  const values = LINK_ICONS.map((icon) => icon.value)
  assert.equal(new Set(values).size, values.length, 'sin duplicados')
  for (const value of values) {
    assert.ok(icons.includes(`case '${value}':`), `falta el SVG de "${value}"`)
    assert.equal(normalizeLinkIcon(value), value)
  }
  assert.equal(normalizeLinkIcon('<script>'), '')
  const saved = normalizeBusiness({ name: 'x', links: [{ id: 'a', title: 'T', url: 'https://x.com', icon: 'cart' }] }).business
  assert.equal(saved.links[0].icon, 'cart')
})

test('comboFromEvent normaliza Ctrl/⌘ y modificadores', () => {
  assert.equal(comboFromEvent({ ctrlKey: true, key: 'S' }), 'mod+s')
  assert.equal(comboFromEvent({ metaKey: true, shiftKey: true, key: 'z' }), 'mod+shift+z')
  assert.equal(comboFromEvent({ key: 'Escape' }), 'escape')
  assert.equal(comboFromEvent({ shiftKey: true, key: '?' }), 'shift+?')
})

// --- Servidor: índice, metadatos y subida -------------------------------------

test('upsertIndexEntry incluye los datos visuales de la miniatura del listado (#12)', () => {
  const business = normalizeBusiness({
    name: 'Café', whatsapp: '593999', menuUrl: 'https://m.com', theme: 'starry',
    background: { type: 'image', url: '/api/assets/bg.webp', pattern: 'stars' },
    header: { cover: '/api/assets/cover.webp', logoShape: 'rounded' },
  }).business
  const [entry] = upsertIndexEntry([], business)
  assert.equal(entry.theme, 'starry')
  assert.equal(entry.buttons, 3, 'WhatsApp + menú + guardar contacto')
  assert.equal(entry.background.url, '/api/assets/bg.webp')
  assert.deepEqual(entry.header, { cover: '/api/assets/cover.webp', logoShape: 'rounded' })
  assert.equal(entry.ageGate, false)
  assert.ok(entry.buttonStyle)
})

test('upsertIndexEntry no expone portada ni fondo de perfiles con puerta de edad', () => {
  const business = normalizeBusiness({
    name: 'Bar', ageGate: { enabled: true, minAge: 18 },
    background: { type: 'image', url: '/api/assets/bg.webp' },
    header: { cover: '/api/assets/cover.webp' },
  }).business
  const [entry] = upsertIndexEntry([], business)
  assert.equal(entry.ageGate, true)
  assert.equal(entry.background.url, undefined)
  assert.equal(entry.header.cover, '')
})

test('profileMetadata incrusta theme-color (uno por modo con tema automático)', () => {
  const single = profileMetadata({ name: 'A', slug: 'a', theme: 'ocean' }, 'https://x.test').html
  assert.equal((single.match(/name="theme-color"/g) || []).length, 1)
  assert.match(single, /<meta name="theme-color" content="#0e7490">/)
  const auto = profileMetadata({ name: 'A', slug: 'a', autoTheme: true, lightTheme: 'minimal', darkTheme: 'starry' }, 'https://x.test').html
  assert.match(auto, /media="\(prefers-color-scheme: light\)" content="#ffffff"/)
  assert.match(auto, /media="\(prefers-color-scheme: dark\)" content="#0b0a24"/)
  const hostile = profileMetadata({ name: 'A', slug: 'a', theme: 'custom', customColors: { bg: '"><script>x</script>' } }, 'https://x.test').html
  assert.doesNotMatch(hostile, /<script>/)
})

test('la subida acepta el tipo "cover" para las portadas', async () => {
  const stored = []
  const env = { ADMIN_SECRET_KEY: 'test', ASSETS_BUCKET: { put: async (key) => stored.push(key) } }
  const send = (kind) => {
    const form = new FormData()
    form.append('file', new File([new Uint8Array([137, 80, 78, 71])], 'c.webp', { type: 'image/webp' }))
    form.append('slug', 'Mi Café')
    form.append('kind', kind)
    return upload({ env, request: new Request('https://x.test/api/upload', { method: 'POST', headers: { Authorization: 'Bearer test' }, body: form }) })
  }
  const res = await send('cover')
  assert.equal(res.status, 201)
  assert.match((await res.json()).url, /^\/api\/assets\/businesses\/mi-cafe\/cover-\d+\.webp$/)
  await send('desconocido')
  assert.match(stored[1], /\/media-\d+\.webp$/, 'los tipos desconocidos caen a "media"')
})
