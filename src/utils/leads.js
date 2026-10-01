// Solicitudes de perfil (leads) que llegan desde la página de inicio.
// Validación compartida por el formulario (navegador) y el servidor, estados
// del panel y conversión de una solicitud en un perfil nuevo.
import { THEMES } from './themes.js'
import { getRubro, isRubro, rubroActionSettings } from './rubros.js'
import { normalizePhone } from './contact.js'

export const LEAD_KEY_PREFIX = 'lead:'
export const LEAD_ID_PATTERN = /^[a-z0-9]{8,16}-[a-z0-9]{6,12}$/

export const LEAD_STATUSES = [
  { value: 'new', label: 'Nueva' },
  { value: 'contacted', label: 'Contactada' },
  { value: 'won', label: 'Perfil creado' },
  { value: 'discarded', label: 'Descartada' },
]

// Dónde se llenó el formulario (para saber qué funciona mejor).
export const LEAD_SOURCES = {
  hero: 'Portada (vista previa)',
  contact: 'Sección de contacto',
  showcase: 'Ejemplos reales',
  notfound: 'Enlace disponible',
}

export const LEAD_LIMITS = { contactName: 80, businessName: 80, email: 120, message: 500, note: 500 }

// Tiempo mínimo entre que se muestra el formulario y se envía (anti-bots).
export const MIN_FILL_MS = 2000

// Solo caracteres habituales: evita que un correo como "a@b.co?cc=..." meta
// parámetros en el enlace mailto: del panel o en la vCard del perfil.
const EMAIL_PATTERN = /^[a-z0-9._+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/

// Una línea: sin caracteres de control y con espacios colapsados.
function cleanLine(value, max) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

// Texto libre: conserva saltos de línea (máximo uno en blanco seguido).
function cleanText(value, max) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max)
}

// Devuelve { ok: true, lead } con los datos limpios o { ok: false, errors }
// con un mensaje por campo.
export function validateLead(input) {
  const data = input && typeof input === 'object' ? input : {}
  const contactName = cleanLine(data.contactName, LEAD_LIMITS.contactName)
  const businessName = cleanLine(data.businessName, LEAD_LIMITS.businessName)
  const whatsapp = normalizePhone(data.whatsapp)
  const email = cleanLine(data.email, LEAD_LIMITS.email).toLowerCase()
  const message = cleanText(data.message, LEAD_LIMITS.message)
  const errors = {}
  if (contactName.length < 2) errors.contactName = 'Escribe tu nombre.'
  if (businessName.length < 2) errors.businessName = 'Escribe el nombre de tu negocio.'
  if (!whatsapp) errors.whatsapp = 'Escribe un número de WhatsApp válido, por ejemplo 0991234567.'
  if (email && !EMAIL_PATTERN.test(email)) errors.email = 'Revisa tu correo, por ejemplo nombre@correo.com.'
  if (Object.keys(errors).length) return { ok: false, errors }
  return {
    ok: true,
    lead: {
      contactName,
      businessName,
      whatsapp,
      email,
      rubro: isRubro(data.rubro) ? data.rubro : 'otro',
      theme: typeof data.theme === 'string' && Object.prototype.hasOwnProperty.call(THEMES, data.theme) ? data.theme : '',
      message,
      source: Object.prototype.hasOwnProperty.call(LEAD_SOURCES, data.source) ? data.source : 'contact',
    },
  }
}

// Identificador "<tiempo invertido base36>-<aleatorio>": KV lista las claves en
// orden alfabético, así que las solicitudes más recientes salen primero (si
// alguna vez hay más de las que el panel puede listar, se omiten las viejas).
const MAX_TIME = 36 ** 9 - 1
export function newLeadId(now = Date.now()) {
  const random = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2))
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
    .slice(0, 10)
  return `${(MAX_TIME - now).toString(36).padStart(9, '0')}-${random.padEnd(6, '0')}`
}

export function createLeadRecord(lead, now = Date.now(), id = newLeadId(now)) {
  return { id, ...lead, status: 'new', note: '', slug: '', createdAt: now, updatedAt: now }
}

// Cambios permitidos desde el panel: estado, nota interna y perfil creado.
export function applyLeadUpdate(lead, changes = {}, now = Date.now()) {
  const next = { ...lead }
  if (LEAD_STATUSES.some((status) => status.value === changes.status)) next.status = changes.status
  if (changes.note !== undefined) next.note = cleanText(changes.note, LEAD_LIMITS.note)
  if (changes.slug !== undefined) {
    const slug = String(changes.slug || '').trim()
    next.slug = /^[a-z0-9-]{1,80}$/.test(slug) ? slug : ''
  }
  next.updatedAt = now
  return next
}

// --- Metadatos de KV ----------------------------------------------------------
// Cada solicitud es una clave `lead:<id>`. Sus metadatos (máx. 1024 bytes)
// llevan el resumen para que el panel las liste con una sola llamada a
// list(). Si el mensaje o la nota no caben, el panel lee la clave completa.

const MAX_METADATA_BYTES = 1000
const byteLength = (value) => new TextEncoder().encode(JSON.stringify(value)).length

export function leadMetadata(lead) {
  const base = {
    v: 1,
    n: lead.contactName,
    b: lead.businessName,
    w: lead.whatsapp,
    e: lead.email,
    r: lead.rubro,
    t: lead.theme,
    s: lead.status,
    o: lead.source,
    sl: lead.slug,
    c: lead.createdAt,
    u: lead.updatedAt,
  }
  const complete = { ...base, m: lead.message, no: lead.note, f: 1 }
  if (byteLength(complete) <= MAX_METADATA_BYTES) return complete
  if (byteLength(base) <= MAX_METADATA_BYTES) return base
  return { v: 1, s: lead.status, c: lead.createdAt, u: lead.updatedAt }
}

// { complete, lead } a partir de los metadatos; complete=false indica que hay
// que leer el valor completo de la clave.
export function leadFromMetadata(id, meta) {
  if (!meta || typeof meta !== 'object' || meta.v !== 1) return { complete: false, lead: null }
  const lead = {
    id,
    contactName: meta.n || '',
    businessName: meta.b || '',
    whatsapp: meta.w || '',
    email: meta.e || '',
    rubro: meta.r || 'otro',
    theme: meta.t || '',
    status: meta.s || 'new',
    source: meta.o || 'contact',
    slug: meta.sl || '',
    message: meta.m || '',
    note: meta.no || '',
    createdAt: meta.c || 0,
    updatedAt: meta.u || meta.c || 0,
  }
  return { complete: meta.f === 1, lead }
}

// --- Perfil nuevo a partir de una solicitud ----------------------------------
// Precarga nombre, categoría, estilo, WhatsApp, correo y los textos de los
// botones típicos del rubro. No se muestra en la página de inicio hasta que se
// active esa opción en el editor.
export function leadToBusiness(lead) {
  const rubro = getRubro(lead?.rubro)
  const theme = lead?.theme && Object.prototype.hasOwnProperty.call(THEMES, lead.theme) ? lead.theme : rubro.theme
  return {
    name: lead?.businessName || '',
    category: rubro.id === 'otro' ? '' : rubro.category,
    theme,
    background: { type: 'theme', pattern: THEMES[theme].pattern || 'none', overlay: 0.25 },
    buttonStyle: { ...rubro.buttonStyle },
    whatsapp: lead?.whatsapp ? `+${lead.whatsapp}` : '',
    email: lead?.email || '',
    actionSettings: rubroActionSettings(rubro, { enableRest: true }),
    showcase: false,
  }
}
