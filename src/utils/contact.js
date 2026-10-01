// Datos de contacto de ClyClick y utilidades de teléfono / WhatsApp.
// Compartido por la página de inicio, el panel de solicitudes y la validación
// de solicitudes en el servidor.

export const CONTACT = {
  company: 'Clyclick S.A.S',
  brand: 'ClyClick',
  whatsapp: '593978735190',
  email: 'info@clyclick.online',
  site: 'go.clyclick.online',
}

const COUNTRY_CODE = '593' // Ecuador

// Normaliza un número a dígitos con código de país (sin "+"):
//   "0978735190" → "593978735190"   (celular ecuatoriano con 0 inicial)
//   "978735190"  → "593978735190"   (celular ecuatoriano sin 0)
//   "+593 97 873 5190" → "593978735190"
//   "+1 (555) 123-4567" → "15551234567" (internacional con "+")
// Devuelve '' si no parece un teléfono válido (7 a 15 dígitos, E.164).
export function normalizePhone(input) {
  const raw = String(input || '').trim()
  if (!raw) return ''
  const international = raw.startsWith('+') || raw.startsWith('00')
  let digits = raw.replace(/\D/g, '')
  if (raw.startsWith('00')) digits = digits.slice(2)
  if (!international) {
    if (digits.startsWith('0') && digits.length === 10) digits = COUNTRY_CODE + digits.slice(1)
    else if (digits.length === 9 && digits.startsWith('9')) digits = COUNTRY_CODE + digits
  }
  // "+593 0991234567": el 0 de marcación nacional sobra tras el código de país.
  if (digits.startsWith(`${COUNTRY_CODE}0`) && digits.length === 13) digits = COUNTRY_CODE + digits.slice(4)
  if (digits.startsWith('0')) return ''
  return digits.length >= 7 && digits.length <= 15 ? digits : ''
}

// "593978735190" → "+593 97 873 5190". Otros países: "+" y los dígitos.
export function formatPhone(digits) {
  const value = String(digits || '').replace(/\D/g, '')
  if (!value) return ''
  if (value.startsWith(COUNTRY_CODE) && value.length === 12) {
    const local = value.slice(3)
    return `+${COUNTRY_CODE} ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`
  }
  return `+${value}`
}

export function whatsappLink(digits, message) {
  const number = String(digits || '').replace(/\D/g, '')
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${number}${text}`
}

// Mensaje prellenado para escribir a ClyClick desde la página de inicio.
export function contactMessage({ businessName, rubroLabel, themeName } = {}) {
  const name = String(businessName || '').trim()
  if (!name && !rubroLabel && !themeName) {
    return '¡Hola, ClyClick! 👋 Me interesa crear el perfil digital de mi negocio. ¿Me cuentan cómo funciona?'
  }
  const lines = ['¡Hola, ClyClick! 👋 Quiero crear el perfil digital de mi negocio.', '']
  if (name) lines.push(`• Negocio: ${name}`)
  if (rubroLabel) lines.push(`• Rubro: ${rubroLabel}`)
  if (themeName) lines.push(`• Estilo que me gustó: ${themeName}`)
  lines.push('', '¿Cómo empezamos?')
  return lines.join('\n')
}

export function contactWhatsappUrl(details) {
  return whatsappLink(CONTACT.whatsapp, contactMessage(details))
}

// Respuesta prellenada desde el panel a una persona que dejó una solicitud.
export function leadReplyMessage({ contactName, businessName } = {}) {
  const first = String(contactName || '').trim().split(/\s+/)[0]
  const greeting = first ? `¡Hola, ${first}! 👋` : '¡Hola! 👋'
  const business = String(businessName || '').trim()
  return `${greeting} Te escribimos de ClyClick por tu solicitud para crear el perfil digital${business ? ` de ${business}` : ''}. ¿Tienes unos minutos para conversar?`
}
