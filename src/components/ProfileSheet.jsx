import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { sheetColors } from '../utils/themes.js'
import { useProfileContext } from './profileContext.js'

const CLOSE_DISTANCE = 90
const CLOSE_VELOCITY = 0.5 // px/ms
const EXIT_MS = 220

// Ventana del perfil con los colores del tema. En el móvil es una hoja inferior
// que se cierra deslizándola hacia abajo; en escritorio se centra. Se cierra
// también con Esc, tocando el fondo o con el botón ×.
export default function ProfileSheet({ theme, title, subtitle, icon, onClose, children, closeLabel = 'Cerrar' }) {
  const { portalTarget, wide, embedded, fontFamily } = useProfileContext()
  const colors = sheetColors(theme)
  const titleId = useId()
  const panel = useRef(null)
  const drag = useRef(null)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [closing, setClosing] = useState(false)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  function requestClose() {
    if (closing) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) return closeRef.current()
    setClosing(true)
    setTimeout(() => closeRef.current(), EXIT_MS)
  }
  const requestCloseRef = useRef(requestClose)
  requestCloseRef.current = requestClose

  useEffect(() => {
    const previousFocus = document.activeElement
    panel.current?.focus({ preventScroll: true })
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        requestCloseRef.current()
      }
      if (event.key === 'Tab') trapFocus(event, panel.current)
    }
    document.addEventListener('keydown', onKey, true)
    // En la página pública se bloquea el scroll del fondo mientras está abierta.
    const previousOverflow = document.body.style.overflow
    if (!embedded) document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey, true)
      if (!embedded) document.body.style.overflow = previousOverflow
      previousFocus?.focus?.({ preventScroll: true })
    }
  }, [embedded])

  // --- Deslizar hacia abajo para cerrar (solo hoja móvil) -------------------
  function onPointerDown(event) {
    if (wide || event.button > 0) return
    if (event.target.closest('button, a, input, textarea, select')) return
    drag.current = { y: event.clientY, t: performance.now(), lastY: event.clientY, lastT: performance.now() }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDragging(true)
  }
  function onPointerMove(event) {
    const state = drag.current
    if (!state) return
    const dy = Math.max(0, event.clientY - state.y)
    state.velocity = (event.clientY - state.lastY) / Math.max(1, performance.now() - state.lastT)
    state.lastY = event.clientY
    state.lastT = performance.now()
    setOffset(dy)
  }
  function onPointerUp() {
    const state = drag.current
    drag.current = null
    setDragging(false)
    if (!state) return
    if (offset > CLOSE_DISTANCE || (state.velocity || 0) > CLOSE_VELOCITY) requestClose()
    else setOffset(0)
  }

  const dragProps = wide ? {} : { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, style: { touchAction: 'none' } }
  const panelTransform = closing ? undefined : offset ? `translateY(${offset}px)` : undefined

  return createPortal(
    <div
      className={`profile-sheet-overlay fixed inset-0 z-50 flex justify-center ${wide ? 'items-center p-6' : 'items-end'} ${closing ? 'is-closing' : ''}`}
      style={{ background: `rgba(0,0,0,${Math.max(0.15, 0.55 - offset / 600)})`, fontFamily }}
      onClick={requestClose}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={`profile-sheet ${wide ? 'is-centered rounded-[1.75rem]' : 'rounded-t-[1.75rem]'} relative flex max-h-[88%] w-full max-w-sm flex-col overflow-hidden shadow-2xl outline-none`}
        style={{
          background: colors.surface,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          transform: panelTransform,
          transition: dragging ? 'none' : undefined,
          '--sheet-offset': `${offset}px`,
        }}
      >
        <div className="shrink-0 px-5 pb-3 pt-2" {...dragProps}>
          {!wide && <span aria-hidden="true" className="mx-auto mb-3 block h-1.5 w-10 rounded-full" style={{ background: colors.border }} />}
          <div className={`flex items-center gap-3 ${wide ? 'pt-3' : ''}`}>
            {icon}
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="break-words text-lg font-bold leading-tight">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs" style={{ color: colors.muted }}>{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label={closeLabel}
              className="profile-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl leading-none"
              style={{ background: colors.subtle }}
            >
              ×
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-1">
          {children(colors)}
        </div>
      </div>
    </div>,
    portalTarget || document.body,
  )
}

// Botones reutilizables dentro de las ventanas.
export function SheetButton({ colors, variant = 'primary', className = '', style, ...props }) {
  const look = variant === 'primary'
    ? { background: colors.primary.background, color: colors.primary.color }
    : { border: `1px solid ${colors.border}`, color: colors.text }
  return <button type="button" className={`profile-press flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-40 ${className}`} style={{ ...look, ...style }} {...props} />
}

function trapFocus(event, container) {
  if (!container) return
  const focusable = [...container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled)
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && (document.activeElement === first || document.activeElement === container)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
