import { normalizeButtonColors } from './buttonColors.js'
import { normalizeAnimation } from './animations.js'

export const BANK_SECTION_ID = 'bank-accounts'
export const MAX_BANK_ACCOUNTS = 30
export const BANKS = [
  { id: 'deuna', name: 'Deuna', supportsQr: true },
  { id: 'guayaquil', name: 'Banco Guayaquil', supportsQr: true },
  { id: 'produbanco', name: 'Produbanco', supportsQr: true },
  { id: 'pichincha', name: 'Banco Pichincha', supportsQr: false },
  { id: 'pacifico', name: 'Banco del Pacífico', supportsQr: false },
]

export function getProfileSections(business) {
  const sections = Array.isArray(business?.sections) ? business.sections : []
  return sections.some((section) => section.id === BANK_SECTION_ID)
    ? sections
    : [...sections, { id: BANK_SECTION_ID, title: 'Datos Bancarios' }]
}

// No convertir contenido de pago (por ejemplo EMV) ni esquemas ejecutables en URLs.
export function paymentUrl(value) {
  const text = String(value || '').trim()
  if (!/^https?:\/\//i.test(text) || text.length > 4096 || /\s/.test(text)) return ''
  try {
    const url = new URL(text)
    return url.hostname && !url.username && !url.password ? url.href : ''
  } catch {
    return ''
  }
}

export function validateBankAccounts(accounts) {
  if (accounts == null) return ''
  if (!Array.isArray(accounts)) return 'La lista de cuentas bancarias no es válida.'
  if (accounts.length > MAX_BANK_ACCOUNTS) return `Puedes registrar hasta ${MAX_BANK_ACCOUNTS} cuentas.`
  const ids = new Set()
  for (const [index, account] of accounts.entries()) {
    const bank = BANKS.find((item) => item.id === account?.bank)
    const prefix = `Cuenta ${index + 1}`
    if (!bank) return `${prefix}: selecciona un banco válido.`
    const id = String(account.id || '').trim()
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id) || ids.has(id)) return `${prefix}: identificador inválido o duplicado.`
    ids.add(id)
    const url = String(account.url || '').trim()
    if (url && (!bank.supportsQr || !paymentUrl(url))) return `${prefix}: ingresa un enlace completo y válido (https://...).`
    if (!url && (!String(account.number || '').trim() || !String(account.holder || '').trim())) {
      return `${prefix}: agrega el titular y el número de cuenta, o un enlace de pago.`
    }
  }
  return ''
}

export function normalizeBankAccounts(accounts, sections) {
  const sectionIds = new Set(sections.map((section) => section.id))
  return (accounts || []).map((account) => ({
    id: String(account.id).trim(),
    bank: account.bank,
    label: String(account.label || '').trim().slice(0, 80),
    holder: String(account.holder || '').trim().slice(0, 160),
    number: String(account.number || '').trim().slice(0, 80),
    accountType: ['savings', 'checking'].includes(account.accountType) ? account.accountType : 'savings',
    identification: String(account.identification || '').trim().slice(0, 40),
    email: String(account.email || '').trim().slice(0, 160),
    url: paymentUrl(account.url),
    enabled: account.enabled !== false,
    sectionId: sectionIds.has(account.sectionId) ? account.sectionId : BANK_SECTION_ID,
    animation: normalizeAnimation(account.animation),
    colors: normalizeButtonColors(account.colors),
  }))
}

export function buildBankActions(business) {
  const accounts = Array.isArray(business?.bankAccounts) ? business.bankAccounts : []
  const sections = getProfileSections(business)
  return accounts.flatMap((account) => {
    const bank = BANKS.find((item) => item.id === account.bank)
    if (!bank || account.enabled === false) return []
    const url = bank.supportsQr ? paymentUrl(account.url) : ''
    if (!url && !(account.number?.trim() && account.holder?.trim())) return []
    return [{
      key: `bank-${account.id}`,
      label: account.label || bank.name,
      bank: bank.id,
      bankAccount: account,
      url,
      sectionId: sections.some((section) => section.id === account.sectionId) ? account.sectionId : BANK_SECTION_ID,
      animation: normalizeAnimation(account.animation),
      colors: account.colors,
      layout: 'classic',
    }]
  })
}

export function bankAccountDetails(account) {
  const bank = BANKS.find((item) => item.id === account.bank)
  return [
    ['Banco', bank?.name || ''],
    ['Titular', account.holder],
    ['Tipo de cuenta', account.accountType === 'checking' ? 'Corriente' : 'Ahorros'],
    ['Número de cuenta', account.number],
    ['Cédula / RUC', account.identification],
    ['Correo', account.email],
  ].filter(([, value]) => value)
}
