import assert from 'node:assert/strict'
import test from 'node:test'
import { descriptionColor } from '../src/utils/heroDescription.js'
import { pickGateLanguage } from '../src/utils/gateLanguage.js'
import { shouldAdoptFresh } from '../src/utils/reconcileBusiness.js'

const theme = { subtext: '#8899aa' }

// --- descriptionColor (#16 / #3) ---

test('descriptionColor usa theme.subtext bajo autoTheme e ignora el color fijo', () => {
  assert.equal(descriptionColor({ autoTheme: true, descriptionColor: '#ff0000' }, theme), '#8899aa')
  assert.equal(descriptionColor({ autoTheme: true }, theme), '#8899aa')
})

test('descriptionColor respeta el color fijo del comerciante sin autoTheme', () => {
  assert.equal(descriptionColor({ autoTheme: false, descriptionColor: '#ff0000' }, theme), '#ff0000')
  // Sin autoTheme y sin color fijo cae al subtext del tema.
  assert.equal(descriptionColor({ autoTheme: false, descriptionColor: '' }, theme), '#8899aa')
  assert.equal(descriptionColor({}, theme), '#8899aa')
})

// --- pickGateLanguage (#5 / #19) ---

test('pickGateLanguage devuelve en cuando en es el único idioma habilitado', () => {
  assert.equal(pickGateLanguage(['en']), 'en')
})

test('pickGateLanguage usa el idioma por defecto (es) cuando en no está habilitado', () => {
  assert.equal(pickGateLanguage(['es']), 'es')
  assert.equal(pickGateLanguage([]), 'es')
  assert.equal(pickGateLanguage(undefined), 'es')
})

test('pickGateLanguage prefiere en si el negocio lo habilita y el navegador prefiere inglés', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const setNavigator = (value) =>
    Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true })
  try {
    setNavigator({ language: 'en-US' })
    assert.equal(pickGateLanguage(['es', 'en']), 'en')
    setNavigator({ language: 'es-EC' })
    assert.equal(pickGateLanguage(['es', 'en']), 'es')
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor)
    else delete globalThis.navigator
  }
})

// --- shouldAdoptFresh (#2, revalidación en segundo plano) ---

test('shouldAdoptFresh solo adopta datos frescos del mismo slug y distintos', () => {
  const inlined = { slug: 'cafe', name: 'Café', updatedAt: 1 }
  // Idéntico: no adoptar (evita render redundante).
  assert.equal(shouldAdoptFresh({ slug: 'cafe', name: 'Café', updatedAt: 1 }, inlined, 'cafe'), false)
  // Distinto en el mismo slug: adoptar.
  assert.equal(shouldAdoptFresh({ slug: 'cafe', name: 'Café Nuevo', updatedAt: 2 }, inlined, 'cafe'), true)
  // Slug distinto: no adoptar.
  assert.equal(shouldAdoptFresh({ slug: 'otro', name: 'Otro' }, inlined, 'cafe'), false)
  // Respuesta no válida: no adoptar.
  assert.equal(shouldAdoptFresh(null, inlined, 'cafe'), false)
  assert.equal(shouldAdoptFresh(undefined, inlined, 'cafe'), false)
})
