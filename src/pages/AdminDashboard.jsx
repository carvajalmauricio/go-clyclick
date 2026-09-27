import { useEffect, useMemo, useState } from 'react'
import BusinessForm from '../components/BusinessForm.jsx'
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
    if (!q) return items
    return items.filter((b) => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q))
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
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h1 className="text-lg font-bold text-clickclick-orange">ClickClick Go · Admin</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('edit-new')}
            className="rounded-lg bg-clickclick-orange text-clickclick-dark font-semibold px-4 py-2 text-sm"
          >
            + Nuevo negocio
          </button>
          {email && <span className="text-gray-500 text-xs hidden sm:inline">{email}</span>}
          <a
            href="/cdn-cgi/access/logout"
            className="text-gray-400 text-sm hover:text-white"
          >
            Salir
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o slug..."
          className="w-full rounded-lg bg-gray-800 border border-gray-600 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-clickclick-orange"
        />

        {error && <p className="mt-4 text-red-400">{error}</p>}
        {items === null && <p className="mt-6 text-gray-400">Cargando...</p>}
        {items && filtered.length === 0 && (
          <p className="mt-6 text-gray-400">
            {query ? 'Sin resultados.' : 'Aún no hay negocios. Crea el primero con "+ Nuevo negocio".'}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3">
          {filtered.map((b) => (
            <div
              key={b.slug}
              className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4"
            >
              <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                {b.logo ? (
                  <img src={b.logo} alt={b.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-clickclick-orange font-bold">
                    {(b.name || '?').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{b.name}</div>
                <div className="text-xs text-gray-500 truncate">/{b.slug} · {b.category || 'Sin categoría'}</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <a
                  href={`/${b.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700"
                >
                  Ver
                </a>
                <button
                  onClick={() => setView({ mode: 'edit', slug: b.slug })}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700"
                >
                  Editar
                </button>
                <button
                  onClick={() => openModal(b.slug, 'qr')}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700"
                >
                  QR
                </button>
                <button
                  onClick={() => openModal(b.slug, 'print')}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700"
                >
                  Cartel
                </button>
                <button
                  onClick={() => onDelete(b.slug)}
                  className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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

  async function onSave() {
    setError('')
    if (!business.name.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    const bankError = validateBankAccounts(business.bankAccounts)
    if (bankError) {
      setError(bankError)
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
      <div className="min-h-screen bg-clickclick-dark text-white flex items-center justify-center">
        Cargando...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-clickclick-dark text-white">
      <header className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-800 sticky top-0 bg-clickclick-dark z-20">
        <button onClick={leaveEditor} disabled={saving} className="text-gray-400 hover:text-white text-sm">
          ← Volver
        </button>
        <h1 className="min-w-0 break-words text-base sm:text-lg font-bold text-clickclick-orange">
          {isEdit ? `Editar: ${business.name}` : 'Nuevo negocio'}
        </h1>
        <button
          onClick={onSave}
          disabled={saving || loadFailed}
          className="rounded-lg bg-clickclick-orange text-clickclick-dark font-semibold px-5 py-2 text-sm disabled:opacity-50"
        >
          {saving ? 'Publicando...' : 'Publicar'}
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-gray-400">{dirty ? 'Cambios sin publicar' : 'Sin cambios pendientes'}</span>
        <button type="button" onClick={saveDraft} disabled={saving || loading || loadFailed} className="rounded-lg bg-gray-800 px-3 py-2">Guardar borrador</button>
        <button type="button" onClick={discardDraft} disabled={saving || loadFailed} className="text-gray-400 underline">Descartar borrador</button>
        <button type="button" onClick={() => setPreview(!preview)} aria-expanded={preview} className="lg:hidden rounded-lg bg-gray-800 px-3 py-2">{preview ? 'Volver a editar' : 'Vista previa'}</button>
        {notice && <p role="status" className="w-full text-amber-300">{notice}</p>}
      </div>
      {error && <div className="max-w-6xl mx-auto px-6 pt-4"><p className="text-red-400">{error}</p></div>}

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={preview ? 'hidden lg:block' : 'block'}>
          <fieldset disabled={saving || loadFailed} className="min-w-0"><BusinessForm value={business} onChange={patch} isEdit={isEdit} /></fieldset>
        </div>
        <div className={`${preview ? 'flex' : 'hidden'} lg:flex lg:sticky lg:top-24 self-start justify-center`}>
          <PhoneMockup business={business} />
        </div>
      </div>
    </div>
  )
}
