import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { LINK_ICONS } from '../../utils/links.js'
import { Icon } from '../Icons.jsx'

const plain = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Selector visual de iconos con buscador (#8). Busca por nombre y palabras
// clave, sin distinguir tildes. Enter elige el primer resultado.
export default function IconPicker({ value, onChange, label = 'Icono' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef(null)
  const panelId = useId()
  const current = LINK_ICONS.find((option) => option.value === value) || LINK_ICONS[0]
  const results = useMemo(() => {
    const q = plain(query).trim()
    if (!q) return LINK_ICONS
    return LINK_ICONS.filter((option) => plain(`${option.label} ${option.value} ${option.keywords || ''}`).includes(q))
  }, [query])

  useEffect(() => {
    if (!open) return
    const onDown = (event) => { if (!root.current?.contains(event.target)) setOpen(false) }
    const onKey = (event) => {
      if (event.key === 'Escape') { event.stopPropagation(); setOpen(false) }
    }
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  function choose(icon) {
    onChange(icon)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={root} className="relative flex flex-col gap-1 text-xs text-gray-400">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-left text-sm text-white hover:border-gray-500"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-700 text-clickclick-orange"><Icon name={current.value} size={15} /></span>
        <span className="flex-1 truncate">{current.label}</span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} className="text-gray-500" />
      </button>
      {open && (
        <div id={panelId} className="absolute left-0 top-full z-30 mt-1 w-[min(22rem,calc(100vw-3rem))] rounded-xl border border-gray-700 bg-gray-900 p-3 shadow-2xl">
          <div className="relative mb-2">
            <Icon name="search" size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && results[0]) { event.preventDefault(); choose(results[0].value) } }}
              placeholder="Buscar: tienda, reservas, video…"
              aria-label="Buscar icono"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-8 pr-3 text-sm text-white placeholder-gray-500 focus:border-clickclick-orange focus:outline-none"
            />
          </div>
          <div role="listbox" aria-label="Iconos" className="grid max-h-60 grid-cols-5 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-6">
            {results.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === current.value}
                title={option.label}
                onClick={() => choose(option.value)}
                className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[10px] leading-tight ${option.value === current.value ? 'border-clickclick-orange bg-clickclick-orange/10 text-clickclick-orange' : 'border-transparent text-gray-300 hover:border-gray-600 hover:bg-gray-800'}`}
              >
                <Icon name={option.value} size={19} />
                <span className="w-full truncate text-center">{option.label}</span>
              </button>
            ))}
          </div>
          {results.length === 0 && <p className="py-4 text-center text-xs text-gray-500">Sin resultados para «{query}».</p>}
        </div>
      )}
    </div>
  )
}
