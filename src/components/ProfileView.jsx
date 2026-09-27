import { useState } from 'react'
import { Icon } from './Icons.jsx'
import SocialLinkItem from './SocialLinkItem.jsx'
import ShareMenu from './ShareMenu.jsx'
import { resolveTheme, getBackgroundStyle } from '../utils/themes.js'
import { buildActions, buildSocials } from '../utils/links.js'
import { downloadVCard } from '../utils/vcard.js'
import { getProfileSections } from '../utils/banking.js'
import { getButtonColors } from '../utils/buttonColors.js'
import BankLogo from './BankLogo.jsx'
import BankAccountDialog from './BankAccountDialog.jsx'
import { animationClass } from '../utils/animations.js'

// Vista de presentación del perfil de un negocio.
// Se usa en la página pública y dentro del simulador móvil del admin.
export default function ProfileView({ business, compact = false }) {
  const theme = resolveTheme(business.theme, business.customColors)
  const actions = buildActions(business)
  const socials = buildSocials(business)
  const sections = getProfileSections(business)
  const background = business.background || { type: 'theme' }

  const initials = (business.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className={`${compact ? 'min-h-full' : 'min-h-screen'} profile-background relative w-full flex flex-col items-center overflow-hidden`}
      style={{ ...getBackgroundStyle(theme, ['image', 'video'].includes(background.type) ? null : background), color: theme.text }}
    >
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
        {/* Logo / avatar */}
        <div
          className="rounded-full flex items-center justify-center overflow-hidden shadow-lg"
          style={{
            width: compact ? 84 : 104,
            height: compact ? 84 : 104,
            background: theme.card,
            border: `2px solid ${theme.accent}`,
          }}
        >
          {business.logo ? (
            <img src={business.logo} alt={business.name} className="w-full h-full object-cover" />
          ) : (
            <span style={{ color: theme.accent, fontSize: compact ? 30 : 38, fontWeight: 700 }}>{initials}</span>
          )}
        </div>

        {/* Nombre + categoría */}
        <h1 className="mt-4 text-center font-bold" style={{ fontSize: compact ? 20 : 26 }}>
          {business.name || 'Nombre del negocio'}
        </h1>
        {business.category && (
          <span
            className="mt-2 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: theme.accent, color: theme.accentText }}
          >
            {business.category}
          </span>
        )}
        {business.description && (
          <p className="mt-3 text-center text-sm" style={{ color: business.descriptionColor || theme.subtext }}>
            {business.description}
          </p>
        )}

        {/* Redes sociales */}
        {socials.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {socials.map((s) => (
              <SocialLinkItem key={s.key} social={s} theme={theme} />
            ))}
          </div>
        )}

        {/* Botones de acción */}
        <div className="mt-6 flex w-full flex-col gap-5">
          <ActionGroup actions={actions.filter((action) => !action.sectionId)} business={business} theme={theme} />
          {sections.map((section) => {
            const grouped = actions.filter((action) => action.sectionId === section.id)
            if (!grouped.length) return null
            return (
              <section key={section.id} className="w-full">
                <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-[.16em]" style={{ color: theme.subtext }}>
                  {section.title}
                </h2>
                <ActionGroup actions={grouped} business={business} theme={theme} />
              </section>
            )
          })}
        </div>

        {/* Footer fijado al fondo (mt-auto lo empuja abajo) */}
        <footer className="mt-auto pt-10 w-full flex flex-col items-center gap-2">
          <ClickClickLogo color={theme.text} />
          <div className="text-center text-xs" style={{ color: theme.subtext }}>
            Powered by <span style={{ color: theme.text, fontWeight: 600 }}>ClyClick</span> · Conecta tu negocio con un toque
          </div>
        </footer>
      </div>
    </div>
  )
}

function ActionGroup({ actions, business, theme }) {
  if (!actions.length) return null
  return (
    <div className="flex w-full flex-col gap-3">
      {actions.map((action) => (
        <ActionCard key={action.key} action={action} business={business} theme={theme} />
      ))}
    </div>
  )
}

function ActionCard({ action, business, theme }) {
  const [showAccount, setShowAccount] = useState(false)
  const style = business.buttonStyle || {}
  const radius = style.shape === 'square' ? 8 : style.shape === 'pill' ? 999 : 16
  const colors = getButtonColors(action, theme, style)
  const background = colors.background
  const color = colors.text
  const border = `${style.variant === 'outline' ? 2 : 1}px solid ${colors.border}`
  const shadow = style.shadow === 'solid' ? `5px 5px 0 ${theme.border}` : style.shadow === 'none' ? 'none' : '0 8px 24px rgba(0,0,0,.14)'
  const animation = animationClass(action.animation)
  const cardStyle = { background, color, border, borderRadius: radius, boxShadow: shadow }

  const content = action.layout === 'featured' ? (
    <>
      {action.thumbnail ? (
        <img src={action.thumbnail} alt="" className="aspect-video w-full object-cover" />
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
  ) : (
    <>
      {action.bank ? <BankLogo bank={action.bank} /> : action.thumbnail ? <img src={action.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" /> : <Icon name={action.icon} size={21} />}
      <span className="min-w-0 flex-1 break-words text-left">
        {action.label}
        {action.bankAccount?.number && <span className="mt-0.5 block text-xs opacity-75">{action.bankAccount.accountType === 'checking' ? 'Corriente' : 'Ahorros'} · {action.bankAccount.number.slice(-4)}</span>}
      </span>
      <span aria-hidden="true" className="opacity-60">›</span>
    </>
  )

  const className = `${action.layout === 'featured' ? 'block overflow-hidden' : 'flex min-h-14 items-center gap-3 px-4 py-3'} w-full font-medium backdrop-blur-sm motion-safe:transition-transform motion-safe:hover:scale-[1.015]`
  // Separar la animación del efecto hover evita que ambos compitan por transform.
  return (
    <div className={`w-full ${animation}`} style={{ borderRadius: radius, '--profile-action-glow': theme.accent }}>
      {action.bankAccount && !action.url ? (
        <button type="button" onClick={() => setShowAccount(true)} aria-haspopup="dialog" className={className} style={cardStyle}>{content}</button>
      ) : action.isContact ? (
        <button type="button" onClick={() => downloadVCard(business)} className={className} style={cardStyle}>{content}</button>
      ) : (
        <a href={action.url} target="_blank" rel="noopener noreferrer" className={className} style={cardStyle}>{content}</a>
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
