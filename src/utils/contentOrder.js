// Shared ordering for preset buttons, custom links and social buttons.
export function normalizeContentOrder(value, validKeys) {
  if (!Array.isArray(value)) return []
  const allowed = validKeys ? new Set(validKeys) : null
  return [...new Set(value.filter((key) => typeof key === 'string' && key.length <= 100 && (!allowed || allowed.has(key))))].slice(0, 200)
}

export function sortContent(items, order) {
  const positions = new Map(normalizeContentOrder(order).map((key, index) => [key, index]))
  return [...items].sort((a, b) => (positions.get(a.key) ?? Infinity) - (positions.get(b.key) ?? Infinity))
}

export function moveContent(items, key, targetKey) {
  const next = [...items]
  const from = next.findIndex((item) => item.key === key)
  const to = next.findIndex((item) => item.key === targetKey)
  if (from < 0 || to < 0 || from === to) return next
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
