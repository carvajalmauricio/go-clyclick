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
    case 'youtube':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.77-1.77C19.34 5.1 12 5.1 12 5.1s-7.34 0-8.83.43A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.77 1.77C4.66 18.9 12 18.9 12 18.9s7.34 0 8.83-.43a2.5 2.5 0 0 0 1.77-1.77C23 15.2 23 12 23 12zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
        </svg>
      )
    case 'x': // X (Twitter)
    case 'twitter-x':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M17.53 3H20.5l-6.5 7.43L21.75 21h-6l-4.7-6.14L5.66 21H2.69l6.96-7.95L2.25 3h6.15l4.25 5.62L17.53 3zm-1.05 16.2h1.65L7.6 4.71H5.83L16.48 19.2z" />
        </svg>
      )
    case 'threads':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M17.4 11.2c-.1 0-.2-.1-.3-.1-.15-2.7-1.63-4.25-4.1-4.27h-.04c-1.48 0-2.71.63-3.47 1.78l1.36.93c.57-.86 1.46-1.04 2.11-1.04h.03c.81 0 1.42.24 1.82.7.29.34.48.8.58 1.39-.72-.12-1.5-.16-2.33-.11-2.34.13-3.85 1.5-3.75 3.39.05.96.53 1.79 1.34 2.33.69.46 1.57.68 2.49.63 1.22-.07 2.17-.53 2.84-1.38.5-.64.82-1.47.96-2.51.58.35 1.01.81 1.25 1.36.4.94.43 2.48-.83 3.74-1.1 1.1-2.43 1.58-4.42 1.59-2.21-.02-3.88-.73-4.97-2.11-1.02-1.3-1.55-3.17-1.57-5.57.02-2.4.55-4.27 1.57-5.57 1.09-1.38 2.76-2.09 4.97-2.11 2.23.02 3.93.73 5.05 2.12.55.68.96 1.54 1.24 2.53l1.6-.43c-.33-1.22-.85-2.28-1.56-3.15C16.9 1.9 14.78 1.02 12.05 1h-.01C9.32 1.02 7.24 1.9 5.86 3.61 4.63 5.14 4 7.27 3.98 9.99v.02c.02 2.72.65 4.85 1.88 6.38 1.38 1.71 3.46 2.59 6.18 2.61h.01c2.42-.02 4.12-.65 5.53-2.06 1.84-1.84 1.79-4.14 1.18-5.56-.44-1.02-1.28-1.85-2.44-2.4z" />
        </svg>
      )
    case 'pinterest':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.64 7.86 6.36 9.32-.09-.79-.17-2 .03-2.86.18-.78 1.17-4.97 1.17-4.97s-.3-.6-.3-1.48c0-1.39.81-2.43 1.81-2.43.85 0 1.27.64 1.27 1.41 0 .86-.55 2.14-.83 3.33-.24.99.5 1.8 1.47 1.8 1.77 0 3.13-1.87 3.13-4.56 0-2.38-1.71-4.05-4.15-4.05-2.83 0-4.49 2.12-4.49 4.31 0 .85.33 1.77.74 2.27.08.1.09.19.07.29-.08.32-.25 1-.28 1.14-.05.19-.15.23-.35.14-1.28-.6-2.08-2.46-2.08-3.97 0-3.23 2.35-6.2 6.77-6.2 3.55 0 6.31 2.53 6.31 5.92 0 3.53-2.22 6.37-5.31 6.37-1.04 0-2.01-.54-2.35-1.18l-.64 2.43c-.23.89-.85 2-1.27 2.68.96.3 1.97.45 3.03.45 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
        </svg>
      )
    case 'telegram':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M21.94 4.6 18.6 19.9c-.25 1.1-.9 1.38-1.83.86l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.13 9.34-8.44c.4-.36-.09-.56-.63-.2L5.63 13.1.66 11.55c-1.08-.34-1.1-1.08.23-1.6L20.54 3.2c.9-.34 1.69.2 1.4 1.4z" />
        </svg>
      )
    case 'spotify':
      return (
        <svg {...props} fill="currentColor" stroke="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.59 14.43c-.19.31-.59.41-.9.22-2.46-1.5-5.56-1.84-9.21-1.01-.35.08-.7-.14-.78-.49-.08-.35.14-.7.49-.78 4-.91 7.42-.52 10.18 1.16.31.19.41.59.22.9zm1.22-2.72c-.24.38-.74.5-1.12.27-2.82-1.73-7.11-2.23-10.44-1.22-.43.13-.88-.11-1.01-.54-.13-.43.11-.88.54-1.01 3.8-1.15 8.53-.59 11.76 1.39.38.24.5.74.27 1.11zm.11-2.83C14.53 8.85 9.4 8.66 6.3 9.6c-.51.15-1.05-.13-1.2-.64-.15-.51.13-1.05.64-1.2 3.56-1.08 9.22-.87 12.86 1.29.46.27.61.87.34 1.33-.27.46-.86.61-1.32.34z" />
        </svg>
      )
    case 'email':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...props}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      )
    // --- Iconos de interfaz del panel admin ---
    case 'arrow-left':
      return <svg {...props}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
    case 'chevron-up':
      return <svg {...props}><path d="m18 15-6-6-6 6" /></svg>
    case 'chevron-down':
      return <svg {...props}><path d="m6 9 6 6 6-6" /></svg>
    case 'plus':
      return <svg {...props}><path d="M12 5v14M5 12h14" /></svg>
    case 'search':
      return <svg {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
    case 'eye':
      return <svg {...props}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
    case 'edit':
      return <svg {...props}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
    case 'qr':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
        </svg>
      )
    case 'print':
      return <svg {...props}><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
    case 'trash':
      return <svg {...props}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
    case 'upload':
      return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5M12 3v12" /></svg>
    case 'external':
      return <svg {...props}><path d="M15 3h6v6M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
    case 'more':
      return <svg {...props} fill="currentColor" stroke="none"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
    case 'info':
      return <svg {...props}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
    case 'slides':
      return <svg {...props}><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M2 7v10M22 7v10" /></svg>
    case 'cursor':
      return <svg {...props}><path d="m4 4 7 17 2.5-7.5L21 11z" /></svg>
    case 'bank':
      return <svg {...props}><path d="M3 10h18L12 3zM5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" /></svg>
    case 'palette':
      return (
        <svg {...props}>
          <path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4.5 4H16a2 2 0 0 0-1.5 3.3c.4.5.3 1.4-.3 1.9-.6.5-1.4.8-2.2.8z" />
          <circle cx="7.5" cy="11" r="1" fill="currentColor" /><circle cx="10.5" cy="7" r="1" fill="currentColor" /><circle cx="15.5" cy="7.5" r="1" fill="currentColor" />
        </svg>
      )
    case 'store':
      return <svg {...props}><path d="M3 9 4.5 4h15L21 9M3 9v11h18V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M9 20v-6h6v6" /></svg>
    case 'grip':
      return <svg {...props} fill="currentColor" stroke="none"><circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" /></svg>
    // --- Interfaz del editor ---
    case 'check':
      return <svg {...props}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    case 'undo':
      return <svg {...props}><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
    case 'redo':
      return <svg {...props}><path d="M15 14l5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></svg>
    case 'keyboard':
      return <svg {...props}><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></svg>
    case 'smartphone':
      return <svg {...props}><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M11 18h2" /></svg>
    case 'monitor':
      return <svg {...props}><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
    case 'sun':
      return <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    case 'moon':
      return <svg {...props}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
    case 'crop':
      return <svg {...props}><path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" /></svg>
    // --- Iconos adicionales para enlaces ---
    case 'calendar':
      return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>
    case 'cart':
      return <svg {...props}><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.7 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 8H6.2" /></svg>
    case 'gift':
      return <svg {...props}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5" /></svg>
    case 'ticket':
      return <svg {...props}><path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z" /><path d="M14 5v14" strokeDasharray="2 2" /></svg>
    case 'video':
      return <svg {...props}><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l6-3v10l-6-3z" /></svg>
    case 'music':
      return <svg {...props}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
    case 'camera':
      return <svg {...props}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></svg>
    case 'truck':
      return <svg {...props}><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>
    case 'tag':
      return <svg {...props}><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" /><circle cx="8" cy="8" r="1.5" /></svg>
    case 'heart':
      return <svg {...props}><path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" /></svg>
    case 'image':
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
    case 'clock':
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
    case 'food':
      return <svg {...props}><path d="M4 3v8a3 3 0 0 0 3 3v7M7 3v5M10 3v8a3 3 0 0 1-3 3M17 21V3c-2 1-3 4-3 7s1 4 3 4" /></svg>
    case 'scissors':
      return <svg {...props}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12" /></svg>
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
  }
}
