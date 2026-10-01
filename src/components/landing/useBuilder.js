import { useEffect, useMemo, useRef, useState } from 'react'
import { SHOWCASE_ROTATION, getRubro, inferRubro, sampleBusiness } from '../../utils/rubros.js'
import { THEMES } from '../../utils/themes.js'
import { slugify } from '../../utils/slug.js'
import { usePrefersReducedMotion } from './shared.jsx'

export const ROTATE_MS = 3800

// Estado del "constructor" de la portada.
// - Mientras el visitante no toca nada, el teléfono rota entre negocios de
//   ejemplo (idea A).
// - Al escribir el nombre o elegir rubro o estilo, el teléfono muestra su
//   perfil en vivo (idea C). El rubro se deduce del nombre hasta que se elige
//   uno a mano, y el estilo sigue al rubro hasta que se elige uno a mano.
export function useBuilder(initialName = '') {
  const reducedMotion = usePrefersReducedMotion()
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
  const rotationRubro = SHOWCASE_ROTATION[rotation % SHOWCASE_ROTATION.length]
  const rotationRef = useRef(rotationRubro)
  rotationRef.current = rotationRubro

  const autoplay = !state.touched && !paused && !hovered && !reducedMotion
  useEffect(() => {
    if (!autoplay) return
    const id = setInterval(() => setRotation((index) => (index + 1) % SHOWCASE_ROTATION.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [autoplay])

  // Al primer toque se parte del ejemplo que se estaba viendo (sin saltos).
  const touch = (update) => setState((previous) => ({
    ...previous,
    ...update,
    touched: true,
    baseRubro: previous.touched ? previous.baseRubro : rotationRef.current,
  }))

  const inferred = inferRubro(state.name)
  const rubroId = !state.touched ? rotationRubro : state.rubroManual ? state.rubro : (inferred || state.baseRubro)
  const rubro = getRubro(rubroId)
  const themeId = state.themeManual ? state.theme : rubro.theme
  const theme = THEMES[themeId] || THEMES.vibrant
  const name = state.touched ? state.name : ''

  const business = useMemo(() => sampleBusiness({ rubro: rubroId, name, theme: themeId }), [rubroId, name, themeId])

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
    rubro,
    rubroManual: state.rubroManual,
    theme,
    themeManual: state.themeManual,
    business,
    slug: slugify(state.name) || (state.touched ? business.slug : 'tu-negocio'),
    selection,
    autoplay,
    paused,
    reducedMotion,
    rotation,
    setName: (value) => touch({ name: value }),
    setRubro: (id) => touch({ rubro: id, rubroManual: true }),
    setTheme: (id) => touch({ theme: id, themeManual: true }),
    setPaused,
    setHovered,
    goTo: (index) => setRotation(index),
  }
}
