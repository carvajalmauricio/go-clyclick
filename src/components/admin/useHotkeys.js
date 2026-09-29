import { useEffect, useRef } from 'react'

// Atajos de teclado del panel (#16). `bindings` es un objeto como
// { 'mod+s': fn, 'mod+z': fn, 'mod+shift+z': fn, escape: fn }, donde `mod` es
// Ctrl en Windows/Linux y ⌘ en Mac. Si el manejador devuelve false, el evento
// sigue su curso normal (no se llama a preventDefault).
export function useHotkeys(bindings, enabled = true) {
  const latest = useRef(bindings)
  latest.current = bindings

  useEffect(() => {
    if (!enabled) return
    function onKeyDown(event) {
      if (event.defaultPrevented || event.isComposing) return
      const combo = comboFromEvent(event)
      const handler = latest.current[combo]
      if (!handler) return
      if (handler(event) === false) return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}

export function comboFromEvent(event) {
  const parts = []
  if (event.ctrlKey || event.metaKey) parts.push('mod')
  if (event.shiftKey) parts.push('shift')
  if (event.altKey) parts.push('alt')
  parts.push(String(event.key || '').toLowerCase())
  return parts.join('+')
}

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '')
export const MOD_LABEL = isMac ? '⌘' : 'Ctrl'
