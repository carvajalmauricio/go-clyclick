import { Icon } from './Icons.jsx'
import { cardTextColor } from '../utils/themes.js'

// Botón circular de red social
export default function SocialLinkItem({ social, theme }) {
  return (
    <a
      href={social.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={social.label || social.key}
      className="flex items-center justify-center rounded-full transition-transform hover:scale-110"
      style={{
        width: 46,
        height: 46,
        background: theme.card,
        border: `1px solid ${theme.border}`,
        color: cardTextColor(theme),
      }}
    >
      <Icon name={social.key} size={22} />
    </a>
  )
}
