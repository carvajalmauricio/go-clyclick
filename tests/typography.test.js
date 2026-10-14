import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeBusiness } from '../functions/api/_lib.js'
import { contrastRatio, normalizeTypography, textPresentation } from '../src/utils/typography.js'
import { THEMES } from '../src/utils/themes.js'

test('conserva tipografía al guardar y limita valores inválidos', () => {
  const typography = { font: 'georgia', titleSize: 32, descriptionSize: 18, buttonSize: 20, lineHeight: 1.8, textPanel: 'dark' }
  const saved = normalizeBusiness({ name: 'Prueba', typography }).business
  assert.deepEqual(saved.typography, typography)
  assert.deepEqual(normalizeBusiness(saved).business.typography, typography)
  const invalid = normalizeTypography({ font: 'unknown', titleSize: 100, descriptionSize: -2, buttonSize: 'bad', lineHeight: Infinity })
  assert.equal(invalid.font, 'system')
  assert.equal(invalid.titleSize, 40)
  assert.equal(invalid.descriptionSize, 14)
  assert.equal(invalid.buttonSize, 16)
  assert.equal(invalid.lineHeight, 1.5)
})

test('contraste conocido y fondos no medibles se distinguen', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21)
  assert.equal(contrastRatio('#ffffff', '#ffffff'), 1)
  assert.equal(contrastRatio('#777777', '#ffffff') < 4.5, true)
  assert.equal(contrastRatio('#ffffff', 'transparent'), null)
  const business = { descriptionColor: '#ff0000', typography: { textPanel: 'dark' } }
  const panel = textPresentation(business, THEMES.vibrant)
  assert.ok(contrastRatio(panel.description, panel.background) >= 4.5)
  assert.equal(textPresentation({ ...business, typography: { textPanel: 'none' } }, THEMES.vibrant).description, '#ff0000')
})


test('respeta la fuente remota y el color adaptable al modo automático', () => {
  const theme = THEMES.vibrant
  const text = textPresentation({ font: 'poppins', autoTheme: true, descriptionColor: '#ff0000' }, theme)
  assert.match(text.family, /Poppins/)
  assert.equal(text.description, theme.subtext)
  assert.equal(textPresentation({ font: 'poppins', typography: { textPanel: 'light' } }, theme).description, '#18181b')
})
