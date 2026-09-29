import { useEffect, useRef, useState } from 'react'
import { BANKS, BANK_SECTION_ID, MAX_BANK_ACCOUNTS, getProfileSections, paymentUrl } from '../utils/banking.js'
import { readPaymentQr } from '../utils/readPaymentQr.js'
import BankLogo from './BankLogo.jsx'
import ButtonColorFields from './ButtonColorFields.jsx'
import AnimationSelector from './AnimationSelector.jsx'
import { FileButton, IconButton } from './admin/ui.jsx'
import { Icon } from './Icons.jsx'
import { FLASH_CLASS, editorItemId, useEditorFocus } from './admin/useEditorFocus.js'

const inputClass = 'w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white'

export default function BankAccountManager({ business, onChange, focus, onFocusItem }) {
  const [selectedBank, setSelectedBank] = useState('deuna')
  const latest = useRef({ business, onChange })
  latest.current = { business, onChange }
  const accounts = business.bankAccounts || []
  const sections = getProfileSections(business)
  const flash = useEditorFocus(focus, (key) => (key.startsWith('bank-') && accounts.some((account) => `bank-${account.id}` === key) ? key : ''))

  function patch(id, changes) {
    const current = latest.current
    current.onChange({ bankAccounts: (current.business.bankAccounts || []).map((account) => account.id === id ? { ...account, ...changes } : account) })
    onFocusItem?.(`bank-${id}`)
  }

  function addAccount() {
    if (accounts.length >= MAX_BANK_ACCOUNTS) return
    onChange({
      sections,
      bankAccounts: [...accounts, {
        id: crypto.randomUUID(), bank: selectedBank, label: '', holder: '', number: '',
        accountType: 'savings', identification: '', email: '', url: '', enabled: true,
        sectionId: BANK_SECTION_ID, colors: {}, animation: 'none',
      }],
    })
  }

  function move(id, direction) {
    const index = accounts.findIndex((account) => account.id === id)
    const target = index + direction
    if (target < 0 || target >= accounts.length) return
    const next = [...accounts]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange({ bankAccounts: next })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">Agrega varias cuentas de un mismo banco. Cada cuenta tendrá su propio botón en la sección Datos Bancarios.</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-gray-400">Banco para agregar
          <select value={selectedBank} onChange={(event) => setSelectedBank(event.target.value)} className={inputClass}>
            {BANKS.map((bank) => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
          </select>
        </label>
        <button type="button" disabled={accounts.length >= MAX_BANK_ACCOUNTS} onClick={addAccount} className="inline-flex items-center gap-1.5 rounded-lg bg-clickclick-orange px-4 py-2 text-xs font-semibold text-clickclick-dark hover:brightness-110 disabled:opacity-40"><Icon name="plus" size={14} />Agregar cuenta</button>
      </div>
      {accounts.length >= MAX_BANK_ACCOUNTS && <p className="text-xs text-gray-400">Límite de {MAX_BANK_ACCOUNTS} cuentas alcanzado.</p>}
      {accounts.map((account, index) => (
        <BankAccountEditor
          key={account.id}
          account={account}
          business={business}
          sections={sections}
          index={index}
          count={accounts.length}
          flash={flash === `bank-${account.id}`}
          onChange={(changes) => patch(account.id, changes)}
          onMove={(direction) => move(account.id, direction)}
          onRemove={() => onChange({ bankAccounts: accounts.filter((item) => item.id !== account.id) })}
        />
      ))}
    </div>
  )
}

function BankAccountEditor({ account, business, sections, index, count, flash, onChange, onMove, onRemove }) {
  const bank = BANKS.find((item) => item.id === account.bank)
  const [reading, setReading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const active = useRef(false)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])

  async function readQr(event) {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return
    setReading(true)
    setMessage('')
    setError('')
    try {
      const url = await readPaymentQr(file)
      if (active.current) {
        onChange({ url })
        setMessage('Enlace extraído. La imagen no se ha guardado.')
      }
    } catch (err) {
      if (active.current) setError(err.message)
    } finally {
      input.value = ''
      if (active.current) setReading(false)
    }
  }

  if (!bank) return null
  return (
    <fieldset id={editorItemId(`bank-${account.id}`)} className={`min-w-0 scroll-mt-40 rounded-xl border border-gray-700 bg-gray-900/70 p-4 pt-2 transition-shadow ${flash ? FLASH_CLASS : ''}`}>
      <legend className="px-2 text-sm font-semibold">{bank.name} · Cuenta {index + 1}</legend>
      <div className="mb-4 flex items-center gap-2">
        <BankLogo bank={bank.id} />
        <label className="flex flex-1 items-center gap-2 text-xs text-gray-300">
          <input type="checkbox" checked={account.enabled !== false} onChange={(event) => onChange({ enabled: event.target.checked })} /> Mostrar cuenta
        </label>
        <IconButton icon="chevron-up" label="Subir cuenta" onClick={() => onMove(-1)} disabled={index === 0} />
        <IconButton icon="chevron-down" label="Bajar cuenta" onClick={() => onMove(1)} disabled={index === count - 1} />
        <IconButton icon="trash" label="Eliminar cuenta" tone="danger" onClick={onRemove} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-gray-400 sm:col-span-2">Título del botón
          <input value={account.label || ''} maxLength={80} placeholder={`${bank.name} · Cuenta principal`} onChange={(event) => onChange({ label: event.target.value })} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-400">Titular
          <input value={account.holder || ''} maxLength={160} onChange={(event) => onChange({ holder: event.target.value })} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-400">Número de cuenta
          <input value={account.number || ''} inputMode="numeric" maxLength={80} onChange={(event) => onChange({ number: event.target.value })} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-400">Tipo de cuenta
          <select value={account.accountType || 'savings'} onChange={(event) => onChange({ accountType: event.target.value })} className={inputClass}><option value="savings">Ahorros</option><option value="checking">Corriente</option></select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-400">Cédula / RUC (opcional)
          <input value={account.identification || ''} maxLength={40} onChange={(event) => onChange({ identification: event.target.value })} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-400 sm:col-span-2">Correo para comprobantes (opcional)
          <input type="email" value={account.email || ''} maxLength={160} onChange={(event) => onChange({ email: event.target.value })} className={inputClass} />
        </label>
      </div>
      {bank.supportsQr && (
        <div className="mt-4 space-y-2 rounded-lg border border-gray-700 p-3">
          <label className="flex flex-col gap-1 text-xs text-gray-400">Enlace de pago (opcional)
            <input type="url" value={account.url || ''} disabled={reading} placeholder="https://..." maxLength={4096} onChange={(event) => { onChange({ url: event.target.value }); setMessage(''); setError('') }} className={inputClass} />
          </label>
          {account.url && !paymentUrl(account.url) && <p className="text-xs text-amber-300">Ingresa un enlace completo que empiece con https:// o http://.</p>}
          <FileButton label="Extraer enlace desde QR" busyLabel="Leyendo QR..." busy={reading} accept="image/png,image/jpeg,image/webp,image/gif" onFile={readQr} />
          <p className="text-xs text-gray-500">La imagen se procesa aquí y no se guarda. Puedes pegar el enlace directamente.</p>
          {account.url && <button type="button" disabled={reading} onClick={() => { onChange({ url: '' }); setMessage(''); setError('') }} className="text-xs text-gray-400 underline">Quitar enlace y mostrar datos de la cuenta</button>}
          {message && <p role="status" className="text-xs text-emerald-400">{message}</p>}
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
        </div>
      )}
      <p className="mt-3 text-xs text-gray-400">{paymentUrl(account.url) ? 'Al tocar el botón se abrirá el enlace de pago.' : 'Al tocar el botón se mostrarán el titular y los datos de esta cuenta.'}</p>
      <label className="mt-3 flex flex-col gap-1 text-xs text-gray-400">Sección de la cuenta
        <select value={account.sectionId || BANK_SECTION_ID} onChange={(event) => onChange({ sectionId: event.target.value })} className={inputClass}>
          {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
        </select>
      </label>
      <div className="mt-3">
        <AnimationSelector label="Animación de la cuenta" value={account.animation} business={business} onChange={(animation) => onChange({ animation })} />
      </div>
      <ButtonColorFields business={business} action={account} onChange={(colors) => onChange({ colors })} />
    </fieldset>
  )
}
