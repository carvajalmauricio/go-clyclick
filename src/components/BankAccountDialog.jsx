import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BANKS, bankAccountDetails } from '../utils/banking.js'
import BankLogo from './BankLogo.jsx'

export default function BankAccountDialog({ account, onClose }) {
  const dialog = useRef(null)
  const titleId = useId()
  const [status, setStatus] = useState('')
  const bank = BANKS.find((item) => item.id === account.bank)
  const details = bankAccountDetails(account)

  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    element.showModal()
    return () => { element.close(); previousFocus?.focus() }
  }, [])

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('Datos copiados.')
    } catch {
      setStatus('No se pudo copiar. Mantén pulsados los datos para copiarlos manualmente.')
    }
  }

  return createPortal(
    <dialog ref={dialog} aria-labelledby={titleId} onCancel={onClose} onClick={(event) => { if (event.target === dialog.current) onClose() }} className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-2xl bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-black/60">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <BankLogo bank={account.bank} />
          <h2 id={titleId} className="min-w-0 flex-1 break-words text-lg font-bold">{account.label || bank?.name}</h2>
          <button autoFocus type="button" onClick={onClose} aria-label="Cerrar datos bancarios" className="h-9 w-9 shrink-0 rounded-full bg-gray-100 text-xl">×</button>
        </div>
        <dl className="mt-5 space-y-3">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="select-text break-words text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <button type="button" onClick={() => copy(account.number)} className="mt-5 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white">Copiar número de cuenta</button>
        <button type="button" onClick={() => copy(details.map(([label, value]) => `${label}: ${value}`).join('\n'))} className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold">Copiar todos los datos</button>
        <p role="status" className="mt-2 text-xs text-gray-600">{status}</p>
      </div>
    </dialog>,
    document.body,
  )
}
