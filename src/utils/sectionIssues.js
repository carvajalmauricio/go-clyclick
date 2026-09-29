// Avance por sección del editor (#14): qué le falta a cada sección.
// level 'error' bloquea la publicación; 'warn' es un aviso (el elemento no se
// mostrará o se verá incompleto); 'info' es solo informativo y no cuenta como
// pendiente (p. ej. botones fijos sin destino, que simplemente no se muestran).
import { ACTION_DEFINITIONS, getActionSettings } from './links.js'
import { validateBankAccounts } from './banking.js'

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function getSectionIssues(business) {
  const b = business || {}
  const issues = { basic: [], slides: [], actions: [], bank: [], contact: [], design: [] }

  if (!String(b.name || '').trim()) issues.basic.push({ level: 'error', text: 'Falta el nombre del negocio' })
  if (!b.logo) issues.basic.push({ level: 'warn', text: 'Sin logo' })

  const slides = Array.isArray(b.heroSlides?.items) ? b.heroSlides.items : []
  if (b.heroSlides?.enabled && slides.length === 0) issues.slides.push({ level: 'warn', text: 'Activado sin slides' })
  const untitled = b.heroSlides?.enabled ? slides.filter((slide) => !String(slide.title || '').trim()).length : 0
  if (untitled) issues.slides.push({ level: 'warn', text: `${plural(untitled, 'slide', 'slides')} sin título` })

  const definitions = new Map(ACTION_DEFINITIONS.map((item) => [item.type, item]))
  const missing = getActionSettings(b).filter((item) => {
    if (item.enabled === false) return false
    if (item.type === 'contact') return !(b.phone || b.email || b.whatsapp)
    return !b[definitions.get(item.type)?.field]
  }).length
  if (missing) issues.actions.push({ level: 'info', text: `${plural(missing, 'botón activo', 'botones activos')} sin destino (no se muestran)` })
  const links = (Array.isArray(b.links) ? b.links : []).filter((link) => link && link.enabled !== false)
  const noUrl = links.filter((link) => !String(link.url || '').trim()).length
  if (noUrl) issues.actions.push({ level: 'warn', text: `${plural(noUrl, 'enlace', 'enlaces')} sin URL` })
  const noTitle = links.filter((link) => String(link.url || '').trim() && !String(link.title || '').trim()).length
  if (noTitle) issues.actions.push({ level: 'warn', text: `${plural(noTitle, 'enlace', 'enlaces')} sin título` })

  const bankError = validateBankAccounts(b.bankAccounts)
  if (bankError) issues.bank.push({ level: 'error', text: bankError })

  if (b.email && !EMAIL.test(String(b.email).trim())) issues.contact.push({ level: 'warn', text: 'El email no parece válido' })

  if (b.ageGate?.enabled && !Number.isFinite(Number(b.ageGate.minAge))) issues.design.push({ level: 'warn', text: 'Puerta de edad sin edad mínima' })

  return issues
}

// Pendientes reales (sin los informativos).
export function pendingIssues(list = []) {
  return list.filter((issue) => issue.level !== 'info')
}

export function hasErrors(list = []) {
  return list.some((issue) => issue.level === 'error')
}
