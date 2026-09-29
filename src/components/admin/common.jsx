// Piezas compartidas entre el listado y el editor del panel.

export function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div
        role="img"
        aria-label="ClyClick"
        className="h-8 w-11 bg-clickclick-orange"
        style={{ mask: 'url("/logo-clyclick.png") left center / contain no-repeat', WebkitMask: 'url("/logo-clyclick.png") left center / contain no-repeat' }}
      />
      <span className="rounded-md bg-gray-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Admin</span>
    </div>
  )
}

export function initialsOf(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export function Avatar({ logo, name, size = 40, radius = '50%' }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden border border-gray-700 bg-gray-800"
      style={{ width: size, height: size, borderRadius: radius }}
    >
      {logo ? (
        <img src={logo} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="font-bold text-clickclick-orange" style={{ fontSize: size * 0.34 }}>{initialsOf(name)}</span>
      )}
    </span>
  )
}

export function timeAgo(timestamp) {
  const seconds = Math.max(0, (Date.now() - timestamp) / 1000)
  const units = [[31536000, 'año', 'años'], [2592000, 'mes', 'meses'], [86400, 'día', 'días'], [3600, 'hora', 'horas'], [60, 'minuto', 'minutos']]
  for (const [size, one, many] of units) {
    const value = Math.floor(seconds / size)
    if (value >= 1) return `hace ${value} ${value === 1 ? one : many}`
  }
  return 'hace un momento'
}

export function draftKeyFor(slug) {
  return `clyclick:draft:${slug || 'new'}`
}

// ¿Hay un borrador sin publicar de este negocio en este navegador?
export function readDraft(slug) {
  try {
    const draft = JSON.parse(localStorage.getItem(draftKeyFor(slug)) || 'null')
    return draft?.business && typeof draft.business === 'object' && !Array.isArray(draft.business) ? draft : null
  } catch {
    return null
  }
}
