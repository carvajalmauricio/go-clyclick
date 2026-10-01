import { useCallback, useState } from 'react'
import HeroBuilder from '../components/landing/HeroBuilder.jsx'
import Showcase from '../components/landing/Showcase.jsx'
import ContactDialog from '../components/landing/ContactDialog.jsx'
import { Faq, Features, RubroMarquee, Steps } from '../components/landing/InfoSections.jsx'
import { ContactSection, FloatingWhatsApp, LandingFooter, LandingNav } from '../components/landing/LandingChrome.jsx'
import { useBuilder } from '../components/landing/useBuilder.js'
import { useLandingHead } from '../components/landing/shared.jsx'
import { nameFromQuery } from '../utils/site.js'
import '../components/landing/landing.css'

// Página de inicio: presenta ClyClick y recibe solicitudes de perfil por
// WhatsApp o con el formulario (se ven en el panel, pestaña Solicitudes).
export default function Landing() {
  useLandingHead()
  const [initialName] = useState(() => (typeof window === 'undefined' ? '' : nameFromQuery(window.location.search)))
  const builder = useBuilder(initialName)
  const [dialog, setDialog] = useState(null) // { source }
  const heroSource = initialName ? 'notfound' : 'hero'
  const openHero = useCallback(() => setDialog({ source: heroSource }), [heroSource])
  const openShowcase = useCallback(() => setDialog({ source: 'showcase' }), [])

  return (
    <div className="landing min-h-screen overflow-x-clip bg-clickclick-dark text-white antialiased">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-clickclick-dark">Saltar al contenido</a>
      <LandingNav onCta={openHero} />
      <main id="contenido">
        <HeroBuilder builder={builder} onCta={openHero} />
        <RubroMarquee />
        <Features />
        <Steps />
        <Showcase onCta={openShowcase} />
        <Faq />
        <ContactSection selection={builder.selection} />
      </main>
      <LandingFooter />
      <FloatingWhatsApp selection={builder.selection} />
      {dialog && <ContactDialog selection={builder.selection} source={dialog.source} onClose={() => setDialog(null)} />}
    </div>
  )
}
