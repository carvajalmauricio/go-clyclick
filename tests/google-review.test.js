import assert from 'node:assert/strict'
import test from 'node:test'
import { buildActions, googleReviewUrl } from '../src/utils/links.js'
import { normalizeBusiness } from '../functions/api/_lib.js'

const placeId = 'ChIJgUbEo8cfqokR5lP9_Wh_DaM'
const target = `https://search.google.com/local/writereview?placeid=${placeId}`

test('review destinations accept Place IDs and preserve existing review links', () => {
  assert.equal(googleReviewUrl(`  ${placeId}  `), target)
  const otherId = 'GhIJQWDl0CIeQUARxks3icF8U8A'
  assert.equal(googleReviewUrl(otherId), `https://search.google.com/local/writereview?placeid=${otherId}`)
  for (const url of ['https://g.page/r/example/review', target, 'https://maps.app.goo.gl/example']) {
    assert.equal(googleReviewUrl(url), url)
  }
  assert.equal(googleReviewUrl('g.page/r/example/review'), 'https://g.page/r/example/review')
})

test('legacy profiles and saved general destinations resolve a Place ID', () => {
  const raw = { name: 'Test', googleReviewUrl: placeId }
  assert.equal(buildActions(raw).find((action) => action.key === 'review').url, target)
  const saved = normalizeBusiness(raw)
  assert.equal(saved.ok, true)
  assert.equal(saved.business.googleReviewUrl, placeId)
  assert.equal(buildActions(saved.business).find((action) => action.key === 'review').url, target)
})

test('independent review buttons keep their own URL or Place ID after saving again', () => {
  const saved = normalizeBusiness({ name: 'Test', googleReviewUrl: 'https://g.page/r/general/review', actionSettingsVersion: 2,
    actionSettings: [{ id: 'branch-a', type: 'review', destination: placeId },
      { id: 'branch-b', type: 'review', destination: 'https://g.page/r/branch-b/review' },
      { id: 'general', type: 'review' }],
  })
  assert.equal(saved.ok, true)
  const again = normalizeBusiness(saved.business)
  assert.equal(again.ok, true)
  assert.equal(again.business.actionSettings[0].destination, placeId)
  assert.deepEqual(buildActions(again.business).map((action) => action.url), [target, 'https://g.page/r/branch-b/review', 'https://g.page/r/general/review'])
})

test('unsafe review inputs are never turned into clickable URLs', () => {
  for (const input of ['', 'javascript:alert(1)', 'data:text/html,script', 'two words', 'https://user:pass@example.com']) {
    assert.equal(googleReviewUrl(input), '')
    assert.equal(buildActions({ name: 'Test', googleReviewUrl: input }).some((action) => action.key === 'review'), false)
  }
  assert.equal(normalizeBusiness({ name: 'Test', actionSettingsVersion: 2, actionSettings: [{ id: 'review', type: 'review', destination: 'javascript:alert(1)' }] }).ok, false)
})
