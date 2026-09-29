import { useCallback, useEffect, useRef, useState } from 'react'
import { getHeroSlides, normalizeInterval } from '../utils/heroSlides.js'
import { descriptionColor } from '../utils/heroDescription.js'
import { logoPixels, logoRadius, normalizeHeader } from '../utils/header.js'

// Re-exporta el helper puro para compatibilidad con importadores previos.
export { descriptionColor }

const TRANSITION_MS = 500
const SWIPE_THRESHOLD = 40

// Tarjeta de presentación del perfil. Con un solo slide se comporta como la
// presentación estática de siempre; con varios, rota automáticamente cada
// `interval` segundos y permite deslizar a izquierda/derecha.
export default function HeroCarousel({ business, theme, compact }) {
  const slides = getHeroSlides(business)
  const interval = normalizeInterval(business.heroSlides?.interval) * 1000
  const count = slides.length

  if (count <= 1) {
    return <HeroSlide slide={slides[0]} business={business} theme={theme} compact={compact} />
  }
  return <Carousel slides={slides} business={business} theme={theme} compact={compact} interval={interval} />
}

function Carousel({ slides, business, theme, compact, interval }) {
  const count = slides.length
  // `pos` puede valer `count`: es un clon del primer slide que permite que el
  // paso último → primero siga desplazándose de derecha a izquierda.
  const [pos, setPos] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef(null)
  const reducedMotion = usePrefersReducedMotion()
  const duration = reducedMotion ? 0 : TRANSITION_MS

  // Si se eliminan slides desde el editor, mantener la posición dentro de rango.
  useEffect(() => {
    if (pos > count) {
      setAnimate(false)
      setPos(0)
    }
  }, [count, pos])

  // Tras llegar al clon, saltar sin animación al slide real equivalente.
  useEffect(() => {
    if (pos !== count) return
    const id = setTimeout(() => {
      setAnimate(false)
      setPos(0)
    }, duration + 30)
    return () => clearTimeout(id)
  }, [pos, count, duration])

  // Reactivar la transición después de un salto instantáneo.
  useEffect(() => {
    if (animate) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
    return () => cancelAnimationFrame(id)
  }, [animate])

  const goTo = useCallback((index) => {
    setAnimate(true)
    setPos(index)
  }, [])

  const next = useCallback(() => {
    setAnimate(true)
    // En el clon se espera al salto instantáneo antes de avanzar.
    setPos((current) => (current >= count ? current : current + 1))
  }, [count])

  const prev = useCallback(() => {
    if (pos === 0) {
      // Saltar al clon (idéntico al primero) y desde ahí retroceder animando.
      setAnimate(false)
      setPos(count)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setAnimate(true)
        setPos(count - 1)
      }))
      return
    }
    setAnimate(true)
    setPos((current) => current - 1)
  }, [pos, count])

  // Autoplay: se reinicia con cada cambio de slide (incluido el manual).
  useEffect(() => {
    if (dragging) return
    const id = setTimeout(next, interval)
    return () => clearTimeout(id)
  }, [pos, dragging, interval, next])

  // --- Gestos -------------------------------------------------------------
  // El dedo usa eventos táctiles nativos (no pasivos) para poder bloquear el
  // scroll de la página solo cuando el gesto es horizontal; esto funciona igual
  // en Android y iOS. El mouse usa pointer events. Los datos del gesto viven en
  // una ref para que al soltar siempre se lea el desplazamiento real.
  const viewport = useRef(null)
  const actions = useRef({})
  actions.current = { next, prev }

  useEffect(() => {
    const el = viewport.current
    if (!el) return

    function start(x, y) {
      drag.current = { x, y, dx: 0, width: el.offsetWidth || 1, horizontal: null, samples: [{ x, t: performance.now() }] }
    }

    // Devuelve true si el gesto es horizontal (y por tanto lo controla el carrusel).
    function move(x, y) {
      const state = drag.current
      if (!state) return false
      const dx = x - state.x
      const dy = y - state.y
      if (state.horizontal === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return false
        state.horizontal = Math.abs(dx) > Math.abs(dy)
        if (!state.horizontal) {
          drag.current = null // gesto vertical: dejar que la página haga scroll
          return false
        }
        setDragging(true)
      }
      state.dx = dx
      state.samples.push({ x, t: performance.now() })
      if (state.samples.length > 5) state.samples.shift()
      setDragX(dx)
      return true
    }

    function end() {
      const state = drag.current
      drag.current = null
      if (!state?.horizontal) return
      const first = state.samples[0]
      const last = state.samples[state.samples.length - 1]
      const velocity = (last.x - first.x) / Math.max(1, last.t - first.t) // px/ms
      const threshold = Math.min(SWIPE_THRESHOLD, state.width * 0.2)
      const flick = Math.abs(velocity) > 0.35 && Math.abs(state.dx) > 12
      setDragging(false)
      setDragX(0)
      if (state.dx <= -threshold || (flick && velocity < 0)) actions.current.next()
      else if (state.dx >= threshold || (flick && velocity > 0)) actions.current.prev()
    }

    const onTouchStart = (event) => {
      if (event.touches.length !== 1) { drag.current = null; return }
      start(event.touches[0].clientX, event.touches[0].clientY)
    }
    const onTouchMove = (event) => {
      if (event.touches.length !== 1) return
      if (move(event.touches[0].clientX, event.touches[0].clientY) && event.cancelable) event.preventDefault()
    }
    const onMouseDown = (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      event.preventDefault() // evita seleccionar texto o arrastrar imágenes
      start(event.clientX, event.clientY)
      const onMove = (e) => move(e.clientX, e.clientY)
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        end()
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', end)
    el.addEventListener('touchcancel', end)
    el.addEventListener('pointerdown', onMouseDown)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', end)
      el.removeEventListener('touchcancel', end)
      el.removeEventListener('pointerdown', onMouseDown)
    }
  }, [])

  function onKeyDown(event) {
    if (event.key === 'ArrowRight') next()
    if (event.key === 'ArrowLeft') prev()
  }

  const active = pos % count
  const rendered = [...slides, slides[0]]
  const transition = animate && !dragging && duration ? `transform ${duration}ms cubic-bezier(.22,.61,.36,1)` : 'none'

  return (
    <div
      className="w-full"
      role="region"
      aria-roledescription="carrusel"
      aria-label={`Presentación de ${business.name || 'el negocio'}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div
        ref={viewport}
        className="w-full overflow-hidden select-none"
        style={{ touchAction: 'pan-y', cursor: dragging ? 'grabbing' : 'grab', WebkitUserSelect: 'none' }}
      >
        <div
          className="flex w-full"
          style={{ transform: `translateX(calc(${-pos * 100}% + ${dragX}px))`, transition }}
        >
          {rendered.map((slide, index) => {
            const isClone = index === count
            const hidden = isClone || index !== active
            return (
              <div
                key={isClone ? `${slide.id}-clone` : slide.id}
                className="w-full shrink-0 px-1"
                aria-hidden={hidden}
                role={isClone ? undefined : 'group'}
                aria-roledescription={isClone ? undefined : 'slide'}
                aria-label={isClone ? undefined : `${index + 1} de ${count}`}
              >
                <HeroSlide slide={slide} business={business} theme={theme} compact={compact} asHeading={!isClone && slide.isBase} priority={index === 0} />
              </div>
            )
          })}
        </div>
      </div>

      <div className={`mt-4 flex gap-2 ${normalizeHeader(business.header).align === 'left' ? 'justify-start px-1' : 'justify-center'}`}>
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Ir al slide ${index + 1}`}
            aria-current={index === active}
            className="h-2 rounded-full motion-safe:transition-all"
            style={{
              width: index === active ? 20 : 8,
              background: index === active ? theme.accent : theme.subtext,
              opacity: index === active ? 1 : 0.45,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function HeroSlide({ slide, business, theme, compact, asHeading = true, priority = true }) {
  const header = normalizeHeader(business.header)
  const size = logoPixels(header.logoSize, compact)
  const left = header.align === 'left'
  const initials = (slide.title || business.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const Title = asHeading ? 'h1' : 'h2'
  const title = slide.isBase ? slide.title || 'Nombre del negocio' : slide.title

  return (
    <div className={`flex w-full flex-col ${left ? 'items-start text-left' : 'items-center text-center'}`}>
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden shadow-lg"
        style={{ width: size, height: size, borderRadius: logoRadius(header.logoShape, size), background: theme.card, border: `2px solid ${theme.accent}` }}
      >
        {slide.image ? (
          // El primer slide se pinta de inmediato; el resto se carga al necesitarse.
          <img
            src={slide.image}
            alt={slide.title || business.name}
            width={size}
            height={size}
            draggable={false}
            loading={priority ? 'eager' : 'lazy'}
            fetchpriority={priority ? 'high' : 'low'}
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <span style={{ color: theme.cardText || theme.accent, fontSize: Math.round(size * 0.36), fontWeight: 700 }}>{initials}</span>
        )}
      </div>

      {title && (
        <Title className="mt-4 break-words font-bold" style={{ fontSize: compact ? 20 : 26 }}>
          {title}
        </Title>
      )}
      {slide.category && (
        <span className="mt-2 px-3 py-1 rounded-full text-xs font-medium" style={{ background: theme.accent, color: theme.accentText }}>
          {slide.category}
        </span>
      )}
      {slide.description && (
        <p className="mt-3 text-sm" style={{ color: descriptionColor(business, theme) }}>
          {slide.description}
        </p>
      )}
    </div>
  )
}

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches)
  useEffect(() => {
    const media = window.matchMedia?.(query)
    if (!media) return
    const update = () => setReduced(media.matches)
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])
  return reduced
}
