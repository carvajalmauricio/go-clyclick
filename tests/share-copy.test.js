import assert from 'node:assert/strict'
import test from 'node:test'
import { addressFromMapsUrl } from '../src/utils/links.js'
import { copyText, shareLink } from '../src/utils/clipboard.js'

// --- addressFromMapsUrl (#12: copiar dirección con un toque) ---

test('extrae la dirección del parámetro q de un enlace de Google Maps', () => {
  const url = 'https://www.google.com/maps?q=Av.+Amazonas+123,+Quito'
  assert.equal(addressFromMapsUrl(url), 'Av. Amazonas 123, Quito')
})

test('extrae la dirección del parámetro query', () => {
  const url = 'https://maps.google.com/?query=Calle%20Falsa%20456'
  assert.equal(addressFromMapsUrl(url), 'Calle Falsa 456')
})

test('extrae la dirección del segmento /place/ del path', () => {
  const url = 'https://www.google.com/maps/place/Parque+La+Carolina/@-0.18,-78.48,17z'
  assert.equal(addressFromMapsUrl(url), 'Parque La Carolina')
})

test('descarta coordenadas puras y enlaces sin dirección legible', () => {
  assert.equal(addressFromMapsUrl('https://www.google.com/maps?q=-0.18,-78.48'), '')
  assert.equal(addressFromMapsUrl('https://maps.app.goo.gl/abcd1234'), '')
})

test('devuelve cadena vacía para valores vacíos o inválidos', () => {
  assert.equal(addressFromMapsUrl(''), '')
  assert.equal(addressFromMapsUrl(null), '')
  assert.equal(addressFromMapsUrl('   '), '')
})

// --- Utilidades para simular navigator/document en Node (propiedad de solo
// lectura: se reemplaza con defineProperty y se restaura al terminar). ---

function withGlobals(overrides, fn) {
  const descriptors = {}
  for (const key of Object.keys(overrides)) {
    descriptors[key] = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { value: overrides[key], configurable: true, writable: true })
  }
  const restore = () => {
    for (const key of Object.keys(overrides)) {
      if (descriptors[key]) Object.defineProperty(globalThis, key, descriptors[key])
      else delete globalThis[key]
    }
  }
  return Promise.resolve()
    .then(fn)
    .finally(restore)
}

// --- copyText (helper compartido de portapapeles) ---

test('copyText usa navigator.clipboard cuando está disponible', async () => {
  let copied = ''
  await withGlobals(
    { navigator: { clipboard: { writeText: async (text) => { copied = text } } } },
    async () => {
      assert.equal(await copyText('hola'), true)
      assert.equal(copied, 'hola')
    },
  )
})

test('copyText devuelve false sin API de portapapeles ni document', async () => {
  await withGlobals({ navigator: {}, document: undefined }, async () => {
    assert.equal(await copyText('hola'), false)
    assert.equal(await copyText(''), false)
  })
})

// --- shareLink (compartir enlace individual con respaldo de copia) ---

test('shareLink usa navigator.share cuando existe', async () => {
  let shared = null
  await withGlobals({ navigator: { share: async (data) => { shared = data } } }, async () => {
    const result = await shareLink({ title: 'Mi enlace', url: 'https://ejemplo.com' })
    assert.deepEqual(result, { shared: true, copied: false })
    assert.equal(shared.url, 'https://ejemplo.com')
  })
})

test('shareLink no copia cuando el usuario cancela (AbortError)', async () => {
  let copyCalled = false
  await withGlobals(
    {
      navigator: {
        share: async () => { const e = new Error('cancel'); e.name = 'AbortError'; throw e },
        clipboard: { writeText: async () => { copyCalled = true } },
      },
    },
    async () => {
      const result = await shareLink({ title: 'x', url: 'https://ejemplo.com' })
      assert.deepEqual(result, { shared: false, copied: false })
      assert.equal(copyCalled, false)
    },
  )
})

test('shareLink copia el enlace como respaldo cuando no hay navigator.share', async () => {
  let copied = ''
  await withGlobals(
    { navigator: { clipboard: { writeText: async (text) => { copied = text } } } },
    async () => {
      const result = await shareLink({ title: 'x', url: 'https://ejemplo.com/perfil' })
      assert.deepEqual(result, { shared: false, copied: true })
      assert.equal(copied, 'https://ejemplo.com/perfil')
    },
  )
})

test('shareLink sin url devuelve estado neutro', async () => {
  assert.deepEqual(await shareLink({ title: 'x', url: '' }), { shared: false, copied: false })
})
