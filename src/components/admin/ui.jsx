import { useId, useRef } from 'react'
import { Icon } from '../Icons.jsx'

// Piezas visuales compartidas por el panel admin para mantener un estilo único.

export const inputCls =
  'w-full rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-2 text-sm text-white placeholder-gray-500 transition focus:border-clickclick-orange focus:outline-none focus:ring-2 focus:ring-clickclick-orange/40 disabled:cursor-not-allowed disabled:opacity-60'

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-gray-300">{label}</span>
      {children}
      {hint && <span className="text-[11px] leading-snug text-gray-500">{hint}</span>}
    </label>
  )
}

// Tarjeta plegable del formulario. `summary` resume el contenido cuando está cerrada.
export function SectionCard({ id, icon, title, description, summary, open, onToggle, children }) {
  const contentId = useId()
  return (
    <section id={id} className="scroll-mt-40 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-gray-800/40 sm:px-5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clickclick-orange/10 text-clickclick-orange">
          <Icon name={icon} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-white">{title}</span>
          <span className="block truncate text-xs text-gray-400">{open ? description : summary || description}</span>
        </span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} className="shrink-0 text-gray-500" />
      </button>
      {open && (
        <div id={contentId} className="flex flex-col gap-4 border-t border-gray-800 px-4 py-5 sm:px-5">
          {children}
        </div>
      )}
    </section>
  )
}

export function SubHeading({ children }) {
  return <p className="pt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">{children}</p>
}

// Botón de subida con estilo propio (reemplaza el input nativo "Choose file").
export function FileButton({ label, busyLabel = 'Subiendo...', busy, accept, onFile, disabled, variant = 'secondary' }) {
  const input = useRef(null)
  const styles = variant === 'primary'
    ? 'bg-clickclick-orange text-clickclick-dark hover:brightness-110'
    : 'border border-gray-700 bg-gray-800 text-gray-200 hover:border-clickclick-orange hover:text-white'
  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={disabled || busy}
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${styles}`}
      >
        {busy ? <Spinner /> : <Icon name="upload" size={14} />}
        {busy ? busyLabel : label}
      </button>
      <input ref={input} type="file" accept={accept} onChange={onFile} className="hidden" tabIndex={-1} />
    </>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" aria-label={label} />
      <span className="h-6 w-11 rounded-full bg-gray-700 transition after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-clickclick-orange peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-clickclick-orange/50" />
    </label>
  )
}

export function IconButton({ icon, label, onClick, disabled, tone = 'default', size = 16 }) {
  const tones = {
    default: 'text-gray-400 hover:bg-gray-800 hover:text-white',
    danger: 'text-red-400 hover:bg-red-500/10 hover:text-red-300',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition disabled:pointer-events-none disabled:opacity-25 ${tones[tone]}`}
    >
      <Icon name={icon} size={size} />
    </button>
  )
}

export function Spinner({ className = '' }) {
  return <span aria-hidden="true" className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />
}
