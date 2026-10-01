import { memo, useEffect, useState } from 'react'
import { Icon } from '../Icons.jsx'
import LeadForm from './LeadForm.jsx'
import { getRubro } from '../../utils/rubros.js'
import { THEMES } from '../../utils/themes.js'
import { CONTACT, contactMessage, contactWhatsappUrl, formatPhone } from '../../utils/contact.js'
import { BrandMark, Reveal, SectionHeading, scrollToId, whatsappButton } from './shared.jsx'

const NAV_LINKS = [
  ['como-funciona', 'Cómo funciona'],
  ['ejemplos', 'Ejemplos'],
  ['preguntas', 'Preguntas'],
  ['contacto', 'Contacto'],
]

function selectionDetails(selection) {
  return {
    businessName: selection?.businessName,
    rubroLabel: selection?.rubro ? getRubro(selection.rubro).label : '',
    themeName: selection?.theme ? THEMES[selection.theme]?.name : '',
  }
}

function selectionUrl(selection) {
  return contactWhatsappUrl(selectionDetails(selection))
}

export const LandingNav = memo(function LandingNav({ onCta }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition ${scrolled ? 'border-b border-white/[.06] bg-clickclick-dark/85 backdrop-blur-lg' : 'border-b border-transparent'}`}>
      <nav aria-label="Principal" className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <a href="/" aria-label="ClyClick, inicio" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          <BrandMark size={26} />
        </a>
        <ul className="ml-auto hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} onClick={(event) => { event.preventDefault(); scrollToId(id) }} className="rounded-lg px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white">{label}</a>
            </li>
          ))}
        </ul>
        <button type="button" onClick={onCta} className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-clickclick-orange px-4 py-2 text-sm font-semibold text-clickclick-dark transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:ml-2">
          Quiero mi perfil
        </button>
      </nav>
    </header>
  )
})

export function ContactSection({ selection }) {
  return (
    <section id="contacto" aria-labelledby="contacto-title" className="relative scroll-mt-20 overflow-hidden border-t border-white/[.06] py-20 sm:py-28">
      <div aria-hidden="true" className="landing-glow pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading id="contacto-title" eyebrow="Contacto" title="Hablemos de tu negocio">
          Escríbenos por WhatsApp o déjanos tus datos y te contactamos para crear tu perfil.
        </SectionHeading>
        <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex flex-col gap-4">
            <Reveal className="flex flex-1 flex-col rounded-3xl border border-[#25D366]/25 bg-gradient-to-br from-[#25D366]/15 to-[#25D366]/[.03] p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366] text-[#062b16]"><Icon name="whatsapp" size={26} /></span>
              <h3 className="mt-5 text-xl font-bold text-white">WhatsApp</h3>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{formatPhone(CONTACT.whatsapp)}</p>
              <p className="mt-2 text-sm text-white/60">La forma más rápida de empezar. Te respondemos por ahí mismo.</p>
              {/* Vista previa del mensaje que se enviará (se arma con lo elegido en la portada). */}
              <div aria-hidden="true" className="mt-6 flex-1">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.16em] text-white/40">Tu mensaje</p>
                <div className="relative max-w-[92%] whitespace-pre-line rounded-2xl rounded-tl-md bg-[#0b3d2a] px-4 py-3 text-[13px] leading-relaxed text-[#e9fbe9] shadow-lg">
                  {contactMessage(selectionDetails(selection))}
                  <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#9fdcb8]">
                    ahora
                    <svg width="16" height="10" viewBox="0 0 16 10" fill="none" stroke="#53bdeb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5.5l3 3L10.5 1.5" /><path d="M6.5 8.5l1 0L15 1.5" /></svg>
                  </span>
                </div>
              </div>
              <a href={selectionUrl(selection)} target="_blank" rel="noopener noreferrer" className={`${whatsappButton} mt-6`}>
                <Icon name="whatsapp" size={20} /> Abrir WhatsApp
              </a>
            </Reveal>
            <Reveal delay={80} className="rounded-3xl border border-white/10 bg-white/[.03] p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clickclick-orange/15 text-clickclick-orange"><Icon name="email" size={24} /></span>
              <h3 className="mt-5 text-xl font-bold text-white">Correo</h3>
              <a href={`mailto:${CONTACT.email}`} className="mt-1 inline-block break-all text-lg font-semibold text-clickclick-orange hover:underline">{CONTACT.email}</a>
              <p className="mt-2 text-sm text-white/60">Para propuestas, empresas y dudas generales.</p>
            </Reveal>
          </div>
          <Reveal delay={120} className="relative rounded-3xl border border-white/10 bg-[#15151c]/80 p-6 shadow-2xl backdrop-blur sm:p-8">
            <h3 className="text-xl font-bold text-white">Prefiero que me contacten</h3>
            <p className="mt-1 text-sm text-white/60">Déjanos tus datos y te escribimos para crear tu perfil, sin compromiso.</p>
            <div className="mt-6">
              <LeadForm initial={selection} source="contact" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export const LandingFooter = memo(function LandingFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-white/[.06] bg-black/20">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <BrandMark size={28} />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">Perfiles digitales para negocios: todo lo que tus clientes necesitan, en un solo enlace y a un toque.</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/40">Explora</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV_LINKS.map(([id, label]) => (
              <li key={id}><a href={`#${id}`} onClick={(event) => { event.preventDefault(); scrollToId(id) }} className="text-white/70 hover:text-white">{label}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/40">Contacto</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><a href={selectionUrl(null)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/70 hover:text-white"><Icon name="whatsapp" size={15} /> {formatPhone(CONTACT.whatsapp)}</a></li>
            <li><a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-2 break-all text-white/70 hover:text-white"><Icon name="email" size={15} /> {CONTACT.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-white/40 sm:flex-row sm:px-8">
          <p>© {year} {CONTACT.company} · Hecho en Ecuador</p>
          <a href="/admin" className="hover:text-white/70">Acceso de administración</a>
        </div>
      </div>
    </footer>
  )
})

// Botón flotante de WhatsApp: aparece al bajar y se oculta en la sección de
// contacto (que ya tiene el suyo).
export function FloatingWhatsApp({ selection }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    let contactVisible = false
    let scrolled = false
    const update = () => setVisible(scrolled && !contactVisible)
    const onScroll = () => {
      scrolled = window.scrollY > 640
      update()
    }
    const contact = document.getElementById('contacto')
    const observer = typeof IntersectionObserver !== 'undefined' && contact
      ? new IntersectionObserver(([entry]) => { contactVisible = entry.isIntersecting; update() }, { rootMargin: '0px 0px -30% 0px' })
      : null
    observer?.observe(contact)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      observer?.disconnect()
    }
  }, [])
  return (
    <a
      href={selectionUrl(selection)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible || undefined}
      className={`fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-[#062b16] shadow-[0_12px_30px_-8px_rgba(37,211,102,.7)] transition duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:bottom-6 sm:right-6 ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
    >
      <Icon name="whatsapp" size={28} />
    </a>
  )
}
