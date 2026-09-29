import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icons.jsx'
import QRCodeStudio from '../QRCodeStudio.jsx'
import PrintableDisplay from '../PrintableDisplay.jsx'
import { IconButton, inputCls } from './ui.jsx'
import { Avatar, Brand, initialsOf, readDraft, timeAgo } from './common.jsx'
import { useToast } from './Toast.jsx'
import { deleteBusiness, getBusiness, listBusinesses } from '../../utils/api.js'
import { getBackgroundStyle, profileThemeId, resolveTheme } from '../../utils/themes.js'
import { getButtonColors } from '../../utils/buttonColors.js'
import { buttonBorderWidth, buttonRadius } from '../../utils/buttonStyles.js'
import { logoRadius, normalizeHeader } from '../../utils/header.js'
import { buildActions } from '../../utils/links.js'
import { profileUrl } from '../../utils/qrGenerator.js'
import { copyText } from '../../utils/clipboard.js'

// Campos visuales que necesita la miniatura. Las entradas antiguas del índice
// no los traen: se completan leyendo el perfil público (máx. 30, de 4 en 4).
function visualFields(business) {
  return {
    theme: business.theme || 'vibrant',
    customColors: business.customColors,
    autoTheme: business.autoTheme,
    lightTheme: business.lightTheme,
    darkTheme: business.darkTheme,
    background: business.background,
    buttonStyle: business.buttonStyle,
    header: business.header,
    buttons: buildActions(business).length,
    ageGate: business.ageGate?.enabled === true,
  }
}

// --- Listado visual de negocios (#12) ---
export default function BusinessList({ setView, email }) {
  const toast = useToast()
  const [items, setItems] = useState(null)
  const [enriched, setEnriched] = useState({})
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null) // { business, tab: 'qr' | 'print' }

  async function refresh() {
    setError('')
    try {
      setItems(await listBusinesses())
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (!items) return
    const queue = items.filter((entry) => !entry.theme).slice(0, 30)
    if (!queue.length) return
    let active = true
    const worker = async () => {
      while (queue.length && active) {
        const entry = queue.shift()
        try {
          const full = await getBusiness(entry.slug)
          if (full && active) setEnriched((prev) => ({ ...prev, [entry.slug]: visualFields(full) }))
        } catch { /* La miniatura usa el tema por defecto. */ }
      }
    }
    Promise.all([worker(), worker(), worker(), worker()])
    return () => { active = false }
  }, [items])

  const filtered = useMemo(() => {
    if (!items) return []
    const q = query.toLowerCase().trim()
    const list = q
      ? items.filter((b) => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q) || (b.category || '').toLowerCase().includes(q))
      : items
    return [...list].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).map((entry) => ({ ...entry, ...(enriched[entry.slug] || {}) }))
  }, [items, query, enriched])

  async function onDelete(entry) {
    if (!confirm(`¿Eliminar el negocio "${entry.name || entry.slug}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteBusiness(entry.slug)
      toast.success(`«${entry.name || entry.slug}» eliminado.`)
      refresh()
    } catch (e) {
      toast.error(e.message)
    }
  }

  async function openModal(slug, tab) {
    try {
      const business = await getBusiness(slug)
      if (business) setModal({ business, tab })
    } catch (e) {
      toast.error(e.message)
    }
  }

  async function copyLink(slug) {
    const ok = await copyText(profileUrl(slug))
    ok ? toast.success('Enlace copiado.', { id: 'copy' }) : toast.error('No se pudo copiar el enlace.')
  }

  return (
    <div className="min-h-screen bg-clickclick-dark text-white">
      <header className="sticky top-0 z-20 border-b border-gray-800 bg-clickclick-dark/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Brand />
          <div className="flex-1" />
          {email && <span className="hidden max-w-[200px] truncate text-xs text-gray-500 md:inline">{email}</span>}
          <a href="/cdn-cgi/access/logout" className="rounded-lg px-2 py-2 text-sm text-gray-400 hover:text-white">
            Salir
          </a>
          <button
            onClick={() => setView('edit-new')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-clickclick-orange px-3 py-2 text-sm font-semibold text-clickclick-dark hover:brightness-110 sm:px-4"
          >
            <Icon name="plus" size={16} />
            <span>Nuevo<span className="hidden sm:inline"> negocio</span></span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">Negocios</h1>
            <p className="text-sm text-gray-400">
              {items === null ? 'Cargando...' : `${items.length} ${items.length === 1 ? 'perfil publicado' : 'perfiles publicados'}`}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar negocio..."
              aria-label="Buscar negocios"
              className={`${inputCls} pl-9 pr-8`}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-lg leading-none text-gray-500 hover:text-white">×</button>
            )}
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            <span>{error}</span>
            <button onClick={refresh} className="font-semibold underline">Reintentar</button>
          </div>
        )}

        {items === null && !error && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-[268px] animate-pulse rounded-2xl bg-gray-900" />)}
          </div>
        )}

        {items && items.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-700 px-6 py-14 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-clickclick-orange/10 text-clickclick-orange"><Icon name="store" size={26} /></span>
            <p className="font-semibold">Aún no hay negocios</p>
            <p className="mt-1 max-w-xs text-sm text-gray-400">Crea el primer perfil y compártelo con un enlace o código QR.</p>
            <button onClick={() => setView('edit-new')} className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-clickclick-orange px-4 py-2 text-sm font-semibold text-clickclick-dark">
              <Icon name="plus" size={16} /> Crear negocio
            </button>
          </div>
        )}
        {items && items.length > 0 && filtered.length === 0 && (
          <p className="rounded-2xl border border-gray-800 px-6 py-10 text-center text-sm text-gray-400">Sin resultados para «{query}».</p>
        )}

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => {
            const draft = readDraft(b.slug)
            return (
              <li key={b.slug} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 transition hover:border-gray-600">
                <button type="button" onClick={() => setView({ mode: 'edit', slug: b.slug })} className="block w-full text-left" aria-label={`Editar ${b.name}`}>
                  <MiniProfile entry={b} />
                </button>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar logo={b.logo} name={b.name} size={36} radius={logoRadius(normalizeHeader(b.header).logoShape, 36)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{b.name}</p>
                      <p className="truncate text-xs text-gray-500">/{b.slug}{b.category && <> · <span className="text-gray-400">{b.category}</span></>}</p>
                    </div>
                    <StatusBadge draft={Boolean(draft)} />
                  </div>
                  <p className="flex flex-wrap gap-x-2 text-[11px] text-gray-500">
                    {b.updatedAt && <span>Actualizado {timeAgo(b.updatedAt)}</span>}
                    {Number.isFinite(b.buttons) && <span>· {b.buttons} {b.buttons === 1 ? 'botón' : 'botones'}</span>}
                    {b.ageGate && <span>· +18</span>}
                  </p>
                  <div className="mt-auto flex items-center gap-1 border-t border-gray-800 pt-3">
                    <button
                      onClick={() => setView({ mode: 'edit', slug: b.slug })}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-clickclick-orange/10 px-3 py-2 text-xs font-semibold text-clickclick-orange hover:bg-clickclick-orange/20"
                    >
                      <Icon name="edit" size={14} /> Editar
                    </button>
                    <span className="flex-1" />
                    <a href={`/${b.slug}`} target="_blank" rel="noreferrer" aria-label={`Ver ${b.name}`} title="Ver perfil" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white"><Icon name="external" size={15} /></a>
                    <IconButton icon="copy" label="Copiar enlace" onClick={() => copyLink(b.slug)} />
                    <IconButton icon="qr" label="Código QR" onClick={() => openModal(b.slug, 'qr')} />
                    <IconButton icon="print" label="Cartel de mesa" onClick={() => openModal(b.slug, 'print')} />
                    <IconButton icon="trash" label={`Eliminar ${b.name}`} tone="danger" onClick={() => onDelete(b)} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </main>

      {modal && (
        <ResourceModal
          business={modal.business}
          tab={modal.tab}
          onTab={(tab) => setModal({ ...modal, tab })}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function StatusBadge({ draft }) {
  return draft ? (
    <span title="Hay cambios guardados en este navegador que aún no se publican" className="shrink-0 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">Borrador</span>
  ) : (
    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Publicado</span>
  )
}

// Miniatura del perfil con su tema, fondo, logo y estilo de botones.
function MiniProfile({ entry }) {
  const theme = resolveTheme(profileThemeId(entry), entry.customColors)
  const background = entry.background || {}
  const header = normalizeHeader(entry.header)
  const style = entry.buttonStyle || {}
  const pattern = background.pattern && background.pattern !== 'none' ? background.pattern : background.type === 'theme' || !background.type ? theme.pattern : ''
  const surface = background.type === 'image' && background.url
    ? { backgroundImage: `linear-gradient(rgba(0,0,0,${Number(background.overlay ?? 0.25)}), rgba(0,0,0,${Number(background.overlay ?? 0.25)})), url("${background.url}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : getBackgroundStyle(theme, background.type === 'video' ? null : background)
  const bars = [true, false, false]
  return (
    <div aria-hidden="true" className="relative h-36 overflow-hidden" style={{ ...surface, color: theme.text }}>
      {pattern && <span className={`profile-pattern profile-pattern-${pattern}`} />}
      {header.cover && <img src={header.cover} alt="" loading="lazy" className="absolute inset-x-0 top-0 h-14 w-full object-cover" style={{ WebkitMaskImage: 'linear-gradient(#000 50%, transparent)', maskImage: 'linear-gradient(#000 50%, transparent)' }} />}
      <div className="relative flex h-full flex-col items-center px-10 pt-5 transition-transform duration-300 group-hover:-translate-y-1">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden text-[11px] font-bold shadow" style={{ borderRadius: logoRadius(header.logoShape, 36), background: theme.card, border: `1.5px solid ${theme.accent}`, color: theme.cardText || theme.accent }}>
          {entry.logo ? <img src={entry.logo} alt="" loading="lazy" className="h-full w-full object-cover" /> : initialsOf(entry.name)}
        </span>
        <span className="mt-1.5 max-w-full truncate text-[11px] font-bold">{entry.name}</span>
        <span className="mt-2 flex w-full flex-col gap-1.5">
          {bars.map((primary, index) => {
            const colors = getButtonColors({ primary }, theme, style)
            return (
              <span key={index} className="block h-3.5 w-full" style={{ background: colors.background, border: `${buttonBorderWidth(style.variant)}px solid ${colors.border}`, borderRadius: buttonRadius(style.shape), opacity: index === 2 ? 0.7 : 1 }} />
            )
          })}
        </span>
      </div>
    </div>
  )
}

// --- Modal de recursos (QR / Cartel) ---
function ResourceModal({ business, tab, onTab, onClose }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 no-print" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tab === 'qr' ? 'Código QR' : 'Cartel de mesa'}
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 no-print">
          <div className="flex gap-2">
            <button
              onClick={() => onTab('qr')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'qr' ? 'bg-clickclick-orange text-clickclick-dark' : 'bg-gray-800 text-white'}`}
            >
              Código QR
            </button>
            <button
              onClick={() => onTab('print')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'print' ? 'bg-clickclick-orange text-clickclick-dark' : 'bg-gray-800 text-white'}`}
            >
              Cartel de mesa
            </button>
          </div>
          <button onClick={onClose} aria-label="Cerrar" title="Cerrar (Esc)" className="text-gray-400 hover:text-white text-xl leading-none no-print">×</button>
        </div>
        <div className="p-6 flex justify-center">
          {tab === 'qr' ? <QRCodeStudio business={business} /> : <PrintableDisplay business={business} />}
        </div>
      </div>
    </div>
  )
}
