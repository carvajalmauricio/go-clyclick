import { memo, useEffect, useState } from 'react'
import PhoneMockup from '../PhoneMockup.jsx'
import { Icon } from '../Icons.jsx'
import { sampleBusiness } from '../../utils/rubros.js'
import { pickShowcase } from '../../utils/site.js'
import { Reveal, SectionHeading, ghostButton, useInView, useViewportWidth } from './shared.jsx'

const FALLBACK = ['cafeteria', 'barberia']

async function loadShowcase() {
  const res = await fetch('/api/businesses')
  if (!res.ok) throw new Error('index')
  const { businesses } = await res.json()
  const profiles = await Promise.all(pickShowcase(businesses).map((entry) => (
    fetch(`/api/business/${encodeURIComponent(entry.slug)}`)
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
  )))
  return profiles.filter((business) => business && business.slug && business.ageGate?.enabled !== true && business.showcase !== false)
}

function Showcase({ onCta }) {
  const [ref, near] = useInView({ rootMargin: '700px 0px' })
  const [state, setState] = useState({ status: 'idle', items: [] })
  const viewport = useViewportWidth()
  const phoneWidth = viewport < 400 ? 220 : 236

  // Se carga una sola vez, cuando la sección se acerca a la pantalla.
  useEffect(() => {
    if (!near) return
    let active = true
    setState((current) => (current.status === 'idle' ? { status: 'loading', items: [] } : current))
    loadShowcase()
      .then((items) => { if (active) setState({ status: 'ready', items }) })
      .catch(() => { if (active) setState({ status: 'error', items: [] }) })
    return () => { active = false }
  }, [near])

  const real = state.items
  const samples = state.status !== 'loading' && state.status !== 'idle' && real.length === 0

  return (
    <section ref={ref} id="ejemplos" aria-labelledby="ejemplos-title" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading id="ejemplos-title" eyebrow="Ejemplos reales" title={samples ? 'Así se ven los perfiles ClyClick' : 'Negocios que ya están a un toque'}>
          {samples ? 'Cada perfil se adapta a la marca y a lo que ofrece el negocio.' : 'Perfiles publicados con ClyClick. Ábrelos y pruébalos como lo haría un cliente.'}
        </SectionHeading>

        <div className="mt-14 flex flex-wrap justify-center gap-6">
          {state.status === 'idle' || state.status === 'loading'
            ? [0, 1].map((index) => <div key={index} className="h-[590px] w-[292px] animate-pulse rounded-[2rem] bg-white/[.04]" aria-hidden="true" />)
            : (samples ? FALLBACK.map((id) => ({ sample: true, business: sampleBusiness({ rubro: id }) })) : real.map((business) => ({ sample: false, business })))
              .map(({ sample, business }, index) => (
                <Reveal key={business.slug} delay={index * 90} className="w-full max-w-[292px]">
                  <ShowcaseCard business={business} sample={sample} phoneWidth={phoneWidth} />
                </Reveal>
              ))}
          {state.status !== 'idle' && state.status !== 'loading' && (
            <Reveal delay={Math.min(real.length || FALLBACK.length, 5) * 90} className="w-full max-w-[292px]">
              <YourBusinessCard onCta={onCta} />
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}

function ShowcaseCard({ business, sample, phoneWidth }) {
  return (
    <article className="group relative flex h-full flex-col items-center rounded-[2rem] border border-white/10 bg-white/[.03] px-6 pb-6 pt-7 transition hover:border-white/25 hover:bg-white/[.05]">
      <div className="transition duration-300 group-hover:-translate-y-1">
        <PhoneMockup business={business} width={phoneWidth} interactive={false} caption={false} />
      </div>
      <h3 className="mt-6 text-center text-lg font-semibold text-white">{business.name}</h3>
      <p className="mt-0.5 text-center text-sm text-white/55">{sample ? 'Ejemplo' : business.category || 'Perfil ClyClick'}</p>
      {!sample && (
        <a
          href={`/${business.slug}`}
          target="_blank"
          rel="noopener"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-clickclick-orange after:absolute after:inset-0 after:rounded-[2rem] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-white"
          aria-label={`Ver el perfil de ${business.name}`}
        >
          Ver perfil <Icon name="arrow-right" size={15} className="transition group-hover:translate-x-0.5" />
        </a>
      )}
    </article>
  )
}

function YourBusinessCard({ onCta }) {
  return (
    <article className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-white/15 bg-gradient-to-b from-clickclick-orange/[.07] to-transparent px-8 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-clickclick-orange/15 text-clickclick-orange"><Icon name="sparkles" size={30} /></span>
      <h3 className="mt-6 text-xl font-bold text-white">¿El próximo es el tuyo?</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/60">Tu negocio también puede estar a un toque de tus clientes.</p>
      <button type="button" onClick={onCta} className={`${ghostButton} mt-6 text-sm`}>
        Quiero el mío <Icon name="arrow-right" size={16} />
      </button>
    </article>
  )
}

export default memo(Showcase)
