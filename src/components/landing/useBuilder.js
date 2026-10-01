import { useEffect, useMemo, useRef, useState } from 'react'
import { getRubro, inferRubro, sampleBusiness } from '../../utils/rubros.js'
import { heroRotation } from '../../utils/showcase.js'
import { THEMES } from '../../utils/themes.js'
import { slugify } from '../../utils/slug.js'
import { useInView, usePrefersReducedMotion } from './shared.jsx'

export const ROTATE_MS = 4000

// Estado del teléfono de la portada.
// - Mientras el visitante no toca nada, el teléfono va mostrando los perfiles
//   REALES publicados, uno cada pocos segundos (idea A). Solo si no hay
//   ninguno se usan ejemplos por rubro.
// - Al escribir el nombre o elegir rubro o estilo, muestra el perfil del
//   visitante en vivo (idea C). El rubro se deduce del nombre hasta que se
//   elige uno a mano, y el estilo sigue al rubro hasta que se elige a mano.
export function useBuilder(initialName = '', showcase = { status: 'ready', items: [] }) {
  const reducedMotion = usePrefersReducedMotion()
  const [phoneRef, phoneVisible] = useInView({ once: false })
  const [rotation, setRotation] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [state, setState] = useState(() => ({
    name: initialName,
    rubro: '',
    theme: '',
    rubroManual: false,
    themeManual: false,
    touched: Boolean(initialName),
    baseRubro: 'otro',
  }))

  const loading = showcase.status === 'loading'
  const slides = useMemo(() => heroRotation(showcase.items), [showcase.items])
  const index = rotation % slides.length
  const current = slides[index]
  const currentRef = useRef(current)
  currentRef.current = current

  // Avanza mientras se ve el teléfono y nadie lo está mirando de cerca (el
  // mouse encima pausa) ni pidió pausa o movimiento reducido.
  const autoplay = !state.touched && !paused && !hovered && !reducedMotion && !loading && phoneVisible && slides.length > 1
  useEffect(() => {
    if (!autoplay) return
    const id = setTimeout(() => setRotation((value) => (value + 1) % slides.length), ROTATE_MS)
    return () => clearTimeout(id)
  }, [autoplay, rotation, slides.length])

  // Al primer toque, el perfil del visitante parte de una plantilla genérica
  // (o del rubro del ejemplo que se veía, si no hay perfiles reales).
  const touch = (update) => setState((previous) => ({
    ...previous,
    ...update,
    touched: true,
    baseRubro: previous.touched ? previous.baseRubro : (currentRef.current?.kind === 'sample' ? currentRef.current.id : 'otro'),
  }))

  const inferred = inferRubro(state.name)
  const rubroId = state.rubroManual ? state.rubro : (inferred || state.baseRubro)
  const rubro = getRubro(rubroId)
  const themeId = state.themeManual ? state.theme : rubro.theme
  const theme = THEMES[themeId] || THEMES.vibrant
  const preview = useMemo(
    () => sampleBusiness({ rubro: rubroId, name: state.name.trim() || 'Tu negocio', theme: themeId }),
    [rubroId, state.name, themeId],
  )

  // Lo que se envía a WhatsApp y al formulario: solo lo que el visitante
  // escribió o eligió (el rubro solo si lo eligió o se deduce del nombre).
  const chosenRubro = state.rubroManual ? state.rubro : inferred
  const selection = useMemo(() => ({
    businessName: state.name.trim(),
    rubro: chosenRubro || '',
    theme: state.touched ? themeId : '',
  }), [state.name, chosenRubro, state.touched, themeId])

  return {
    name: state.name,
    touched: state.touched,
    loading,
    slides,
    index,
    current,
    rubro,
    theme,
    business: state.touched ? preview : current.business,
    transitionKey: state.touched ? `preview-${rubroId}-${themeId}` : `${current.kind}-${current.id}`,
    slug: slugify(state.name) || 'tu-negocio',
    selection,
    autoplay,
    paused,
    reducedMotion,
    phoneRef,
    setName: (value) => touch({ name: value }),
    setRubro: (id) => touch({ rubro: id, rubroManual: true }),
    setTheme: (id) => touch({ theme: id, themeManual: true }),
    setPaused,
    setHovered,
    goTo: (value) => setRotation(value),
  }
}
