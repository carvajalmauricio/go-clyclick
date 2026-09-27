// Genera un archivo vCard (.vcf) para guardar el contacto del negocio en el móvil.

export function buildVCard(business) {
  const b = business || {}
  const name = String(b.name || '').trim() || 'Negocio'
  const phone = String(b.phone || '').trim()
  const whatsapp = String(b.whatsapp || '').trim()
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCard(name)};;;;`,
    `FN:${escapeVCard(name)}`,
    `ORG:${escapeVCard(name)}`,
  ]

  if (b.category) lines.push(`TITLE:${escapeVCard(b.category)}`)
  if (phone) lines.push(`TEL;TYPE=CELL:${escapeVCard(phone)}`)
  if (whatsapp && onlyDigits(whatsapp) !== onlyDigits(phone)) lines.push(`TEL;TYPE=WORK:${escapeVCard(whatsapp)}`)
  if (b.email) lines.push(`EMAIL:${escapeVCard(b.email)}`)
  if (b.website) lines.push(`URL:${normalizeWebsite(b.website)}`)
  if (b.description) lines.push(`NOTE:${escapeVCard(b.description)}`)

  lines.push('END:VCARD')
  return `${lines.map(foldLine).join('\r\n')}\r\n`
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
  // Dar tiempo al navegador móvil para consumir la URL tras iniciar la descarga.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function escapeVCard(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

function onlyDigits(value) {
  return value.replace(/\D/g, '')
}

function normalizeWebsite(value) {
  const website = String(value).trim()
  const url = /^https?:\/\//i.test(website) ? website : `https://${website}`
  return encodeURI(url).replace(/\\/g, '%5C')
}

// vCard 3.0 recomienda líneas físicas de hasta 75 octetos; no dividir UTF-8.
function foldLine(line) {
  const encoder = new TextEncoder()
  let result = ''
  let octets = 0
  for (const character of line) {
    const size = encoder.encode(character).length
    if (octets + size > 75) {
      result += '\r\n '
      octets = 1
    }
    result += character
    octets += size
  }
  return result
}
