// Genera un archivo vCard (.vcf) para guardar el contacto del negocio en el móvil.

export function buildVCard(business) {
  const b = business || {}
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCard(b.name || '')}`,
    `ORG:${escapeVCard(b.name || '')}`,
  ]

  if (b.category) lines.push(`TITLE:${escapeVCard(b.category)}`)
  if (b.phone) lines.push(`TEL;TYPE=CELL:${escapeVCard(b.phone)}`)
  if (b.whatsapp) lines.push(`TEL;TYPE=WORK:${escapeVCard(b.whatsapp)}`)
  if (b.email) lines.push(`EMAIL:${escapeVCard(b.email)}`)
  if (b.website) lines.push(`URL:${escapeVCard(b.website)}`)
  if (b.description) lines.push(`NOTE:${escapeVCard(b.description)}`)

  lines.push('END:VCARD')
  return lines.join('\r\n')
}

// Descarga la vCard como archivo .vcf
export function downloadVCard(business) {
  const vcard = buildVCard(business)
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${business.slug || 'contacto'}.vcf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function escapeVCard(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}
