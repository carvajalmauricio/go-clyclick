import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './Icons.jsx'
import { copyText } from '../utils/clipboard.js'

// Hook reutilizable de "copiar con feedback". Copia el texto y expone un estado
// transitorio ('copied' cuando tuvo éxito, 'error' si no se pudo) que vuelve a
// vacío tras `resetMs`. La transición visual la maneja quien lo consume con
// clases motion-safe (el feedback es solo cambio de etiqueta, seguro para
// prefers-reduced-motion). Nunca lanza.
export function useCopy(resetMs = 1800) {
  const [state, setState] = useState('') // '' | 'copied' | 'error'
  const timer = useRef(null)

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])

  const copy = useCallback(async (text) => {
    const ok = await copyText(text)
    setState(ok ? 'copied' : 'error')
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState(''), resetMs)
    return ok
  }, [resetMs])

  return { state, copy }
}

// Botón compacto de "copiar con un toque". Muestra 'Copiado' de forma
// transitoria tras copiar. Pensado para valores concretos (número de cuenta,
// teléfono, dirección). Etiquetas en español.
export default function CopyButton({
  value,
  label = 'Copiar',
  copiedLabel = 'Copiado',
  errorLabel = 'No se pudo copiar',
  ariaLabel,
  className = '',
  iconSize = 16,
  style,
}) {
  const { state, copy } = useCopy()
  const text = state === 'copied' ? copiedLabel : state === 'error' ? errorLabel : label
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      aria-label={ariaLabel || label}
      className={`inline-flex items-center justify-center gap-1.5 motion-safe:transition ${className}`}
      style={style}
    >
      <Icon name="copy" size={iconSize} />
      <span role="status" aria-live="polite">{text}</span>
    </button>
  )
}
