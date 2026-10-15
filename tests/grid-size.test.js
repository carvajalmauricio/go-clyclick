import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { normalizeBusiness } from '../functions/api/_lib.js'
import { buildActions } from '../src/utils/links.js'
import { gridDimensions, normalizeGridScale, buttonRadius, scaleCssPixels, BUTTON_SHAPES } from '../src/utils/buttonStyles.js'
import { trainingIconSvg } from '../src/utils/trainingIcons.js'

test('grid size is bounded to a column and scales content proportionally', () => {
  assert.equal(normalizeGridScale(undefined), 1)
  assert.equal(normalizeGridScale('bad'), 1)
  assert.equal(normalizeGridScale(-1), .6)
  assert.equal(normalizeGridScale(5), 1)
  const normal = gridDimensions(1, 18)
  const small = gridDimensions(.75, 18)
  assert.equal(small.width, '75%')
  for (const key of ['icon', 'fontSize', 'paddingX', 'paddingY']) assert.equal(small[key], normal[key] * .75)
})

test('all corner shapes stay valid when scaled, including asymmetric radii and circles', () => {
  assert.equal(scaleCssPixels('16px', .75), '12px')
  assert.equal(scaleCssPixels('28px 8px 28px 8px', .75), '21px 6px 21px 6px')
  assert.equal(scaleCssPixels('50%', .75), '50%')
  assert.equal(scaleCssPixels('5px 5px 0 #222222', .6), '3px 3px 0 #222222')
  for (const shape of BUTTON_SHAPES) {
    for (const layout of ['grid', 'classic', 'featured', 'icon']) {
      const radius = scaleCssPixels(buttonRadius(shape.value, layout), layout === 'grid' ? .75 : 1)
      assert.ok(!String(radius).includes('NaN'))
      assert.equal(scaleCssPixels(buttonRadius(shape.value, layout), 1), buttonRadius(shape.value, layout))
    }
  }
})

test('individual grid sizes and training icons survive saving and editing', () => {
  const payload = { name: 'C7', actionSettingsVersion: 2, actionSettings: [
    { id: 'review', type: 'review', destination: 'https://example.com/review', layout: 'grid', gridScale: .7 },
  ], links: [
    { id: 'system', title: 'Nuestro sistema', url: 'https://example.com/nuestro-sistema/', layout: 'grid', gridScale: .85, icon: 'training-system' },
    { id: 'programs', title: 'Programas', url: 'https://example.com/#join', layout: 'grid', gridScale: 1, icon: 'training-programs' },
  ] }
  const saved = normalizeBusiness(payload)
  assert.equal(saved.ok, true)
  const again = normalizeBusiness(saved.business)
  assert.equal(again.ok, true)
  assert.deepEqual(buildActions(again.business).map((item) => item.gridScale), [.7, .85, 1])
  assert.deepEqual(again.business.links.map((link) => link.icon), ['training-system', 'training-programs'])
  assert.deepEqual(buildActions(again.business), buildActions(saved.business))
})

test('legacy grid buttons keep their existing size and out-of-range inputs are clamped', () => {
  const saved = normalizeBusiness({ name: 'Legacy', links: [
    { id: 'old', title: 'Old grid', url: 'https://example.com', layout: 'grid' },
    { id: 'large', title: 'Too large', url: 'https://example.com', layout: 'grid', gridScale: 999 },
    { id: 'small', title: 'Too small', url: 'https://example.com', layout: 'grid', gridScale: 0 },
  ] }).business
  assert.deepEqual(saved.links.map((link) => link.gridScale), [1, 1, .6])
})

test('standalone training assets match the in-app geometry and contain no visible text', () => {
  for (const [icon, filename] of [['training-system', 'c7-nuestro-sistema'], ['training-programs', 'c7-programas']]) {
    const svg = readFileSync(new URL(`../public/icons/${filename}.svg`, import.meta.url), 'utf8')
    assert.equal(svg, trainingIconSvg(icon))
    assert.doesNotMatch(svg, /<text|<image|<rect[^>]*fill=/)
    assert.equal(readFileSync(new URL(`../public/icons/${filename}.png`, import.meta.url)).subarray(1, 4).toString(), 'PNG')
  }
})
