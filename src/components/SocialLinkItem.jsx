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
      className="profile-press flex items-center justify-center rounded-full"
      style={{
        width: 46,
        height: 46,
        background: theme.card,
        border: `1px solid ${theme.border}`,
        color: cardTextColor(theme),
        '--press-hover': 1.1,
        '--press-active': 0.9,
      }}
    >
      <Icon name={social.key} size={22} />
    </a>
  )
}
