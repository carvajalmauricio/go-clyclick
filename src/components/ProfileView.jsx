import { Icon } from './Icons.jsx'
import SocialLinkItem from './SocialLinkItem.jsx'
import { resolveTheme, isLightColor } from '../utils/themes.js'
import { buildActions, buildSocials } from '../utils/links.js'
import { downloadVCard } from '../utils/vcard.js'

// Vista de presentación del perfil de un negocio.
// Se usa en la página pública y dentro del simulador móvil del admin.
export default function ProfileView({ business, compact = false }) {
  const theme = resolveTheme(business.theme, business.customColors)
  const actions = buildActions(business)
  const socials = buildSocials(business)
  const hasContact = business.phone || business.email || business.whatsapp

  const initials = (business.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className={`${compact ? 'min-h-full' : 'min-h-screen'} w-full flex flex-col items-center`}
      style={{ background: theme.bgGradient || theme.bg, color: theme.text }}
    >
      <div className={`w-full flex-1 flex flex-col items-center ${compact ? 'max-w-full px-4 py-6' : 'max-w-md px-6 pt-10 pb-6'}`}>
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
          <p className="mt-3 text-center text-sm" style={{ color: theme.subtext }}>
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
        <div className="w-full mt-6 flex flex-col gap-3">
          {actions.map((a) => (
            <a
              key={a.key}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-transform hover:scale-[1.02]"
              style={
                a.primary
                  ? { background: theme.accent, color: theme.accentText }
                  : a.highlight
                  ? { background: 'transparent', color: theme.accent, border: `2px solid ${theme.accent}` }
                  : { background: theme.card, color: theme.text, border: `1px solid ${theme.border}` }
              }
            >
              <Icon name={a.icon} size={20} />
              <span className="flex-1">{a.label}</span>
            </a>
          ))}

          {/* Guardar contacto (vCard) */}
          {hasContact && (
            <button
              type="button"
              onClick={() => downloadVCard(business)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-transform hover:scale-[1.02]"
              style={{ background: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}
            >
              <Icon name="contact" size={20} />
              <span className="flex-1 text-left">Guardar contacto</span>
            </button>
          )}
        </div>

        {/* Footer fijado al fondo (mt-auto lo empuja abajo) */}
        <div className="mt-auto pt-10 w-full flex flex-col items-center gap-2">
          <ClickClickLogo lightBg={isLightColor(theme.bg)} />
          <div className="text-center text-xs" style={{ color: theme.subtext }}>
            Powered by <span style={{ color: theme.accent, fontWeight: 600 }}>ClyClick</span> · Conecta tu negocio con un toque
          </div>
        </div>
      </div>
    </div>
  )
}

// Logo oficial de ClyClick (PNG en /public). El logo es blanco, así que sobre
// fondos claros lo invertimos a oscuro con un filtro para que sea visible.
function ClickClickLogo({ lightBg }) {
  return (
    <img
      src="/logo-clyclick.png"
      alt="ClyClick"
      style={{
        height: 40,
        width: 'auto',
        objectFit: 'contain',
        filter: lightBg ? 'invert(1)' : 'none',
        opacity: 0.9,
      }}
    />
  )
}
