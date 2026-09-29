import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './Icons.jsx'
import SocialLinkItem from './SocialLinkItem.jsx'
import ShareMenu from './ShareMenu.jsx'
import { resolveTheme, getBackgroundStyle, profileThemeId, themeColor, cardTextColor } from '../utils/themes.js'
import { buildActions, buildSocials, normalizeSocialPosition } from '../utils/links.js'
import { downloadVCard } from '../utils/vcard.js'
import { getProfileSections } from '../utils/banking.js'
import { getButtonColors } from '../utils/buttonColors.js'
import BankLogo from './BankLogo.jsx'
import BankAccountDialog from './BankAccountDialog.jsx'
import { animationClass, innerAnimationClass } from '../utils/animations.js'
import { addressFromMapsUrl } from '../utils/links.js'
import CopyButton from './CopyButton.jsx'
import HeroCarousel from './HeroCarousel.jsx'
import { buttonBorderWidth, buttonRadius, buttonShadow } from '../utils/buttonStyles.js'
import { getFont, fontStylesheetUrl } from '../utils/fonts.js'
import { t, LANGUAGE_LABELS } from '../utils/i18n.js'
import { logoPixels, normalizeHeader } from '../utils/header.js'
import { ProfileContext } from './profileContext.js'

// Ancho a partir del cual el perfil público usa el diseño de escritorio.
export const WIDE_QUERY = '(min-width: 768px)'

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


function useMediaQuery(query) {
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

// #2 Color de la barra del navegador móvil. El servidor ya lo incrusta en el
// HTML; aquí se ajusta al tema real (p. ej. claro/oscuro automático).
function useThemeColor(color) {
  useEffect(() => {
    if (!color || typeof document === 'undefined') return
    const previous = [...document.querySelectorAll('meta[name="theme-color"]')]
    previous.forEach((meta) => meta.remove())
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = color
    document.head.appendChild(meta)
    return () => {
      meta.remove()
      previous.forEach((node) => document.head.appendChild(node))
    }
  }, [color])
}

// Desplaza `element` dentro de `container` solo lo necesario para verlo.
function scrollIntoContainer(element, container) {
  if (!element || !container) return
  let top = 0
  let node = element
  while (node && node !== container) {
    top += node.offsetTop
    node = node.offsetParent
  }
  if (node !== container) return
  const bottom = top + element.offsetHeight
  const margin = 24
  if (top < container.scrollTop + margin) container.scrollTo({ top: Math.max(0, top - margin), behavior: 'smooth' })
  else if (bottom > container.scrollTop + container.clientHeight - margin) container.scrollTo({ top: bottom - container.clientHeight + margin, behavior: 'smooth' })
}

// Vista de presentación del perfil de un negocio.
// Se usa en la página pública y dentro del simulador del admin.
// - `embedded`: se renderiza a tamaño real dentro de un marco (simulador),
//   ocupando la altura del marco en lugar de la de la ventana.
// - `device`: 'mobile' | 'desktop'. En el simulador fija el diseño; en la
//   página pública se decide con el ancho de la ventana.
// - `forceScheme`: 'light' | 'dark' para previsualizar el modo automático.
// - `onSelect(target)`: en el editor, tocar un elemento lo selecciona en vez de
//   abrirlo. target = { kind: 'action', key } | { kind: 'section', id }.
// - `highlightKey`: clave de la acción resaltada (se está editando).
// - `portalTarget`: nodo donde se montan las ventanas (Compartir, cuentas).
export default function ProfileView({
  business: rawBusiness,
  compact = false,
  embedded = false,
  device,
  forceScheme,
  onSelect,
  highlightKey = '',
  portalTarget = null,
}) {
  const langs = enabledLanguages(rawBusiness)
  const [lang, setLang] = useState('es')
  const activeLang = langs.includes(lang) ? lang : 'es'
  const business = localizeBusiness(rawBusiness, activeLang)
  const root = useRef(null)

  // #16 Modo claro/oscuro automático: cuando está activo, elige entre el tema
  // claro y el oscuro configurados según prefers-color-scheme del sistema.
  const systemDark = usePrefersDark()
  const prefersDark = forceScheme ? forceScheme === 'dark' : systemDark
  const themeId = profileThemeId(rawBusiness, prefersDark)

  // #11 Diseño de escritorio: en la página pública depende del ancho de la
  // ventana; en el simulador lo decide el editor (no la ventana del admin).
  const mediaWide = useMediaQuery(WIDE_QUERY)
  const wide = !compact && (embedded ? device === 'desktop' : mediaWide)

  // #8 Fuente personalizada: carga el stylesheet solo si hay fuente elegida.
  useProfileFont(rawBusiness.font)
  const font = getFont(rawBusiness.font)
  useThemeColor(embedded ? '' : themeColor(rawBusiness, prefersDark))

  const theme = resolveTheme(themeId, business.customColors)
  const header = normalizeHeader(business.header)
  const left = header.align === 'left'
  const actions = buildActions(business)
  const socials = buildSocials(business)
  const socialPosition = normalizeSocialPosition(business.socialPosition)
  const selectable = typeof onSelect === 'function'
  const socialsRow = socials.length > 0 && (
    <div data-preview-target="section:contact" className={`flex w-full flex-wrap gap-3 ${left ? 'justify-start' : 'justify-center'} ${socialPosition === 'bottom' ? 'mt-6' : 'mt-5'}`}>
      {socials.map((s) => (
        <SocialLinkItem key={s.key} social={s} theme={theme} />
      ))}
    </div>
  )
  const sections = getProfileSections(business)
  const background = business.background || { type: 'theme' }
  const context = useMemo(() => ({ portalTarget, wide, embedded, fontFamily: font?.family }), [portalTarget, wide, embedded, font?.family])

  // #6 Resaltar en el preview el elemento que se está editando.
  useEffect(() => {
    if (!highlightKey || !root.current) return
    const target = root.current.querySelector(`[data-preview-target="action:${CSS.escape(highlightKey)}"]`)
    scrollIntoContainer(target, root.current.closest('[data-preview-scroller]'))
  }, [highlightKey])

  // #6 En el editor, tocar un elemento del preview abre su configuración.
  function handleSelect(event) {
    // Las ventanas (Compartir) se montan fuera del perfil con un portal, pero
    // React propaga sus clics por aquí: se dejan pasar para que funcionen.
    if (!event.currentTarget.contains(event.target)) return
    if (event.target.closest('[data-preview-ignore]')) return
    const node = event.target.closest('[data-preview-target]')
    event.preventDefault()
    event.stopPropagation()
    const value = node?.getAttribute('data-preview-target') || 'section:design'
    const [kind, ...rest] = value.split(':')
    const id = rest.join(':')
    onSelect(kind === 'action' ? { kind, key: id } : { kind: 'section', id })
  }

  const padding = compact ? 'px-4 py-6' : wide ? 'px-8 pt-12 pb-8' : 'px-6 pt-10 pb-6'
  const logoSize = logoPixels(header.logoSize, compact)

  return (
    <ProfileContext.Provider value={context}>
      <div
        ref={root}
        className={`${compact || embedded ? 'min-h-full' : 'min-h-screen'} profile-background relative w-full flex flex-col items-center overflow-hidden ${selectable ? 'profile-selectable' : ''}`}
        style={{ ...getBackgroundStyle(theme, ['image', 'video'].includes(background.type) ? null : background), color: theme.text, ...(font ? { fontFamily: font.family } : {}) }}
        onClickCapture={selectable ? handleSelect : undefined}
      >
        {['image', 'video'].includes(background.type) && background.url && (
          <>
            <div aria-hidden="true" className="absolute pointer-events-none" style={{ inset: -Math.max(0, Math.min(30, Number(background.blur) || 0)) * 2, filter: `blur(${Math.max(0, Math.min(30, Number(background.blur) || 0))}px)` }}>
              {background.type === 'video'
                ? <video className="h-full w-full object-cover" src={background.url} autoPlay muted loop playsInline preload="metadata" />
                : <div className="h-full w-full" style={{ backgroundImage: `url("${background.url}")`, backgroundSize: 'cover', backgroundPosition: background.position || 'center' }} />}
            </div>
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: `rgba(0,0,0,${Number(background.overlay ?? 0.25)})` }} />
          </>
        )}
        <BackgroundPattern pattern={background.pattern || theme.pattern} />

        {/* Columna del perfil. En escritorio (#11) es un panel centrado. */}
        <div className={`relative z-10 flex w-full flex-col items-center ${wide ? 'my-12 max-w-[480px]' : `flex-1 ${compact ? 'max-w-full' : 'max-w-lg'}`}`}>
          {wide && (
            // Capa del panel separada del contenido: el desenfoque no debe
            // convertir el panel en contenedor de las ventanas `fixed`.
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[2rem] backdrop-blur-xl"
              style={{ background: `color-mix(in srgb, ${theme.bg} 50%, transparent)`, border: `1px solid ${theme.border}`, boxShadow: '0 30px 80px -20px rgba(0,0,0,.45)' }}
            />
          )}

          {langs.length > 1 && (
            <div
              data-preview-ignore
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
                  className="profile-press rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={activeLang === code
                    ? { background: theme.accent, color: theme.accentText }
                    : { color: cardTextColor(theme), opacity: 0.7 }}
                >
                  {LANGUAGE_LABELS[code] || code.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          <ShareMenu business={business} theme={theme} compact={compact} />

          {/* #7 Portada opcional: la imagen se funde con el fondo por abajo. */}
          {header.cover && (
            <div data-preview-target="section:basic" className={`relative w-full overflow-hidden ${wide ? 'rounded-t-[2rem]' : ''}`} style={{ height: compact ? 132 : wide ? 190 : 176 }}>
              <img
                src={header.cover}
                alt=""
                width={960}
                height={352}
                fetchpriority="high"
                decoding="async"
                className="h-full w-full object-cover"
                style={{ WebkitMaskImage: 'linear-gradient(180deg, #000 55%, transparent)', maskImage: 'linear-gradient(180deg, #000 55%, transparent)' }}
              />
            </div>
          )}

          {/* Con logo a la izquierda, sin portada y selector de idioma, se baja el
              contenido para que el selector no tape el logo. */}
          <div className={`relative flex w-full flex-1 flex-col items-center ${padding} ${header.cover ? '!pt-0' : left && langs.length > 1 ? (compact ? '!pt-14' : '!pt-16') : ''}`}>
            {/* Tarjeta de presentación: logo, nombre, categoría y descripción (con slides opcionales) */}
            <div data-preview-target="section:basic" className="w-full" style={header.cover ? { marginTop: -Math.round(logoSize * 0.55) } : undefined}>
              <HeroCarousel business={business} theme={theme} compact={compact} />
            </div>

            {/* Redes sociales (arriba, justo bajo el hero) */}
            {socialPosition === 'top' && socialsRow}

            {/* Botones de acción */}
            <div className="mt-6 flex w-full flex-col gap-5">
              <ActionGroup actions={actions.filter((action) => !action.sectionId)} business={business} theme={theme} lang={activeLang} highlightKey={highlightKey} />
              {sections.map((section) => {
                const grouped = actions.filter((action) => action.sectionId === section.id)
                if (!grouped.length) return null
                return (
                  <section key={section.id} className="w-full">
                    <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-[.16em]" style={{ color: theme.subtext }}>
                      {section.title}
                    </h2>
                    <ActionGroup actions={grouped} business={business} theme={theme} lang={activeLang} highlightKey={highlightKey} />
                  </section>
                )
              })}
            </div>

            {/* Copiar con un toque (#12): teléfono y dirección cuando existen */}
            <ContactCopyRow business={business} theme={theme} align={header.align} />

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
      </div>
    </ProfileContext.Provider>
  )
}

// Fila de "copiar con un toque" (#12) para valores concretos: teléfono y
// dirección. La dirección se deriva del enlace de Google Maps del negocio.
// Solo se muestra si hay al menos un valor copiable. Etiquetas en español.
function ContactCopyRow({ business, theme, align = 'center' }) {
  const phone = String(business.phone || '').trim()
  const address = addressFromMapsUrl(business.mapsUrl)
  if (!phone && !address) return null
  const chipStyle = {
    background: `color-mix(in srgb, ${theme.card} 82%, transparent)`,
    color: theme.cardText || theme.text,
    border: `1px solid ${theme.border}`,
  }
  return (
    <div data-preview-target="section:contact" className={`mt-5 flex w-full flex-wrap gap-2 ${align === 'left' ? 'justify-start' : 'justify-center'}`}>
      {phone && (
        <CopyButton
          value={phone}
          label={phone}
          ariaLabel={`Copiar teléfono ${phone}`}
          iconSize={15}
          className="profile-press max-w-full break-all rounded-full px-3.5 py-2 text-xs font-semibold backdrop-blur-md"
          style={chipStyle}
        />
      )}
      {address && (
        <CopyButton
          value={address}
          label={address}
          ariaLabel={`Copiar dirección ${address}`}
          iconSize={15}
          className="profile-press max-w-full break-words rounded-full px-3.5 py-2 text-xs font-semibold backdrop-blur-md"
          style={chipStyle}
        />
      )}
    </div>
  )
}

function ActionGroup({ actions, business, theme, lang = 'es', highlightKey = '' }) {
  if (!actions.length) return null
  // Agrupa acciones consecutivas del mismo layout agrupable: 'grid' forma una
  // cuadrícula de 2 columnas y 'icon' una fila centrada de iconos (como la fila
  // de iconos de Linktree). Classic y featured mantienen el flujo apilado.
  const chunks = groupActions(actions)
  return (
    <div className="flex w-full flex-col gap-3">
      {chunks.map((chunk, index) =>
        chunk.kind === 'grid' ? (
          <div key={`grid-${index}`} className="grid grid-cols-2 items-stretch gap-3">
            {chunk.items.map((action) => (
              <ActionCard key={action.key} action={action} business={business} theme={theme} lang={lang} highlighted={highlightKey === action.key} />
            ))}
          </div>
        ) : chunk.kind === 'icon' ? (
          <div key={`icon-${index}`} className="flex flex-wrap justify-center gap-3">
            {chunk.items.map((action) => (
              <ActionCard key={action.key} action={action} business={business} theme={theme} lang={lang} highlighted={highlightKey === action.key} />
            ))}
          </div>
        ) : (
          <ActionCard key={chunk.items[0].key} action={chunk.items[0]} business={business} theme={theme} lang={lang} highlighted={highlightKey === chunk.items[0].key} />
        )
      )}
    </div>
  )
}

// Agrupa acciones consecutivas con layout 'grid' o 'icon'.
export function groupActions(actions) {
  const chunks = []
  for (const action of actions) {
    const kind = action.layout === 'grid' || action.layout === 'icon' ? action.layout : 'single'
    const last = chunks[chunks.length - 1]
    if (kind !== 'single' && last?.kind === kind) last.items.push(action)
    else chunks.push({ kind, items: [action] })
  }
  return chunks
}

function ActionCard({ action, business, theme, lang = 'es', highlighted = false }) {
  const [showAccount, setShowAccount] = useState(false)
  const style = business.buttonStyle || {}
  const layout = action.layout || 'classic'
  const radius = buttonRadius(style.shape, layout)
  const colors = getButtonColors(action, theme, style)
  const background = colors.background
  const color = colors.text
  const border = `${buttonBorderWidth(style.variant)}px solid ${colors.border}`
  const shadow = buttonShadow(style, theme, colors.border)
  const animation = animationClass(action.animation)
  const innerAnimation = innerAnimationClass(action.animation)
  const cardStyle = { background, color, border, borderRadius: radius, boxShadow: shadow }
  // Fondo del área de imagen cuando no hay miniatura: un velo del color del
  // texto del botón, que siempre contrasta con su fondo (incluso en temas con
  // tarjetas claras sobre fondo oscuro o con colores personalizados).
  const mediaBackground = `color-mix(in srgb, ${color} 9%, transparent)`
  const pillLike = style.shape === 'pill'

  const content = layout === 'featured' ? (
    <>
      {action.thumbnail ? (
        <img src={action.thumbnail} alt={action.label || ''} width={640} height={360} loading="lazy" decoding="async" className="aspect-video w-full object-cover" />
      ) : (
        <div className="flex aspect-[2.4/1] w-full items-center justify-center" style={{ background: mediaBackground }}>
          <Icon name={action.icon} size={48} />
        </div>
      )}
      <div className={`flex items-center gap-3 py-3 font-semibold ${pillLike ? 'px-5' : 'px-4'}`}>
        {action.thumbnail && <Icon name={action.icon} size={21} />}
        <span className="min-w-0 flex-1 break-words text-left">{action.label}</span>
        <span aria-hidden="true" className="opacity-60">›</span>
      </div>
    </>
  ) : layout === 'grid' ? (
    <>
      {action.thumbnail ? (
        <img src={action.thumbnail} alt={action.label || ''} width={400} height={400} loading="lazy" decoding="async" className="aspect-square w-full shrink-0 object-cover" />
      ) : (
        <div className="flex aspect-square w-full shrink-0 items-center justify-center" style={{ background: mediaBackground }}>
          <Icon name={action.icon} size={40} />
        </div>
      )}
      <span className="flex flex-1 items-center justify-center break-words px-3 py-2.5 text-center text-sm font-semibold leading-snug">{action.label}</span>
    </>
  ) : layout === 'icon' ? (
    <Icon name={action.icon} size={24} />
  ) : (
    <>
      {action.bank ? <BankLogo bank={action.bank} label={action.label} /> : action.thumbnail ? <img src={action.thumbnail} alt={action.label || ''} width={40} height={40} loading="lazy" decoding="async" className="h-10 w-10 shrink-0 rounded-lg object-cover" /> : <Icon name={action.icon} size={21} />}
      <span className="min-w-0 flex-1 break-words text-left">
        {action.label}
        {action.bankAccount?.number && <span className="mt-0.5 block text-xs opacity-75">{action.bankAccount.accountType === 'checking' ? 'Corriente' : 'Ahorros'} · {action.bankAccount.number.slice(-4)}</span>}
      </span>
      <span aria-hidden="true" className="opacity-60">›</span>
    </>
  )

  const layoutClass = layout === 'featured'
    ? 'block w-full overflow-hidden'
    : layout === 'grid'
      ? 'flex h-full w-full flex-col overflow-hidden'
      : layout === 'icon'
        ? 'flex h-14 w-14 items-center justify-center'
        : `flex min-h-14 w-full items-center gap-3 py-3 ${pillLike ? 'px-6' : 'px-4'}`
  const needsAriaLabel = layout === 'icon'
  // profile-press: respuesta al pasar el mouse (solo en dispositivos con
  // puntero) y al tocar (#4). Va en el botón y la animación en el contenedor
  // para que no compitan por `transform`.
  const className = `profile-press ${layoutClass} font-medium backdrop-blur-sm ${innerAnimation}`
  const ariaLabel = needsAriaLabel ? action.label : undefined
  const wrapperClass = layout === 'icon' ? 'inline-flex' : layout === 'grid' ? 'h-full w-full' : 'w-full'
  return (
    <div data-preview-target={`action:${action.key}`} className={`relative ${wrapperClass} ${animation} ${highlighted ? 'profile-preview-highlight' : ''}`} title={needsAriaLabel ? action.label : undefined} style={{ borderRadius: radius, '--profile-action-glow': theme.accent }}>
      {action.bankAccount && !action.url ? (
        <button type="button" onClick={() => setShowAccount(true)} aria-haspopup="dialog" aria-label={ariaLabel} className={className} style={cardStyle}>{content}</button>
      ) : action.isContact ? (
        <button type="button" onClick={() => downloadVCard(business)} aria-label={ariaLabel} className={className} style={cardStyle}>{content}</button>
      ) : (
        <a href={action.url} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} className={className} style={cardStyle}>{content}</a>
      )}
      {showAccount && <BankAccountDialog account={action.bankAccount} theme={theme} onClose={() => setShowAccount(false)} />}
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
