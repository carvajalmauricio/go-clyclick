import { useRef } from 'react'
import PhoneMockup from '../PhoneMockup.jsx'
import { Icon } from '../Icons.jsx'
import { RUBROS, SHOWCASE_ROTATION, getRubro } from '../../utils/rubros.js'
import { THEME_LIST } from '../../utils/themes.js'
import { CONTACT, contactWhatsappUrl } from '../../utils/contact.js'
import { ThemeSwatch, primaryButton, useMediaQuery, useViewportWidth, whatsappButton } from './shared.jsx'

// Portada: el teléfono que cambia de negocio (A) + "escribe el nombre de tu
// negocio y míralo en vivo" (C).
export default function HeroBuilder({ builder, onCta }) {
  const inputRef = useRef(null)
  const desktop = useMediaQuery('(min-width: 1024px)')
  const viewport = useViewportWidth()
  const phoneWidth = desktop ? 330 : Math.max(236, Math.min(290, viewport - 72))
  const { rubro, theme, selection } = builder
  const whatsappUrl = contactWhatsappUrl({
    businessName: selection.businessName,
    rubroLabel: selection.rubro ? getRubro(selection.rubro).label : '',
    themeName: selection.theme ? theme.name : '',
  })

  // En el móvil, al escribir se sube el campo para que el teléfono quede a la
  // vista por encima del teclado.
  function onFocus() {
    if (desktop) return
    window.setTimeout(() => inputRef.current?.closest('[data-hero-name]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 280)
  }

  return (
    <section id="inicio" aria-labelledby="hero-title" className="relative overflow-hidden pb-16 pt-24 sm:pt-28 lg:pb-24 lg:pt-32">
      <div aria-hidden="true" className="landing-glow pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="landing-dots pointer-events-none absolute inset-0" />

      {/* El orden del código es el visual del móvil (texto, nombre, teléfono,
          opciones, botones). En escritorio el teléfono va a la derecha y las
          filas 1fr de los extremos centran el texto respecto al teléfono. */}
      <div className="relative mx-auto flex max-w-6xl flex-col px-5 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[1fr_auto_auto_auto_auto_1fr] lg:gap-x-10">
        <div className="text-center lg:col-start-1 lg:row-start-2 lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3.5 py-1.5 text-xs font-medium text-white/75 backdrop-blur">
            <Icon name="sparkles" size={14} className="text-clickclick-orange" /> Perfiles digitales para negocios
          </p>
          <h1 id="hero-title" className="mt-5 text-[2.35rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3rem] xl:text-[3.35rem]">
            Tu negocio, <span className="landing-gradient-text">a un toque</span> de tus clientes.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg lg:mx-0">
            Creamos el perfil digital de tu negocio: WhatsApp, reseñas de Google, ubicación, menú y pagos en un solo enlace, con su código QR. <span className="text-white/90">Escribe el nombre de tu negocio y míralo en vivo.</span>
          </p>
        </div>


        <div data-hero-name className="mt-8 scroll-mt-20 lg:col-start-1 lg:row-start-3">
          <label htmlFor="hero-name" className="mb-2 block text-center text-sm font-medium text-white/80 lg:text-left">¿Cómo se llama tu negocio?</label>
          <div className="group relative">
            <Icon name="store" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40 transition group-focus-within:text-clickclick-orange" />
            <input
              ref={inputRef}
              id="hero-name"
              value={builder.name}
              onChange={(event) => builder.setName(event.target.value)}
              onFocus={onFocus}
              onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
              maxLength={60}
              autoComplete="organization"
              enterKeyHint="done"
              placeholder="Ej.: Café La Esquina"
              className="w-full rounded-2xl border border-white/15 bg-white/[.06] py-4 pl-12 pr-12 text-lg text-white shadow-[0_0_0_1px_rgba(255,255,255,.02)] outline-none transition placeholder:text-white/35 focus:border-clickclick-orange focus:bg-white/[.08] focus:ring-4 focus:ring-clickclick-orange/20"
            />
            {builder.name && (
              <button type="button" onClick={() => { builder.setName(''); inputRef.current?.focus() }} aria-label="Borrar nombre" className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-xl leading-none text-white/50 hover:bg-white/10 hover:text-white">×</button>
            )}
          </div>
          <p className="mt-2 break-words text-center text-xs text-white/50 lg:text-left">
            Así podría quedar tu enlace: <span className="text-white/80">{CONTACT.site}/</span><strong className="font-semibold text-clickclick-orange">{builder.slug}</strong>
          </p>
        </div>


        {/* Teléfono */}
        <div className="relative mt-10 flex flex-col items-center lg:col-start-2 lg:row-span-6 lg:row-start-1 lg:mt-0 lg:self-center xl:pr-20">
          <div aria-hidden="true" className="landing-phone-glow pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[120%] -translate-x-1/2 -translate-y-1/2" />
          <div onMouseEnter={() => builder.setHovered(true)} onMouseLeave={() => builder.setHovered(false)} className="relative">
            <FloatingBadges />
            <PhoneMockup
              business={builder.business}
              width={phoneWidth}
              interactive={false}
              caption={false}
              transitionKey={`${builder.rubro.id}-${builder.theme.id}`}
            />
          </div>
          {/* Solo anuncia cambios de rubro o estilo (no cada letra que se escribe). */}
          <p className="sr-only" aria-live="polite">
            {builder.touched ? `Vista previa: ${builder.rubro.label}, estilo ${theme.name}.` : ''}
          </p>
          <PhoneCaption builder={builder} />
        </div>

        <div className="mt-8 space-y-6 lg:col-start-1 lg:row-start-4 lg:mt-7">
          <div>
            <p className="mb-2.5 text-center text-sm font-medium text-white/80 lg:text-left">¿A qué se dedica?</p>
            <div role="group" aria-label="Tipo de negocio" className="landing-scroll -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
              {RUBROS.map((option) => {
                const active = option.id === rubro.id
                const pressed = builder.touched && active
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => builder.setRubro(option.id)}
                    aria-pressed={pressed}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${pressed ? 'border-clickclick-orange bg-clickclick-orange/15 font-semibold text-clickclick-orange' : active ? 'border-white/30 bg-white/[.07] text-white' : 'border-white/10 bg-white/[.03] text-white/70 hover:border-white/30 hover:text-white'}`}
                  >
                    <Icon name={option.icon} size={15} /> {option.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="mb-2.5 text-center text-sm font-medium text-white/80 lg:text-left">
              Elige tu estilo <span className="font-normal text-white/50">· {theme.name}</span>
            </p>
            <div role="group" aria-label="Estilo del perfil" className="landing-scroll -mx-5 flex gap-2.5 overflow-x-auto px-5 py-1.5 lg:mx-0 lg:flex-wrap lg:gap-2 lg:overflow-visible lg:px-1">
              {THEME_LIST.map((option) => (
                <ThemeSwatch key={option.id} theme={option} size={34} selected={builder.touched && option.id === theme.id} onClick={() => builder.setTheme(option.id)} />
              ))}
            </div>
          </div>
        </div>


        <div className="mt-8 lg:col-start-1 lg:row-start-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <button type="button" onClick={onCta} className={primaryButton}>
              Me gusta, ¡créalo! <Icon name="arrow-right" size={18} />
            </button>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={whatsappButton}>
              <Icon name="whatsapp" size={20} /> Escríbenos por WhatsApp
            </a>
          </div>
          <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/55 lg:justify-start">
            {['Sin instalar apps', 'Código QR incluido', 'Lo configuramos por ti'].map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5"><Icon name="check" size={15} className="text-clickclick-orange" />{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function PhoneCaption({ builder }) {
  if (builder.touched) {
    return (
      <p className="relative mt-5 inline-flex items-center gap-2 rounded-full border border-clickclick-orange/30 bg-clickclick-orange/10 px-3.5 py-1.5 text-xs font-medium text-clickclick-orange">
        <span className="h-1.5 w-1.5 rounded-full bg-clickclick-orange landing-live-dot" /> Vista previa en vivo · así se vería tu perfil
      </p>
    )
  }
  return (
    <div className="relative mt-5 flex items-center gap-3 text-xs text-white/55">
      <span>Ejemplo · {builder.rubro.label} · {builder.theme.name}</span>
      <span className="flex items-center gap-1.5" aria-hidden="true">
        {SHOWCASE_ROTATION.map((id, index) => (
          <span key={id} className={`h-1.5 rounded-full transition-all ${index === builder.rotation ? 'w-4 bg-clickclick-orange' : 'w-1.5 bg-white/25'}`} />
        ))}
      </span>
      {!builder.reducedMotion && (
        <button type="button" onClick={() => builder.setPaused(!builder.paused)} aria-label={builder.paused ? 'Reanudar ejemplos' : 'Pausar ejemplos'} className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white/70 hover:border-white/40 hover:text-white">
          <Icon name={builder.paused ? 'play' : 'pause'} size={11} />
        </button>
      )}
    </div>
  )
}

// Etiquetas flotantes junto al teléfono (solo en pantallas grandes). Van a la
// derecha y solo se montan sobre el marco, sin tapar el perfil.
function FloatingBadges() {
  const badges = [
    { icon: 'whatsapp', text: 'WhatsApp directo', top: '17%', delay: '0s' },
    { icon: 'star', text: 'Reseñas en Google', top: '43%', delay: '-2s' },
    { icon: 'qr', text: 'Tu código QR', top: '69%', delay: '-4s' },
  ]
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden xl:block">
      {badges.map((badge) => (
        <span key={badge.text} className="landing-float absolute inline-flex items-center gap-2 whitespace-nowrap rounded-2xl border border-white/15 bg-[#1a1a22]/85 py-2 pl-2 pr-3.5 text-[13px] font-medium text-white shadow-xl backdrop-blur-md" style={{ left: 'calc(100% - 22px)', top: badge.top, animationDelay: badge.delay }}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-clickclick-orange/15 text-clickclick-orange"><Icon name={badge.icon} size={15} /></span>
          {badge.text}
        </span>
      ))}
    </div>
  )
}
