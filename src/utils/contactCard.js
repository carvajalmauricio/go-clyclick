export const CONTACT_CARD_FIELDS = [
  { key: 'name', label: 'Nombre del contacto', limit: 160 },
  { key: 'organization', label: 'Empresa / organización', limit: 160 },
  { key: 'category', label: 'Cargo / categoría', limit: 160 },
  { key: 'phone', label: 'Teléfono', limit: 80, type: 'tel' },
  { key: 'whatsapp', label: 'WhatsApp', limit: 80, type: 'tel' },
  { key: 'email', label: 'Correo electrónico', limit: 160, type: 'email' },
  { key: 'website', label: 'Sitio web', limit: 2048 },
  { key: 'description', label: 'Notas del contacto', limit: 1000 },
]

export function normalizeContactCard(value) {
  return Object.fromEntries(CONTACT_CARD_FIELDS.map(({ key, limit }) => [key, String(value?.[key] || '').trim().slice(0, limit)]))
}

export function copyBusinessContact(business) {
  return normalizeContactCard({ ...business, organization: business.name })
}

export function resolveContactCard(business, setting) {
  if (setting?.contactMode !== 'custom') return { slug: business.slug, ...copyBusinessContact(business) }
  // Custom fields are independent: an intentionally empty field stays empty.
  return { slug: business.slug, ...normalizeContactCard(setting.contactData) }
}

export function hasContactCard(business, setting) {
  if (setting?.contactMode === 'custom') return Boolean(String(setting.contactData?.name || '').trim())
  return Boolean(business.phone || business.email || business.whatsapp)
}
