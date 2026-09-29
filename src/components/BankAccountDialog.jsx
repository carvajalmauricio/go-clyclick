import { useState } from 'react'
import { BANKS, bankAccountDetails } from '../utils/banking.js'
import { copyText } from '../utils/clipboard.js'
import { THEMES } from '../utils/themes.js'
import BankLogo from './BankLogo.jsx'
import ProfileSheet, { SheetButton } from './ProfileSheet.jsx'

// Datos de una cuenta bancaria con los colores del tema del perfil.
export default function BankAccountDialog({ account, theme = THEMES.minimal, onClose }) {
  const [status, setStatus] = useState('')
  const bank = BANKS.find((item) => item.id === account.bank)
  const details = bankAccountDetails(account)

  async function copy(text) {
    const ok = await copyText(text)
    setStatus(ok
      ? 'Datos copiados.'
      : 'No se pudo copiar. Mantén pulsados los datos para copiarlos manualmente.')
  }

  return (
    <ProfileSheet
      theme={theme}
      title={account.label || bank?.name}
      icon={<BankLogo bank={account.bank} />}
      closeLabel="Cerrar datos bancarios"
      onClose={onClose}
    >
      {(colors) => (
        <>
          <dl className="mt-2 divide-y rounded-2xl" style={{ background: colors.subtle, borderColor: colors.border }}>
            {details.map(([label, value]) => (
              <div key={label} className="px-4 py-2.5" style={{ borderColor: colors.border }}>
                <dt className="text-xs" style={{ color: colors.muted }}>{label}</dt>
                <dd className="select-text break-words text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <SheetButton colors={colors} onClick={() => copy(account.number)} className="mt-5">Copiar número de cuenta</SheetButton>
          <SheetButton colors={colors} variant="secondary" onClick={() => copy(details.map(([label, value]) => `${label}: ${value}`).join('\n'))} className="mt-2">Copiar todos los datos</SheetButton>
          <p role="status" className="mt-2 min-h-4 text-xs" style={{ color: colors.muted }}>{status}</p>
        </>
      )}
    </ProfileSheet>
  )
}
