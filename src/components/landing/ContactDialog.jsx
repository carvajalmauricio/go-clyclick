import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icons.jsx'
import LeadForm from './LeadForm.jsx'
import { getRubro } from '../../utils/rubros.js'
import { THEMES } from '../../utils/themes.js'
import { CONTACT, contactWhatsappUrl, formatPhone } from '../../utils/contact.js'

// Ventana "¡Hagámoslo realidad!": escribir por WhatsApp (mensaje listo) o
// dejar los datos en el formulario. Hoja inferior en el móvil y centrada en
// escritorio; se cierra con Esc, tocando el fondo o con ×.
export default function ContactDialog({ selection, source, onClose }) {
  const titleId = useId()
  const panel = useRef(null)
  const heading = useRef(null)
  const pressedOverlay = useRef(false)
  const [view, setView] = useState('choose')
  const firstView = useRef(true)

  // Al cambiar de vista, el botón que tenía el foco desaparece: se lleva el
  // foco al título para que no se escape a la página de atrás.
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false
      return
    }
    if (view === 'choose') heading.current?.focus({ preventScroll: true })
  }, [view])
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus({ preventScroll: true })
    const onKey = (event) => {
      if (event.key === 'Escape') closeRef.current()
      if (event.key === 'Tab') trapFocus(event, panel.current)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.({ preventScroll: true })
    }
  }, [])

  const rubro = selection.rubro ? getRubro(selection.rubro) : null
  const theme = selection.theme ? THEMES[selection.theme] : null
  const whatsappUrl = contactWhatsappUrl({ businessName: selection.businessName, rubroLabel: rubro?.label, themeName: theme?.name })
  const hasSelection = selection.businessName || rubro || theme

  return createPortal(
    <div
      className="landing landing-dialog-overlay fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      // Solo cierra un clic que empieza y termina en el fondo (no al soltar
      // fuera una selección de texto hecha dentro del formulario).
      onMouseDown={(event) => { pressedOverlay.current = event.target === event.currentTarget }}
      onClick={(event) => { if (pressedOverlay.current && event.target === event.currentTarget) closeRef.current() }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="landing-dialog relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] border border-white/10 bg-[#15151c] p-6 text-white shadow-2xl outline-none sm:rounded-[1.75rem] sm:p-8"
      >
        <div className="flex items-start gap-3">
          {view === 'form' && (
            <button type="button" onClick={() => setView('choose')} aria-label="Volver" className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
              <Icon name="arrow-left" size={18} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 ref={heading} tabIndex={-1} id={titleId} className="text-2xl font-bold leading-tight outline-none">{view === 'form' ? 'Déjanos tus datos' : '¡Hagámoslo realidad!'}</h2>
            <p className="mt-1 text-sm text-white/60">{view === 'form' ? 'Te escribimos para crear tu perfil, sin compromiso.' : 'Elige cómo prefieres que conversemos.'}</p>
          </div>
          <button type="button" onClick={() => closeRef.current()} aria-label="Cerrar" className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-white/60 hover:bg-white/10 hover:text-white">×</button>
        </div>

        {hasSelection && (
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] p-3 text-sm">
            {selection.businessName && <span className="font-semibold text-white">{selection.businessName}</span>}
            {rubro && <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/80">{rubro.label}</span>}
            {theme && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/80">
                <span className="h-3 w-3 rounded-full ring-1 ring-white/30" style={{ background: theme.bgGradient || theme.bg }} /> {theme.name}
              </span>
            )}
          </div>
        )}

        {view === 'choose' ? (
          <div className="mt-6 space-y-3">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 p-4 transition hover:border-[#25D366]/60 hover:bg-[#25D366]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-[#062b16]"><Icon name="whatsapp" size={24} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-white">Escribir por WhatsApp</span>
                <span className="block text-sm text-white/60">La forma más rápida. El mensaje ya va listo.</span>
              </span>
              <Icon name="arrow-right" size={18} className="text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white" />
            </a>
            <button type="button" onClick={() => setView('form')} className="group flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-4 text-left transition hover:border-clickclick-orange/50 hover:bg-clickclick-orange/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-clickclick-orange/15 text-clickclick-orange"><Icon name="contact" size={24} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-white">Prefiero que me contacten</span>
                <span className="block text-sm text-white/60">Déjanos tus datos y te escribimos.</span>
              </span>
              <Icon name="arrow-right" size={18} className="text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white" />
            </button>
            <p className="pt-2 text-center text-xs text-white/45">
              WhatsApp {formatPhone(CONTACT.whatsapp)} · <a href={`mailto:${CONTACT.email}`} className="text-white/70 underline hover:text-white">{CONTACT.email}</a>
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <LeadForm initial={selection} source={source} autoFocus />
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

function trapFocus(event, container) {
  if (!container) return
  const focusable = [...container.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.disabled && element.tabIndex !== -1 && element.offsetParent !== null)
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!container.contains(document.activeElement)) {
    event.preventDefault()
    first.focus()
    return
  }
  if (event.shiftKey && (document.activeElement === first || document.activeElement === container)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
