import { useCallback, useEffect, useRef, useState } from 'react'
import { getHeroSlides, normalizeInterval } from '../utils/heroSlides.js'

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

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    drag.current = { x: event.clientX, y: event.clientY, width: event.currentTarget.offsetWidth, horizontal: null }
    setDragging(true)
  }

  function onPointerMove(event) {
    const state = drag.current
    if (!state) return
    const dx = event.clientX - state.x
    const dy = event.clientY - state.y
    if (state.horizontal === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      state.horizontal = Math.abs(dx) > Math.abs(dy)
      if (state.horizontal) event.currentTarget.setPointerCapture?.(event.pointerId)
    }
    if (state.horizontal) setDragX(dx)
  }

  function endDrag() {
    const state = drag.current
    drag.current = null
    setDragging(false)
    if (!state) return
    const threshold = Math.min(SWIPE_THRESHOLD, state.width * 0.2)
    if (dragX <= -threshold) next()
    else if (dragX >= threshold) prev()
    setDragX(0)
  }

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
        className="w-full overflow-hidden select-none"
        style={{ touchAction: 'pan-y', cursor: dragging ? 'grabbing' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={() => drag.current && endDrag()}
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
                <HeroSlide slide={slide} business={business} theme={theme} compact={compact} asHeading={!isClone && slide.isBase} />
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
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

function HeroSlide({ slide, business, theme, compact, asHeading = true }) {
  const size = compact ? 84 : 104
  const initials = (slide.title || business.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const Title = asHeading ? 'h1' : 'h2'
  const title = slide.isBase ? slide.title || 'Nombre del negocio' : slide.title

  return (
    <div className="flex w-full flex-col items-center">
      <div
        className="rounded-full flex items-center justify-center overflow-hidden shadow-lg shrink-0"
        style={{ width: size, height: size, background: theme.card, border: `2px solid ${theme.accent}` }}
      >
        {slide.image ? (
          <img src={slide.image} alt={slide.title || business.name} draggable={false} className="w-full h-full object-cover" />
        ) : (
          <span style={{ color: theme.accent, fontSize: compact ? 30 : 38, fontWeight: 700 }}>{initials}</span>
        )}
      </div>

      {title && (
        <Title className="mt-4 text-center font-bold break-words" style={{ fontSize: compact ? 20 : 26 }}>
          {title}
        </Title>
      )}
      {slide.category && (
        <span className="mt-2 px-3 py-1 rounded-full text-xs font-medium" style={{ background: theme.accent, color: theme.accentText }}>
          {slide.category}
        </span>
      )}
      {slide.description && (
        <p className="mt-3 text-center text-sm" style={{ color: business.descriptionColor || theme.subtext }}>
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
