import { useEffect, useMemo, useState } from 'react'
import BusinessForm, { FORM_SECTIONS } from '../components/BusinessForm.jsx'
import { Icon } from '../components/Icons.jsx'
import { IconButton, Spinner, inputCls } from '../components/admin/ui.jsx'
import PhoneMockup from '../components/PhoneMockup.jsx'
import QRCodeStudio from '../components/QRCodeStudio.jsx'
import PrintableDisplay from '../components/PrintableDisplay.jsx'
import { BANK_SECTION_ID, validateBankAccounts } from '../utils/banking.js'
import {
  getIdentity,
  listBusinesses,
  getBusiness,
  saveBusiness,
  deleteBusiness,
} from '../utils/api.js'

const EMPTY_BUSINESS = {
  name: '',
  slug: '',
  category: '',
  description: '',
  descriptionColor: '',
  logo: '',
  heroSlides: { enabled: false, interval: 3, items: [] },
  theme: 'vibrant',
  background: { type: 'theme', pattern: 'none', overlay: 0.25 },
  buttonStyle: { shape: 'rounded', variant: 'filled', shadow: 'soft' },
  whatsapp: '',
  googleReviewUrl: '',
  mapsUrl: '',
  wazeUrl: '',
  menuUrl: '',
  phone: '',
  email: '',
  website: '',
  social: { instagram: '', tiktok: '', facebook: '', linkedin: '' },
  socialOrder: [],
  socialPosition: 'top',
  actionSettings: [],
  sections: [{ id: BANK_SECTION_ID, title: 'Datos Bancarios' }],
  bankAccounts: [],
}

// El acceso a /admin lo protege Cloudflare Access (Google + OTP) ANTES de que
// esta página cargue. Por eso aquí ya no hay pantalla de login por token:
// si el navegador llegó hasta aquí, el usuario ya está autenticado.
export default function AdminDashboard() {
  const [view, setView] = useState('list') // 'list' | 'edit'
  const [identity, setIdentity] = useState(() => (isLocalDevelopment() ? {} : undefined))

  useEffect(() => {
    if (isLocalDevelopment()) return

    let active = true
    getIdentity()
      .then((result) => {
        if (active) setIdentity(result)
      })
      .catch(() => {
        if (active) setIdentity(null)
      })

    return () => {
      active = false
    }
  }, [])

  // Cloudflare Access solo puede interceptar una petición HTTP. Esta barrera
  // también evita mostrar el panel si React llegó a /admin mediante historial
  // o navegación interna sin haber realizado una petición nueva al servidor.
  if (identity === undefined) {
    return <AdminGate message="Verificando sesión segura..." />
  }

  if (!identity) {
    return <AdminGate />
  }

  return view === 'list' ? (
    <BusinessList setView={setView} email={identity.email || ''} />
  ) : (
    <EditorRouter view={view} setView={setView} />
  )
}

function isLocalDevelopment() {
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
}

function AdminGate({ message }) {
  return (
    <div className="min-h-screen bg-clickclick-dark text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-bold text-clickclick-orange">ClickClick Go · Admin</h1>
      {message ? (
        <p className="text-gray-400">{message}</p>
      ) : (
        <>
          <p className="max-w-sm text-gray-400">Necesitas autenticarte con Cloudflare Access para abrir el panel.</p>
          <a href="/admin" className="rounded-lg bg-clickclick-orange px-5 py-2.5 font-semibold text-clickclick-dark">
            Iniciar sesión
          </a>
        </>
      )}
    </div>
  )
}

// --- Listado ---
function BusinessList({ setView, email }) {
  const [items, setItems] = useState(null)
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

  const filtered = useMemo(() => {
    if (!items) return []
    const q = query.toLowerCase().trim()
    const list = q
      ? items.filter((b) => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q) || (b.category || '').toLowerCase().includes(q))
      : items
    return [...list].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  }, [items, query])

  async function onDelete(slug) {
    if (!confirm(`¿Eliminar el negocio "${slug}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteBusiness(slug)
      refresh()
    } catch (e) {
      alert(e.message)
    }
  }

  async function openModal(slug, tab) {
    try {
      const business = await getBusiness(slug)
      if (business) setModal({ business, tab })
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="min-h-screen bg-clickclick-dark text-white">
      <header className="sticky top-0 z-20 border-b border-gray-800 bg-clickclick-dark/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
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

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
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
          <div className="flex flex-col gap-3" aria-hidden="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-[88px] animate-pulse rounded-2xl bg-gray-900" />)}
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

        <ul className="flex flex-col gap-3">
          {filtered.map((b) => (
            <li
              key={b.slug}
              className="flex flex-col gap-3 rounded-2xl border border-gray-800 bg-gray-900/60 p-4 transition hover:border-gray-700 sm:flex-row sm:items-center"
            >
              <button
                type="button"
                onClick={() => setView({ mode: 'edit', slug: b.slug })}
                className="flex min-w-0 flex-1 items-center gap-4 text-left"
              >
                <Avatar logo={b.logo} name={b.name} size={48} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{b.name}</span>
                  <span className="block truncate text-xs text-gray-500">
                    /{b.slug}
                    {b.category && <> · <span className="text-gray-400">{b.category}</span></>}
                  </span>
                  {b.updatedAt && <span className="mt-0.5 block text-[11px] text-gray-600">Actualizado {timeAgo(b.updatedAt)}</span>}
                </span>
              </button>
              <div className="flex items-center gap-1.5 border-t border-gray-800 pt-3 sm:border-0 sm:pt-0">
                <button
                  onClick={() => setView({ mode: 'edit', slug: b.slug })}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-clickclick-orange/10 px-3 py-2 text-xs font-semibold text-clickclick-orange hover:bg-clickclick-orange/20"
                >
                  <Icon name="edit" size={14} /> Editar
                </button>
                <ListAction href={`/${b.slug}`} icon="external" label="Ver" />
                <ListAction onClick={() => openModal(b.slug, 'qr')} icon="qr" label="QR" />
                <ListAction onClick={() => openModal(b.slug, 'print')} icon="print" label="Cartel" />
                <span className="flex-1 sm:hidden" />
                <IconButton icon="trash" label={`Eliminar ${b.name}`} tone="danger" onClick={() => onDelete(b.slug)} />
              </div>
            </li>
          ))}
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

function ListAction({ href, onClick, icon, label }) {
  const cls = 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-300 hover:bg-gray-800 hover:text-white'
  const content = <><Icon name={icon} size={14} />{label}</>
  return href
    ? <a href={href} target="_blank" rel="noreferrer" className={cls}>{content}</a>
    : <button type="button" onClick={onClick} className={cls}>{content}</button>
}

function Brand() {
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

function Avatar({ logo, name, size = 40 }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-700 bg-gray-800"
      style={{ width: size, height: size }}
    >
      {logo ? (
        <img src={logo} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="font-bold text-clickclick-orange" style={{ fontSize: size * 0.34 }}>
          {(name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
        </span>
      )}
    </span>
  )
}

function timeAgo(timestamp) {
  const seconds = Math.max(0, (Date.now() - timestamp) / 1000)
  const units = [[31536000, 'año', 'años'], [2592000, 'mes', 'meses'], [86400, 'día', 'días'], [3600, 'hora', 'horas'], [60, 'minuto', 'minutos']]
  for (const [size, one, many] of units) {
    const value = Math.floor(seconds / size)
    if (value >= 1) return `hace ${value} ${value === 1 ? one : many}`
  }
  return 'hace un momento'
}

// --- Modal de recursos (QR / Cartel) ---
function ResourceModal({ business, tab, onTab, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 no-print" onClick={onClose}>
      <div
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
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none no-print">×</button>
        </div>
        <div className="p-6 flex justify-center">
          {tab === 'qr' ? <QRCodeStudio business={business} /> : <PrintableDisplay business={business} />}
        </div>
      </div>
    </div>
  )
}

// --- Router del editor (nuevo o edición) ---
function EditorRouter({ view, setView }) {
  const isEdit = typeof view === 'object' && view.mode === 'edit'
  const slug = isEdit ? view.slug : null
  return <Editor isEdit={isEdit} slug={slug} onDone={() => setView('list')} />
}

// --- Editor con preview en vivo ---
function Editor({ isEdit, slug, onDone }) {
  const [business, setBusiness] = useState(EMPTY_BUSINESS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [error, setError] = useState('')

  const [baseline, setBaseline] = useState(EMPTY_BUSINESS)
  const [notice, setNotice] = useState('')
  const [preview, setPreview] = useState(false)
  const [openSections, setOpenSections] = useState(() => new Set(['basic']))
  const draftKey = `clyclick:draft:${slug || 'new'}`
  const dirty = JSON.stringify(business) !== JSON.stringify(baseline)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = isEdit ? await getBusiness(slug) : EMPTY_BUSINESS
        if (!data) throw new Error('No se encontró el negocio')
        if (!active) return
        const initial = { ...EMPTY_BUSINESS, ...data }
        setBaseline(initial)
        setBusiness(initial)
        try {
          const draft = JSON.parse(localStorage.getItem(draftKey) || 'null')
          if (draft?.business && typeof draft.business === 'object' && !Array.isArray(draft.business)) {
            setBusiness({ ...initial, ...draft.business, ...(isEdit ? { slug } : {}) })
            setNotice('Borrador recuperado de este navegador. Aún no está publicado.')
          }
        } catch { setNotice('No se pudo recuperar el borrador de este navegador.') }
      } catch (error) {
        if (active) {
          setLoadFailed(true)
          setError(error.message || 'No se pudo cargar el negocio')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [isEdit, slug, draftKey])

  useEffect(() => {
    if (!dirty) return
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function saveDraft() {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ business, savedAt: Date.now() }))
      setNotice('Borrador guardado en este navegador. Aún no está publicado.')
    } catch { setError('No se pudo guardar el borrador. Mantén esta página abierta o publica los cambios.') }
  }

  function leaveEditor() {
    if (!dirty || window.confirm('Hay cambios sin publicar. ¿Salir del editor? Guarda un borrador antes de salir para recuperarlos.')) onDone()
  }

  function discardDraft() {
    if (!window.confirm('¿Descartar el borrador y los cambios sin publicar?')) return
    try { localStorage.removeItem(draftKey) } catch { /* Storage may be unavailable. */ }
    setBusiness(baseline)
    setNotice('Borrador descartado.')
  }

  function patch(p) {
    setNotice('')
    setBusiness((prev) => ({ ...prev, ...p }))
  }

  function toggleSection(id) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Navegación rápida: abre la tarjeta y la desplaza a la vista.
  function goToSection(id) {
    setPreview(false)
    setOpenSections((prev) => new Set(prev).add(id))
    requestAnimationFrame(() => {
      document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  async function onSave() {
    setError('')
    if (!business.name.trim()) {
      setError('El nombre es obligatorio')
      goToSection('basic')
      return
    }
    const bankError = validateBankAccounts(business.bankAccounts)
    if (bankError) {
      setError(bankError)
      goToSection('bank')
      return
    }
    setSaving(true)
    try {
      await saveBusiness(business, { isEdit })
      try { localStorage.removeItem(draftKey) } catch { /* Published successfully. */ }
      onDone()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-clickclick-dark text-gray-400">
        <Spinner /> Cargando...
      </div>
    )
  }

  const status = loadFailed
    ? { color: 'bg-red-500', text: 'No se pudo cargar' }
    : dirty
      ? { color: 'bg-amber-400', text: 'Cambios sin publicar' }
      : { color: 'bg-emerald-500', text: isEdit ? 'Publicado' : 'Sin cambios' }

  return (
    <div className="min-h-screen bg-clickclick-dark pb-24 text-white lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-gray-800 bg-clickclick-dark/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <IconButton icon="arrow-left" label="Volver al listado" onClick={leaveEditor} disabled={saving} size={18} />
          <span className="hidden sm:flex"><Avatar logo={business.logo} name={business.name} size={36} /></span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold sm:text-base">
              {business.name || (isEdit ? slug : 'Nuevo negocio')}
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className={`h-2 w-2 shrink-0 rounded-full ${status.color}`} aria-hidden="true" />
              <span className="truncate">{status.text}</span>
              {isEdit && (
                <a href={`/${slug}`} target="_blank" rel="noreferrer" className="hidden items-center gap-1 text-gray-500 hover:text-white sm:inline-flex">
                  · /{slug} <Icon name="external" size={11} />
                </a>
              )}
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            {dirty && (
              <button type="button" onClick={discardDraft} disabled={saving || loadFailed} className="px-2 text-xs text-gray-400 hover:text-white">
                Descartar
              </button>
            )}
            <button type="button" onClick={saveDraft} disabled={saving || loadFailed} className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:border-gray-500 disabled:opacity-50">
              Guardar borrador
            </button>
          </div>
          <button
            onClick={onSave}
            disabled={saving || loadFailed}
            className="inline-flex items-center gap-2 rounded-lg bg-clickclick-orange px-4 py-2 text-sm font-semibold text-clickclick-dark hover:brightness-110 disabled:opacity-50 sm:px-5"
          >
            {saving && <Spinner />}
            {saving ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
        <nav aria-label="Secciones del formulario" className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 [scrollbar-width:none]">
          {FORM_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => goToSection(section.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                openSections.has(section.id)
                  ? 'border-clickclick-orange/50 bg-clickclick-orange/10 text-clickclick-orange'
                  : 'border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'
              }`}
            >
              <Icon name={section.icon} size={13} />
              {section.short}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
        {/* Acciones de borrador en móvil (en escritorio viven en la cabecera) */}
        <div className="mb-3 flex items-center gap-3 sm:hidden">
          <button type="button" onClick={saveDraft} disabled={saving || loadFailed} className="rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-200 disabled:opacity-50">
            Guardar borrador
          </button>
          {dirty && (
            <button type="button" onClick={discardDraft} disabled={saving || loadFailed} className="text-xs text-gray-400">Descartar cambios</button>
          )}
        </div>
        {notice && (
          <p role="status" className="mb-3 flex items-center gap-2 rounded-xl border border-amber-900/60 bg-amber-950/30 px-4 py-2.5 text-sm text-amber-200">
            <Icon name="info" size={16} className="shrink-0" /> {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-3 flex items-center gap-2 rounded-xl border border-red-900 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">
            <Icon name="info" size={16} className="shrink-0" /> {error}
          </p>
        )}
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pb-10 pt-2 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className={preview ? 'hidden lg:block' : 'block'}>
          <fieldset disabled={saving || loadFailed} className="min-w-0">
            <BusinessForm value={business} onChange={patch} isEdit={isEdit} openSections={openSections} onToggleSection={toggleSection} />
          </fieldset>
        </div>
        <aside className={`${preview ? 'flex' : 'hidden'} flex-col items-center gap-3 self-start lg:sticky lg:top-32 lg:flex`}>
          <PhoneMockup business={business} />
          {isEdit && (
            <a href={`/${slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white">
              Abrir página publicada <Icon name="external" size={12} />
            </a>
          )}
        </aside>
      </div>

      {/* Alternar editor / vista previa en pantallas pequeñas */}
      <button
        type="button"
        onClick={() => { setPreview(!preview); window.scrollTo({ top: 0 }) }}
        aria-pressed={preview}
        className="fixed bottom-5 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-gray-700 bg-gray-900/95 px-5 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur lg:hidden"
      >
        <Icon name={preview ? 'edit' : 'eye'} size={16} />
        {preview ? 'Seguir editando' : 'Vista previa'}
      </button>
    </div>
  )
}
