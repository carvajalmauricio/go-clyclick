import { useCallback, useEffect, useReducer, useState } from 'react'
import BusinessForm, { FORM_SECTIONS } from '../components/BusinessForm.jsx'
import { Icon } from '../components/Icons.jsx'
import { IconButton, Spinner } from '../components/admin/ui.jsx'
import { ToastProvider, useToast } from '../components/admin/Toast.jsx'
import BusinessList from '../components/admin/BusinessList.jsx'
import PreviewPanel from '../components/admin/PreviewPanel.jsx'
import { Avatar, draftKeyFor, readDraft } from '../components/admin/common.jsx'
import { MOD_LABEL, useHotkeys } from '../components/admin/useHotkeys.js'
import { BANK_SECTION_ID } from '../utils/banking.js'
import { DEFAULT_HEADER, logoRadius, normalizeHeader } from '../utils/header.js'
import { createHistory, historyReducer } from '../utils/history.js'
import { getSectionIssues, hasErrors, pendingIssues } from '../utils/sectionIssues.js'
import { getIdentity, getBusiness, saveBusiness, updateLead } from '../utils/api.js'
import { leadToBusiness } from '../utils/leads.js'
import { formatPhone, leadReplyMessage, whatsappLink } from '../utils/contact.js'

const EMPTY_BUSINESS = {
  name: '',
  slug: '',
  category: '',
  description: '',
  descriptionColor: '',
  logo: '',
  header: { ...DEFAULT_HEADER },
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
  // Los perfiles nuevos no aparecen en la página de inicio hasta activarlo.
  showcase: false,
}

// El acceso a /admin lo protege Cloudflare Access (Google + OTP) ANTES de que
// esta página cargue. Por eso aquí ya no hay pantalla de login por token:
// si el navegador llegó hasta aquí, el usuario ya está autenticado.
export default function AdminDashboard() {
  const [view, setView] = useState('list') // 'list' | 'edit-new' | { mode: 'edit', slug } | { mode: 'new', lead }
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

  // Los avisos viven por encima del listado y el editor para sobrevivir al
  // cambio de vista (p. ej. "Publicado" al volver al listado).
  return (
    <ToastProvider>
      {view === 'list' ? (
        <BusinessList setView={setView} email={identity.email || ''} />
      ) : (
        <Editor
          key={typeof view === 'object' ? view.slug || `lead-${view.lead?.id}` : 'new'}
          isEdit={typeof view === 'object' && view.mode === 'edit'}
          slug={typeof view === 'object' && view.mode === 'edit' ? view.slug : null}
          lead={typeof view === 'object' ? view.lead || null : null}
          onDone={() => setView('list')}
        />
      )}
    </ToastProvider>
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

const SHORTCUTS = [
  [`${MOD_LABEL} + S`, 'Guardar borrador en este navegador'],
  [`${MOD_LABEL} + Z`, 'Deshacer (fuera de los campos de texto)'],
  [`${MOD_LABEL} + Shift + Z`, 'Rehacer (también ' + MOD_LABEL + ' + Y)'],
  ['Esc', 'Cerrar ventanas, vista de escritorio o volver al editor'],
  ['?', 'Mostrar u ocultar esta ayuda'],
]

function prefersDarkScheme() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// ¿El foco está en un campo donde se escribe? (casillas, colores o rangos no cuentan)
function isTyping(event) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable || target.tagName === 'TEXTAREA') return true
  return target.tagName === 'INPUT' && !['checkbox', 'radio', 'range', 'color', 'file', 'button', 'submit'].includes(target.type)
}

// --- Editor con preview en vivo ---
function Editor({ isEdit, slug, lead = null, onDone }) {
  const toast = useToast()
  const [history, dispatch] = useReducer(historyReducer, EMPTY_BUSINESS, createHistory)
  const business = history.present
  const [baseline, setBaseline] = useState(EMPTY_BUSINESS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [draftRecovered, setDraftRecovered] = useState(false)
  const [preview, setPreview] = useState(false) // móvil: alterna editor / vista previa
  const [openSections, setOpenSections] = useState(() => new Set(['basic']))
  const [focus, setFocus] = useState(null) // { key, nonce } → abre un botón en el editor
  const [highlightKey, setHighlightKey] = useState('') // botón resaltado en el preview
  const [device, setDevice] = useState('standard')
  const [scheme, setScheme] = useState(prefersDarkScheme)
  const [desktopOpen, setDesktopOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  // Un perfil creado desde una solicitud guarda su borrador aparte.
  const draftId = slug || (lead ? `lead-${lead.id}` : '')
  const draftKey = draftKeyFor(draftId)
  const dirty = JSON.stringify(business) !== JSON.stringify(baseline)
  const loadFailed = Boolean(loadError)
  const issues = getSectionIssues(business)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = isEdit ? await getBusiness(slug) : EMPTY_BUSINESS
        if (!data) throw new Error('No se encontró el negocio')
        if (!active) return
        // Perfiles guardados antes de existir "showcase" se muestran en la
        // página de inicio (igual que en el servidor); los nuevos, no.
        const initial = { ...EMPTY_BUSINESS, ...data, header: normalizeHeader(data.header), showcase: isEdit ? data.showcase !== false : false }
        setBaseline(initial)
        const draft = readDraft(draftId)
        if (draft) {
          dispatch({ type: 'reset', value: { ...initial, ...draft.business, ...(isEdit ? { slug } : {}) } })
          setDraftRecovered(true)
          toast.info('Borrador recuperado de este navegador. Aún no está publicado.', { id: 'draft', duration: 8000 })
        } else if (lead) {
          dispatch({ type: 'reset', value: { ...initial, ...leadToBusiness(lead) } })
          toast.info(`Datos cargados desde la solicitud de ${lead.contactName}. Revisa y completa el perfil.`, { id: 'draft', duration: 7000 })
        } else {
          dispatch({ type: 'reset', value: initial })
        }
      } catch (error) {
        if (active) {
          setLoadError(error.message || 'No se pudo cargar el negocio')
          toast.error(error.message || 'No se pudo cargar el negocio')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, slug])

  useEffect(() => {
    if (!dirty) return
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // La selección desde el preview se consume una sola vez: si quedara fija, al
  // volver a abrir la sección se saltaría otra vez al último botón elegido.
  useEffect(() => {
    if (!focus) return
    const id = setTimeout(() => setFocus(null), 1200)
    return () => clearTimeout(id)
  }, [focus])

  const patch = useCallback((update) => dispatch({ type: 'patch', patch: update }), [])
  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])

  function saveDraft() {
    if (loadFailed || saving) return
    try {
      localStorage.setItem(draftKey, JSON.stringify({ business, savedAt: Date.now() }))
      toast.success('Borrador guardado en este navegador. Aún no está publicado.', { id: 'draft' })
    } catch {
      toast.error('No se pudo guardar el borrador. Mantén esta página abierta o publica los cambios.')
    }
  }

  function leaveEditor() {
    if (!dirty || window.confirm('Hay cambios sin publicar. ¿Salir del editor? Guarda un borrador antes de salir para recuperarlos.')) onDone()
  }

  // Descartar pide confirmación (como antes) y además ofrece "Deshacer", que
  // restaura también el borrador guardado en el navegador.
  function discardDraft() {
    if (!window.confirm('¿Descartar el borrador y los cambios sin publicar?')) return
    let hadDraft = false
    try {
      hadDraft = Boolean(localStorage.getItem(draftKey))
      localStorage.removeItem(draftKey)
    } catch { /* Storage may be unavailable. */ }
    const previous = business
    dispatch({ type: 'replace', value: baseline })
    setDraftRecovered(false)
    toast.info('Cambios descartados.', {
      id: 'draft',
      duration: 10000,
      action: {
        label: 'Deshacer',
        onClick: () => {
          dispatch({ type: 'replace', value: previous })
          if (hadDraft) {
            try { localStorage.setItem(draftKey, JSON.stringify({ business: previous, savedAt: Date.now() })) } catch { /* ignore */ }
          }
        },
      },
    })
  }

  function toggleSection(id) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Navegación rápida: abre la tarjeta y la desplaza a la vista.
  function goToSection(id, scroll = true) {
    setPreview(false)
    setOpenSections((prev) => new Set(prev).add(id))
    if (!scroll) return
    requestAnimationFrame(() => {
      document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  // #6 Clic en el preview → abre la configuración de ese elemento.
  function selectFromPreview(target) {
    if (target.kind === 'action') {
      goToSection(target.key.startsWith('bank-') ? 'bank' : 'actions', false)
      setFocus({ key: target.key, nonce: Date.now() })
      setHighlightKey(target.key)
      return
    }
    setHighlightKey('')
    goToSection(target.id)
  }

  async function onSave() {
    if (loadFailed || saving) return
    const blocking = FORM_SECTIONS.find((section) => hasErrors(issues[section.id]))
    if (blocking) {
      toast.error(issues[blocking.id].find((issue) => issue.level === 'error').text)
      goToSection(blocking.id)
      return
    }
    setSaving(true)
    try {
      const result = await saveBusiness(business, { isEdit })
      try { localStorage.removeItem(draftKey) } catch { /* Published successfully. */ }
      const publishedSlug = result?.slug || business.slug
      toast.success(`«${business.name}» publicado.`, publishedSlug ? { action: { label: 'Ver perfil', onClick: () => window.open(`/${publishedSlug}`, '_blank', 'noopener') } } : undefined)
      // La solicitud queda como atendida y enlazada al perfil creado (se espera
      // para que el listado ya la muestre así al volver).
      if (lead) {
        try {
          await updateLead(lead.id, { status: 'won', slug: publishedSlug || '' })
        } catch {
          toast.error('El perfil se publicó, pero no se pudo marcar la solicitud como atendida.')
        }
      }
      onDone()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  // #4 y #16 Atajos de teclado. Deshacer/rehacer no actúan mientras se publica
  // ni con una ventana abierta (recorte, escritorio…); dentro de un campo de
  // texto se deja el deshacer nativo del navegador (los botones ↶ ↷ del
  // encabezado siguen usando el historial del editor).
  const historyKey = (action) => (event) => {
    if (saving || isTyping(event) || document.querySelector('[aria-modal="true"]')) return false
    action()
  }
  useHotkeys({
    'mod+s': () => saveDraft(),
    'mod+z': historyKey(undo),
    'mod+shift+z': historyKey(redo),
    'mod+y': historyKey(redo),
    escape: () => {
      if (showShortcuts) return setShowShortcuts(false)
      if (preview) return setPreview(false)
      return false
    },
    'shift+?': (event) => (isTyping(event) ? false : setShowShortcuts((value) => !value)),
    '?': (event) => (isTyping(event) ? false : setShowShortcuts((value) => !value)),
  }, !loading)

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
      ? { color: 'bg-amber-400', text: draftRecovered ? 'Borrador recuperado · sin publicar' : 'Cambios sin publicar' }
      : { color: 'bg-emerald-500', text: isEdit ? 'Publicado' : 'Sin cambios' }
  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  return (
    <div className="min-h-screen bg-clickclick-dark pb-24 text-white lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-gray-800 bg-clickclick-dark/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
          <IconButton icon="arrow-left" label="Volver al listado" onClick={leaveEditor} disabled={saving} size={18} />
          <span className="hidden sm:flex"><Avatar logo={business.logo} name={business.name} size={36} radius={logoRadius(normalizeHeader(business.header).logoShape, 36)} /></span>
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
          <div className="flex items-center" role="group" aria-label="Historial">
            <IconButton icon="undo" label={`Deshacer (${MOD_LABEL}+Z)`} onClick={undo} disabled={!canUndo || saving} />
            <IconButton icon="redo" label={`Rehacer (${MOD_LABEL}+Shift+Z)`} onClick={redo} disabled={!canRedo || saving} />
          </div>
          <div className="relative hidden md:block" data-shortcuts>
            <IconButton icon="keyboard" label="Atajos de teclado (?)" onClick={() => setShowShortcuts((value) => !value)} />
            {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            {dirty && (
              <button type="button" onClick={discardDraft} disabled={saving || loadFailed} className="px-2 text-xs text-gray-400 hover:text-white">
                Descartar
              </button>
            )}
            <button type="button" onClick={saveDraft} disabled={saving || loadFailed} title={`Guardar borrador (${MOD_LABEL}+S)`} className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:border-gray-500 disabled:opacity-50">
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
          {FORM_SECTIONS.map((section) => {
            const list = pendingIssues(issues[section.id])
            const error = hasErrors(list)
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => goToSection(section.id)}
                title={list.length ? list.map((issue) => issue.text).join(' · ') : 'Completo'}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                  openSections.has(section.id)
                    ? 'border-clickclick-orange/50 bg-clickclick-orange/10 text-clickclick-orange'
                    : 'border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
              >
                <Icon name={section.icon} size={13} />
                {section.short}
                {list.length > 0 ? (
                  <span className={`ml-0.5 rounded-full px-1.5 text-[10px] font-bold ${error ? 'bg-red-500/20 text-red-300' : 'bg-amber-400/20 text-amber-300'}`} aria-label={`${list.length} pendientes`}>{list.length}</span>
                ) : (
                  <Icon name="check" size={12} className="text-emerald-400" />
                )}
              </button>
            )
          })}
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
        {lead && (
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-clickclick-orange/30 bg-clickclick-orange/[.07] px-4 py-2.5 text-sm">
            <Icon name="inbox" size={16} className="shrink-0 text-clickclick-orange" />
            <span className="min-w-0 flex-1 text-gray-200">
              Solicitud de <strong className="text-white">{lead.contactName}</strong> · {formatPhone(lead.whatsapp)}
              {lead.message && <span className="block truncate text-xs text-gray-400">«{lead.message}»</span>}
            </span>
            <a href={whatsappLink(lead.whatsapp, leadReplyMessage(lead))} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-[#062b16] hover:brightness-105">
              <Icon name="whatsapp" size={14} /> Escribirle
            </a>
          </div>
        )}
        {loadError && (
          <p role="alert" className="mb-3 flex items-center gap-2 rounded-xl border border-red-900 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">
            <Icon name="info" size={16} className="shrink-0" /> {loadError}
          </p>
        )}
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pb-10 pt-2 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className={preview ? 'hidden lg:block' : 'block'}>
          <fieldset disabled={saving || loadFailed} className="min-w-0">
            <BusinessForm
              value={business}
              onChange={patch}
              isEdit={isEdit}
              openSections={openSections}
              onToggleSection={toggleSection}
              focus={focus}
              onFocusItem={setHighlightKey}
            />
          </fieldset>
        </div>
        <aside className={`${preview ? 'flex' : 'hidden'} flex-col items-center gap-3 self-start lg:sticky lg:top-32 lg:flex`}>
          <PreviewPanel
            business={business}
            device={device}
            onDevice={setDevice}
            scheme={scheme}
            onScheme={setScheme}
            desktopOpen={desktopOpen}
            onDesktop={setDesktopOpen}
            onSelect={selectFromPreview}
            highlightKey={highlightKey}
          />
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

function ShortcutsHelp({ onClose }) {
  useEffect(() => {
    const onDown = (event) => { if (!event.target.closest?.('[data-shortcuts]')) onClose() }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [onClose])
  return (
    <div role="dialog" aria-label="Atajos de teclado" className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-gray-700 bg-gray-900 p-4 text-sm shadow-2xl">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Atajos de teclado</p>
      <dl className="space-y-2">
        {SHORTCUTS.map(([keys, text]) => (
          <div key={keys} className="flex items-center justify-between gap-3">
            <dt className="text-gray-300">{text}</dt>
            <dd><kbd className="whitespace-nowrap rounded-md border border-gray-700 bg-gray-800 px-1.5 py-0.5 font-mono text-[11px] text-gray-200">{keys}</kbd></dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
