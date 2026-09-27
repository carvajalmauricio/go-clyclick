import { useEffect, useState } from 'react'
import { Icon } from './Icons.jsx'
import SocialLinkItem from './SocialLinkItem.jsx'
import ShareMenu from './ShareMenu.jsx'
import { resolveTheme, getBackgroundStyle } from '../utils/themes.js'
import { buildActions, buildSocials, normalizeSocialPosition } from '../utils/links.js'
import { downloadVCard } from '../utils/vcard.js'
import { getProfileSections } from '../utils/banking.js'
import { getButtonColors } from '../utils/buttonColors.js'
import BankLogo from './BankLogo.jsx'
import BankAccountDialog from './BankAccountDialog.jsx'
import { animationClass, innerAnimationClass } from '../utils/animations.js'
import HeroCarousel from './HeroCarousel.jsx'
import { buttonBorderWidth, buttonRadius, buttonShadow } from '../utils/buttonStyles.js'
import { getFont, fontStylesheetUrl } from '../utils/fonts.js'
import { t, LANGUAGE_LABELS } from '../utils/i18n.js'

// Suscribe a prefers-color-scheme: dark (mismo patrón que usePrefersReducedMotion).
// Devuelve true cuando el sistema pide modo oscuro. Reacciona a los cambios.
function usePrefersDark() {
  const query = '(prefers-color-scheme: dark)'
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches)
  useEffect(() => {
    const media = window.matchMedia?.(query)
    if (!media) return
    const update = () => setDark(media.matches)
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])
  return dark
}

// Idiomas habilitados del negocio (siempre incluye 'es').
function enabledLanguages(business) {
  const langs = Array.isArray(business.languages) ? business.languages.filter((l) => l === 'es' || l === 'en') : []
  return langs.includes('es') ? langs : ['es', ...langs]
}

// Aplica los overrides de idioma (name/description/category) sobre el negocio.
// El español usa siempre los campos raíz; otros idiomas usan business.i18n[lang].
function localizeBusiness(business, lang) {
  if (lang === 'es') return business
  const override = business.i18n?.[lang]
  if (!override) return business
  return {
    ...business,
    name: override.name || business.name,
    description: override.description || business.description,
    category: override.category || business.category,
  }
}

// Inyecta el <link> del stylesheet de Google Fonts solo cuando hay fuente
// seleccionada. Se elimina al desmontar o cambiar de fuente.
function useProfileFont(fontValue) {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const href = fontStylesheetUrl(fontValue)
    if (!href) return
    if (document.querySelector(`link[data-profile-font][href="${href}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.setAttribute('data-profile-font', fontValue)
    document.head.appendChild(link)
    return () => {
      link.remove()
    }
  }, [fontValue])
}

// Vista de presentación del perfil de un negocio.
// Se usa en la página pública y dentro del simulador móvil del admin.
export default function ProfileView({ business: rawBusiness, compact = false }) {
  const langs = enabledLanguages(rawBusiness)
  const [lang, setLang] = useState('es')
  const activeLang = langs.includes(lang) ? lang : 'es'
  const business = localizeBusiness(rawBusiness, activeLang)

  // #16 Modo claro/oscuro automático: cuando está activo, elige entre el tema
  // claro y el oscuro configurados según prefers-color-scheme del sistema.
  const prefersDark = usePrefersDark()
  const themeId = rawBusiness.autoTheme
    ? (prefersDark ? (rawBusiness.darkTheme || 'vibrant') : (rawBusiness.lightTheme || 'minimal'))
    : business.theme

  // #8 Fuente personalizada: carga el stylesheet solo si hay fuente elegida.
  useProfileFont(rawBusiness.font)
  const font = getFont(rawBusiness.font)

  const theme = resolveTheme(themeId, business.customColors)
  const actions = buildActions(business)
  const socials = buildSocials(business)
  const socialPosition = normalizeSocialPosition(business.socialPosition)
  const socialsRow = socials.length > 0 && (
    <div className={`flex flex-wrap justify-center gap-3 ${socialPosition === 'bottom' ? 'mt-6' : 'mt-5'}`}>
      {socials.map((s) => (
        <SocialLinkItem key={s.key} social={s} theme={theme} />
      ))}
    </div>
  )
  const sections = getProfileSections(business)
  const background = business.background || { type: 'theme' }

  return (
    <div
      className={`${compact ? 'min-h-full' : 'min-h-screen'} profile-background relative w-full flex flex-col items-center overflow-hidden`}
      style={{ ...getBackgroundStyle(theme, ['image', 'video'].includes(background.type) ? null : background), color: theme.text, ...(font ? { fontFamily: font.family } : {}) }}
    >
      {langs.length > 1 && (
        <div
          className={`absolute z-20 flex items-center gap-1 rounded-full p-1 backdrop-blur-md ${compact ? 'left-3 top-3' : 'left-5 top-5'}`}
          style={{ background: `color-mix(in srgb, ${theme.card} 87%, transparent)`, border: `1px solid ${theme.border}` }}
          role="group"
          aria-label={t(activeLang, 'languageLabel')}
        >
          {langs.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              aria-pressed={activeLang === code}
              className="rounded-full px-2.5 py-1 text-xs font-semibold transition"
              style={activeLang === code
                ? { background: theme.accent, color: theme.accentText }
                : { color: theme.text, opacity: 0.7 }}
            >
              {LANGUAGE_LABELS[code] || code.toUpperCase()}
            </button>
          ))}
        </div>
      )}
      {['image', 'video'].includes(background.type) && background.url && (
        <>
          <div aria-hidden="true" className="absolute pointer-events-none" style={{ inset: -Math.max(0, Math.min(30, Number(background.blur) || 0)) * 2, filter: `blur(${Math.max(0, Math.min(30, Number(background.blur) || 0))}px)` }}>
            {background.type === 'video'
              ? <video className="h-full w-full object-cover" src={background.url} autoPlay muted loop playsInline />
              : <div className="h-full w-full" style={{ backgroundImage: `url("${background.url}")`, backgroundSize: 'cover', backgroundPosition: background.position || 'center' }} />}
          </div>
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: `rgba(0,0,0,${Number(background.overlay ?? 0.25)})` }} />
        </>
      )}
      <BackgroundPattern pattern={background.pattern || theme.pattern} />
      <ShareMenu business={business} theme={theme} compact={compact} />

      <div className={`relative z-10 w-full flex-1 flex flex-col items-center ${compact ? 'max-w-full px-4 py-6' : 'max-w-lg px-6 pt-10 pb-6'}`}>
        {/* Tarjeta de presentación: logo, nombre, categoría y descripción (con slides opcionales) */}
        <HeroCarousel business={business} theme={theme} compact={compact} />

        {/* Redes sociales (arriba, justo bajo el hero) */}
        {socialPosition === 'top' && socialsRow}

        {/* Botones de acción */}
        <div className="mt-6 flex w-full flex-col gap-5">
          <ActionGroup actions={actions.filter((action) => !action.sectionId)} business={business} theme={theme} lang={activeLang} />
          {sections.map((section) => {
            const grouped = actions.filter((action) => action.sectionId === section.id)
            if (!grouped.length) return null
            return (
              <section key={section.id} className="w-full">
                <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-[.16em]" style={{ color: theme.subtext }}>
                  {section.title}
                </h2>
                <ActionGroup actions={grouped} business={business} theme={theme} lang={activeLang} />
              </section>
            )
          })}
        </div>

        {/* Redes sociales (abajo, tras los botones de acción) */}
        {socialPosition === 'bottom' && socialsRow}

        {/* Footer fijado al fondo (mt-auto lo empuja abajo) */}
        <footer className="mt-auto pt-10 w-full flex flex-col items-center gap-2">
          <ClickClickLogo color={theme.text} />
          <div className="text-center text-xs" style={{ color: theme.subtext }}>
            {t(activeLang, 'poweredBy')} <span style={{ color: theme.text, fontWeight: 600 }}>ClyClick</span> · {t(activeLang, 'tagline')}
          </div>
        </footer>
      </div>
    </div>
  )
}

function ActionGroup({ actions, business, theme, lang = 'es' }) {
  if (!actions.length) return null
  // Agrupa acciones consecutivas con layout 'grid' dentro de una cuadrícula de
  // 2 columnas; el resto (classic/featured/icon) mantiene el flujo apilado.
  const chunks = []
  for (const action of actions) {
    const isGrid = action.layout === 'grid'
    const last = chunks[chunks.length - 1]
    if (isGrid && last?.grid) {
      last.items.push(action)
    } else {
      chunks.push({ grid: isGrid, items: [action] })
    }
  }
  return (
    <div className="flex w-full flex-col gap-3">
      {chunks.map((chunk, index) =>
        chunk.grid ? (
          <div key={`grid-${index}`} className="grid grid-cols-2 gap-3">
            {chunk.items.map((action) => (
              <ActionCard key={action.key} action={action} business={business} theme={theme} lang={lang} />
            ))}
          </div>
        ) : (
          <ActionCard key={chunk.items[0].key} action={chunk.items[0]} business={business} theme={theme} lang={lang} />
        )
      )}
    </div>
  )
}

function ActionCard({ action, business, theme, lang = 'es' }) {
  const [showAccount, setShowAccount] = useState(false)
  const style = business.buttonStyle || {}
  const radius = buttonRadius(style.shape)
  const colors = getButtonColors(action, theme, style)
  const background = colors.background
  const color = colors.text
  const border = `${buttonBorderWidth(style.variant)}px solid ${colors.border}`
  const shadow = buttonShadow(style, theme, colors.border)
  const animation = animationClass(action.animation)
  const innerAnimation = innerAnimationClass(action.animation)
  const cardStyle = { background, color, border, borderRadius: radius, boxShadow: shadow }

  const layout = action.layout || 'classic'

  const content = layout === 'featured' ? (
    <>
      {action.thumbnail ? (
        <img src={action.thumbnail} alt={action.label || ''} className="aspect-video w-full object-cover" />
      ) : (
        <div className="flex aspect-[2.4/1] w-full items-center justify-center" style={{ background: `${theme.accent}22` }}>
          <Icon name={action.icon} size={48} />
        </div>
      )}
      <div className="flex items-center gap-3 px-4 py-3 font-semibold">
        <Icon name={action.icon} size={21} />
        <span className="flex-1 text-left">{action.label}</span>
        <span aria-hidden="true">›</span>
      </div>
    </>
  ) : layout === 'grid' ? (
    <>
      {action.thumbnail ? (
        <img src={action.thumbnail} alt={action.label || ''} className="aspect-square w-full object-cover" />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center" style={{ background: `${theme.accent}22` }}>
          <Icon name={action.icon} size={40} />
        </div>
      )}
      <span className="block px-3 py-2.5 text-center text-sm font-semibold">{action.label}</span>
    </>
  ) : layout === 'icon' ? (
    <Icon name={action.icon} size={24} />
  ) : (
    <>
      {action.bank ? <BankLogo bank={action.bank} label={action.label} /> : action.thumbnail ? <img src={action.thumbnail} alt={action.label || ''} className="h-10 w-10 shrink-0 rounded-lg object-cover" /> : <Icon name={action.icon} size={21} />}
      <span className="min-w-0 flex-1 break-words text-left">
        {action.label}
        {action.bankAccount?.number && <span className="mt-0.5 block text-xs opacity-75">{action.bankAccount.accountType === 'checking' ? 'Corriente' : 'Ahorros'} · {action.bankAccount.number.slice(-4)}</span>}
      </span>
      <span aria-hidden="true" className="opacity-60">›</span>
    </>
  )

  const layoutClass = layout === 'featured'
    ? 'block overflow-hidden'
    : layout === 'grid'
      ? 'block overflow-hidden'
      : layout === 'icon'
        ? 'mx-auto flex h-14 w-14 items-center justify-center'
        : 'flex min-h-14 items-center gap-3 px-4 py-3'
  const needsAriaLabel = layout === 'icon'
  const widthClass = layout === 'icon' ? '' : 'w-full'
  const className = `${layoutClass} ${widthClass} font-medium backdrop-blur-sm motion-safe:transition-transform motion-safe:hover:scale-[1.015] ${innerAnimation}`
  // Separar la animación del efecto hover evita que ambos compitan por transform.
  const ariaLabel = needsAriaLabel ? action.label : undefined
  return (
    <div className={`${layout === 'icon' ? 'inline-flex' : 'w-full'} ${animation}`} style={{ borderRadius: radius, '--profile-action-glow': theme.accent }}>
      {action.bankAccount && !action.url ? (
        <button type="button" onClick={() => setShowAccount(true)} aria-haspopup="dialog" aria-label={ariaLabel} className={className} style={cardStyle}>{content}</button>
      ) : action.isContact ? (
        <button type="button" onClick={() => downloadVCard(business)} aria-label={ariaLabel} className={className} style={cardStyle}>{content}</button>
      ) : (
        <a href={action.url} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} className={className} style={cardStyle}>{content}</a>
      )}
      {showAccount && <BankAccountDialog account={action.bankAccount} onClose={() => setShowAccount(false)} />}
    </div>
  )
}

function BackgroundPattern({ pattern }) {
  if (!pattern || pattern === 'none') return null
  return <div aria-hidden="true" className={`profile-pattern profile-pattern-${pattern}`} />
}

// La máscara conserva la silueta del logo y permite usar el color del título.
function ClickClickLogo({ color }) {
  return (
    <div
      role="img"
      aria-label="ClyClick"
      style={{
        height: 40,
        width: 160,
        backgroundColor: color,
        mask: 'url("/logo-clyclick.png") center / contain no-repeat',
        WebkitMask: 'url("/logo-clyclick.png") center / contain no-repeat',
      }}
    />
  )
}
