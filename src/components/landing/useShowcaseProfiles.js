import { useEffect, useState } from 'react'
import { fetchShowcaseProfiles } from '../../utils/showcase.js'

// Una sola petición por visita, compartida por la portada y "Ejemplos reales".
let request = null

export function useShowcaseProfiles() {
  const [state, setState] = useState({ status: 'loading', items: [] })
  useEffect(() => {
    let active = true
    if (!request) {
      request = fetchShowcaseProfiles().catch((error) => {
        request = null // se reintenta en la próxima visita a la página
        throw error
      })
    }
    request
      .then((items) => { if (active) setState({ status: 'ready', items }) })
      .catch(() => { if (active) setState({ status: 'error', items: [] }) })
    return () => { active = false }
  }, [])
  return state
}

// true cuando ya se pueden reproducir fondos de video: un momento después de
// que la página terminó de cargar, y nunca si el visitante usa ahorro de datos.
export function useMediaReady(delay = 1200) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.connection?.saveData) return
    let timer
    const start = () => { timer = setTimeout(() => setReady(true), delay) }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('load', start)
    }
  }, [delay])
  return ready
}
