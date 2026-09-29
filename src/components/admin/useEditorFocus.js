import { useEffect, useRef, useState } from 'react'

// Conecta el preview con el editor (#6). Cuando el editor recibe `focus`
// ({ key, nonce }) y la clave pertenece a este gestor (`resolve(key)` devuelve
// el id del elemento), lo abre, lo desplaza a la vista y lo resalta un momento.
export function useEditorFocus(focus, resolve, open) {
  const [flash, setFlash] = useState('')
  const timer = useRef(null)
  const resolveRef = useRef(resolve)
  resolveRef.current = resolve
  const openRef = useRef(open)
  openRef.current = open

  useEffect(() => {
    if (!focus?.key) return
    const id = resolveRef.current(focus.key)
    if (!id) return
    openRef.current?.(id)
    // Doble rAF: esperar a que la tarjeta abierta se haya pintado.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById(editorItemId(focus.key))?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }))
    setFlash(focus.key)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setFlash(''), 1800)
  }, [focus?.nonce, focus?.key])

  useEffect(() => () => clearTimeout(timer.current), [])
  return flash
}

export function editorItemId(key) {
  return `editor-item-${key}`
}

export const FLASH_CLASS = 'ring-2 ring-clickclick-orange ring-offset-2 ring-offset-gray-900'
