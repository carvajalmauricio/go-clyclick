// Iconos SVG inline (sin dependencias externas). Heredan color con currentColor.

export function Icon({ name, size = 22, className = '' }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
  }
  switch (name) {
    case 'whatsapp':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.4 1.3-1.94 1.35-.5.05-1.13.07-1.82-.11-.42-.11-.96-.29-1.65-.58-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-2.99 0-1.42.75-2.12 1.01-2.41.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.29.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.17-.19.69-.8.87-1.08.18-.28.36-.23.6-.14.24.09 1.55.73 1.82.86.27.14.44.21.51.32.07.12.07.68-.17 1.36Z" />
        </svg>
      )
    case 'star':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
        </svg>
      )
    case 'map':
      return (
        <svg {...props}>
          <path d="M9 20l-5.5 2V6L9 4l6 2 5.5-2v16L15 22l-6-2z" />
          <path d="M9 4v16M15 6v16" />
        </svg>
      )
    case 'maps': // pin de ubicación tipo Google Maps
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M12 2a7 7 0 0 0-7 7c0 4.5 7 13 7 13s7-8.5 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.75-2.05 4 0 4.75 2.64 4.75 6.06V21H17.5v-5.3c0-1.26-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21H9z" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...props}>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
        </svg>
      )
    case 'link':
      return (
        <svg {...props}>
          <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
          <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
        </svg>
      )
    case 'contact':
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6M22 11h-6" />
        </svg>
      )
    case 'share':
      return (
        <svg {...props}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
        </svg>
      )
    case 'copy':
      return (
        <svg {...props}>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )
    case 'instagram':
      return (
        <svg {...props}>
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M16 3c.3 2.1 1.6 3.7 3.7 4v2.6c-1.3.1-2.6-.3-3.7-1v6.1c0 3.1-2.5 5.6-5.6 5.6S4.8 17.8 4.8 14.7c0-3 2.3-5.4 5.3-5.6v2.7c-1.5.2-2.6 1.4-2.6 2.9 0 1.6 1.3 2.9 2.9 2.9s2.9-1.3 2.9-2.9V3H16z" />
        </svg>
      )
    case 'facebook':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.25-1.5 1.55-1.5H17V4.6c-.3 0-1.25-.1-2.35-.1-2.32 0-3.9 1.42-3.9 4.02v2.28H8v3.1h2.75V22h2.75z" />
        </svg>
      )
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
  }
}
