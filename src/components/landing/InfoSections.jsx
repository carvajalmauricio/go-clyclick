import { memo } from 'react'
import { Icon } from '../Icons.jsx'
import BankLogo from '../BankLogo.jsx'
import { THEME_LIST } from '../../utils/themes.js'
import { CONTACT } from '../../utils/contact.js'
import { Reveal, SectionHeading } from './shared.jsx'

// Secciones informativas de la página de inicio (sin estado).

const KINDS = [
  ['food', 'Restaurantes'], ['coffee', 'Cafeterías'], ['scissors', 'Barberías'], ['sparkles', 'Salones de belleza'],
  ['cart', 'Tiendas'], ['wrench', 'Talleres y lubricadoras'], ['heart', 'Consultorios'], ['briefcase', 'Profesionales'],
  ['truck', 'Delivery'], ['calendar', 'Eventos'], ['store', 'Emprendimientos'],
]

export const RubroMarquee = memo(function RubroMarquee() {
  const row = (hidden) => KINDS.map(([icon, label]) => (
    <span key={`${label}-${hidden}`} aria-hidden={hidden || undefined} className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-white/55">
      <Icon name={icon} size={16} className="text-clickclick-orange/80" /> {label}
    </span>
  ))
  return (
    <section aria-label="Negocios para los que es ideal" className="landing-marquee-mask overflow-hidden border-y border-white/[.06] bg-white/[.02] py-5">
      <div className="landing-marquee flex w-max gap-10 pr-10">
        {row(false)}
        {row(true)}
      </div>
    </section>
  )
})

const FEATURES = [
  { icon: 'whatsapp', title: 'Te escriben por WhatsApp', text: 'Un botón abre el chat contigo con un mensaje listo. Más consultas, menos pasos.' },
  { icon: 'star', title: 'Más reseñas en Google', text: 'Lleva a tus clientes directo a dejarte sus 5 estrellas.' },
  { icon: 'maps', title: 'Que te encuentren', text: 'Google Maps y Waze a un toque para que nadie se pierda.' },
  { icon: 'menu', title: 'Menú y catálogo', text: 'Tus productos, servicios y precios siempre a mano.' },
  { icon: 'bank', title: 'Cobra fácil', text: 'Muestra tus cuentas y enlaces de pago: tus clientes copian los datos con un toque.', banks: true },
  { icon: 'qr', title: 'Código QR y cartel', text: 'Imprime tu cartel de mesa o mostrador y compártelo donde quieras.' },
  { icon: 'instagram', title: 'Redes y contacto', text: 'Instagram, TikTok, Facebook y un botón para guardarte en la agenda.' },
  { icon: 'palette', title: 'Tu marca, tu estilo', text: `${THEME_LIST.length} estilos, fuentes, colores y animaciones a tu medida.` },
  { icon: 'globe', title: 'Español e inglés', text: 'Ideal si atiendes turistas o clientes de otros países.' },
]

export const Features = memo(function Features() {
  return (
    <section id="que-incluye" aria-labelledby="que-incluye-title" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading id="que-incluye-title" eyebrow="Qué incluye" title="Todo lo que tus clientes buscan, en un solo enlace">
          Un perfil pensado para negocios: rápido, fácil de usar y con tu identidad.
        </SectionHeading>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={(index % 3) * 80} className="group grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 rounded-3xl border border-white/10 bg-white/[.03] p-5 transition hover:border-clickclick-orange/40 hover:bg-white/[.05] sm:block sm:p-6">
              <span className="row-span-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-clickclick-orange/15 text-clickclick-orange transition group-hover:scale-105"><Icon name={feature.icon} size={21} /></span>
              <h3 className="text-lg font-semibold text-white sm:mt-5">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">{feature.text}</p>
              {feature.banks && (
                <div className="col-start-2 mt-4 flex flex-wrap items-center gap-2" aria-label="Bancos y billeteras compatibles">
                  {['deuna', 'pichincha', 'guayaquil', 'produbanco', 'pacifico'].map((bank) => <span key={bank} className="[&>img]:h-8 [&>img]:w-11"><BankLogo bank={bank} /></span>)}
                </div>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
})

const STEPS = [
  { title: 'Cuéntanos de tu negocio', text: 'Escríbenos por WhatsApp o deja tus datos. Con tu logo y tus enlaces es suficiente.' },
  { title: 'Diseñamos tu perfil', text: 'Lo armamos con tus colores y te lo mostramos. Lo ajustamos hasta que te encante.' },
  { title: 'Compártelo y recibe clientes', text: `Te entregamos tu enlace ${CONTACT.site}/tu-negocio, tu código QR y el cartel para imprimir.` },
]

export const Steps = memo(function Steps() {
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-title" className="relative scroll-mt-20 overflow-hidden border-y border-white/[.06] bg-white/[.02] py-20 sm:py-28">
      <div aria-hidden="true" className="landing-glow-soft pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading id="como-funciona-title" eyebrow="Cómo funciona" title="Tu perfil listo en 3 pasos">
          Tú nos cuentas, nosotros lo configuramos. Sin complicaciones técnicas.
        </SectionHeading>
        <ol className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          <span aria-hidden="true" className="absolute left-[16.6%] right-[16.6%] top-7 hidden border-t-2 border-dashed border-white/15 md:block" />
          {STEPS.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 120} className="relative text-center">
              <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-clickclick-orange text-xl font-extrabold text-clickclick-dark shadow-[0_10px_30px_-8px_rgba(244,145,32,.7)]">{index + 1}</span>
              <h3 className="mt-6 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
})

const FAQ = [
  ['¿Necesito instalar una app?', 'No. Tu perfil se abre en el navegador de cualquier teléfono o computadora, sin descargas ni registros para tus clientes.'],
  ['¿Qué necesito para empezar?', 'El nombre de tu negocio, tu WhatsApp y, si los tienes, tu logo y tus enlaces (Google Maps, redes sociales, menú). Nosotros nos encargamos del resto.'],
  ['¿Puedo cambiar mi perfil después?', 'Sí. Escríbenos cuando quieras actualizar tus enlaces, fotos, textos o el diseño y lo cambiamos por ti.'],
  ['¿Cómo lo comparto con mis clientes?', `Con tu enlace ${CONTACT.site}/tu-negocio en redes y WhatsApp, y con tu código QR en el local. También te preparamos un cartel de mesa listo para imprimir.`],
  ['¿Puedo mostrar mis cuentas para transferencias?', 'Sí. Puedes mostrar tus cuentas de Deuna, Banco Pichincha, Banco Guayaquil, Produbanco y Banco del Pacífico, o tus enlaces de pago. Tus clientes copian los datos con un toque.'],
  ['¿Sirve para Instagram y TikTok?', 'Sí. Pega tu enlace en la biografía y tus seguidores encontrarán todo en un solo lugar.'],
  ['¿Cuánto cuesta?', 'Depende de lo que necesite tu negocio. Cuéntanos por WhatsApp o en el formulario y te enviamos una propuesta sin compromiso.'],
]

export const Faq = memo(function Faq() {
  return (
    <section id="preguntas" aria-labelledby="preguntas-title" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <SectionHeading id="preguntas-title" eyebrow="Preguntas frecuentes" title="Resolvemos tus dudas" />
        <div className="mt-12 space-y-3">
          {FAQ.map(([question, answer], index) => (
            <Reveal key={question} delay={index * 40}>
              <details className="landing-faq group rounded-2xl border border-white/10 bg-white/[.03] px-5 transition open:border-white/20 open:bg-white/[.05]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium text-white">
                  {question}
                  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/60 transition group-open:rotate-45 group-open:border-clickclick-orange group-open:text-clickclick-orange">
                    <Icon name="plus" size={14} />
                  </span>
                </summary>
                <p className="pb-5 pr-10 text-sm leading-relaxed text-white/65">{answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
})
