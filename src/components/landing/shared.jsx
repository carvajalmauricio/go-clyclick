import { useEffect, useRef, useState } from 'react'
import { SITE } from '../../utils/site.js'

// Piezas compartidas por las secciones de la página de inicio.

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap'

// Fuente de la marca, título y color de la barra del navegador. El servidor ya
// los pone en el HTML de "/"; esto cubre la navegación dentro de la app.
export function useLandingHead() {
  useEffect(() => {
    const added = []
    const add = (tag, attributes) => {
      const element = document.createElement(tag)
      Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))
      document.head.appendChild(element)
      added.push(element)
    }
    if (!document.querySelector(`link[href="${FONT_HREF}"]`)) {
      add('link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' })
      add('link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' })
      add('link', { rel: 'stylesheet', href: FONT_HREF })
    }
    if (!document.querySelector('meta[name="theme-color"]')) add('meta', { name: 'theme-color', content: SITE.themeColor })
    const previousTitle = document.title
    document.title = SITE.title
    return () => {
      added.forEach((element) => element.remove())
      document.title = previousTitle
    }
  }, [])
}

export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && Boolean(window.matchMedia?.(query).matches))
  useEffect(() => {
    const media = window.matchMedia?.(query)
    if (!media) return
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [query])
  return matches
}

export function useViewportWidth() {
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth))
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return width
}

// true cuando el elemento entra en pantalla (una sola vez por defecto).
export function useInView({ rootMargin = '0px', once = true } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        if (once) observer.disconnect()
      } else if (!once) {
        setInView(false)
      }
    }, { rootMargin })
    observer.observe(element)
    return () => observer.disconnect()
  }, [rootMargin, once])
  return [ref, inView]
}

// Aparece con un leve desplazamiento al entrar en pantalla.
export function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const [ref, visible] = useInView({ rootMargin: '0px 0px -8% 0px' })
  return (
    <Tag ref={ref} className={`landing-reveal ${visible ? 'is-visible' : ''} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined} {...rest}>
      {children}
    </Tag>
  )
}

export function scrollToId(id) {
  const element = document.getElementById(id)
  if (!element) return
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  element.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  window.history.replaceState(null, '', `#${id}`)
}

export function BrandMark({ size = 30, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden="true"
        className="shrink-0 bg-clickclick-orange"
        style={{ width: Math.round(size * 1.5), height: size, mask: 'url("/logo-clyclick.png") center / contain no-repeat', WebkitMask: 'url("/logo-clyclick.png") center / contain no-repeat' }}
      />
      <span className="text-lg font-bold tracking-tight text-white">ClyClick</span>
    </span>
  )
}

export function SectionHeading({ eyebrow, title, children, id, align = 'center' }) {
  const centered = align === 'center'
  return (
    <Reveal className={`${centered ? 'mx-auto text-center' : ''} max-w-2xl`}>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[.2em] text-clickclick-orange">{eyebrow}</p>}
      <h2 id={id} className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">{title}</h2>
      {children && <p className="mt-4 text-base leading-relaxed text-white/60 sm:text-lg">{children}</p>}
    </Reveal>
  )
}

// Muestra redonda de un tema (fondo + punto con el color de acento).
export function ThemeSwatch({ theme, selected, onClick, size = 36 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Estilo ${theme.name}`}
      title={theme.name}
      className={`relative shrink-0 rounded-full ring-offset-2 ring-offset-clickclick-dark transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${selected ? 'scale-110 ring-2 ring-clickclick-orange' : 'ring-1 ring-white/20 hover:ring-white/60'}`}
      style={{ width: size, height: size, background: theme.bgGradient || theme.bg }}
    >
      <span aria-hidden="true" className="absolute bottom-[18%] right-[18%] h-[28%] w-[28%] rounded-full" style={{ background: theme.accent, boxShadow: '0 0 0 1.5px rgba(0,0,0,.28)' }} />
    </button>
  )
}

export const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-2xl bg-clickclick-orange px-6 py-3.5 text-base font-semibold text-clickclick-dark shadow-[0_10px_30px_-10px_rgba(244,145,32,.8)] transition hover:brightness-110 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-clickclick-dark disabled:opacity-60'
export const whatsappButton = 'inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 text-base font-semibold text-[#062b16] transition hover:brightness-105 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-clickclick-dark'
export const ghostButton = 'inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-6 py-3.5 text-base font-semibold text-white transition hover:border-white/40 hover:bg-white/5 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
