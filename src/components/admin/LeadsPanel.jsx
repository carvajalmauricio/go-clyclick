import { useMemo, useState } from 'react'
import { Icon } from '../Icons.jsx'
import { IconButton, inputCls } from './ui.jsx'
import { timeAgo } from './common.jsx'
import { useToast } from './Toast.jsx'
import { LEAD_LIMITS, LEAD_SOURCES, LEAD_STATUSES } from '../../utils/leads.js'
import { getRubro } from '../../utils/rubros.js'
import { THEMES } from '../../utils/themes.js'
import { formatPhone, leadReplyMessage, whatsappLink } from '../../utils/contact.js'
import { copyText } from '../../utils/clipboard.js'

const FILTERS = [
  { id: 'pending', label: 'Por atender', test: (lead) => lead.status === 'new' || lead.status === 'contacted' },
  { id: 'won', label: 'Perfil creado', test: (lead) => lead.status === 'won' },
  { id: 'discarded', label: 'Descartadas', test: (lead) => lead.status === 'discarded' },
  { id: 'all', label: 'Todas', test: () => true },
]

const STATUS_STYLES = {
  new: 'border-clickclick-orange/40 bg-clickclick-orange/15 text-clickclick-orange',
  contacted: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  won: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  discarded: 'border-gray-700 bg-gray-800 text-gray-400',
}

const plain = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Pestaña "Solicitudes": personas que pidieron su perfil desde la página de inicio.
export default function LeadsPanel({ state, onCreateProfile }) {
  const toast = useToast()
  const { leads, error, refresh, update, remove } = state
  const [filter, setFilter] = useState('pending')
  const [query, setQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((item) => [item.id, (leads || []).filter(item.test).length])), [leads])
  const visible = useMemo(() => {
    const test = FILTERS.find((item) => item.id === filter)?.test || (() => true)
    const q = plain(query).trim()
    const digits = query.replace(/\D/g, '')
    return (leads || []).filter(test).filter((lead) => !q || plain(`${lead.businessName} ${lead.contactName} ${lead.email}`).includes(q) || (digits.length >= 3 && lead.whatsapp.includes(digits)))
  }, [leads, filter, query])

  async function reload() {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  async function changeStatus(lead, status, { undoable = true } = {}) {
    if (lead.status === status) return
    const before = lead.status
    try {
      await update(lead.id, { status })
      const label = LEAD_STATUSES.find((item) => item.value === status)?.label.toLowerCase()
      toast.success(`Solicitud de ${lead.businessName}: ${label}.`, undoable ? { id: `lead-${lead.id}`, action: { label: 'Deshacer', onClick: () => update(lead.id, { status: before }).catch((err) => toast.error(err.message)) } } : { id: `lead-${lead.id}` })
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function onDelete(lead) {
    if (!window.confirm(`¿Eliminar la solicitud de «${lead.businessName}»? Esta acción no se puede deshacer.`)) return
    try {
      await remove(lead.id)
      toast.success('Solicitud eliminada.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <section aria-labelledby="leads-title">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 id="leads-title" className="text-xl font-bold">Solicitudes</h1>
          <p className="text-sm text-gray-400">Personas que pidieron su perfil desde la <a href="/" target="_blank" rel="noreferrer" className="text-gray-300 underline hover:text-white">página de inicio</a>.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar solicitud..." aria-label="Buscar solicitudes" className={`${inputCls} pl-9`} />
          </div>
          <button type="button" onClick={reload} disabled={refreshing} title="Actualizar" aria-label="Actualizar solicitudes" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white disabled:opacity-50">
            <Icon name="refresh" size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div role="radiogroup" aria-label="Filtrar solicitudes" className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${filter === item.id ? 'border-clickclick-orange/50 bg-clickclick-orange/10 font-semibold text-clickclick-orange' : 'border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'}`}
          >
            {item.label}
            <span className={`rounded-full px-1.5 text-[10px] font-bold ${filter === item.id ? 'bg-clickclick-orange/20' : 'bg-gray-800'}`}>{counts[item.id]}</span>
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          <span>{error}</span>
          <button type="button" onClick={reload} className="font-semibold underline">Reintentar</button>
        </div>
      )}

      {leads === null && (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((index) => <div key={index} className="h-40 animate-pulse rounded-2xl bg-gray-900" />)}
        </div>
      )}

      {leads && leads.length === 0 && !error && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-700 px-6 py-14 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-clickclick-orange/10 text-clickclick-orange"><Icon name="inbox" size={26} /></span>
          <p className="font-semibold">Aún no hay solicitudes</p>
          <p className="mt-1 max-w-sm text-sm text-gray-400">Cuando alguien llene el formulario de la página de inicio, aparecerá aquí para que le respondas por WhatsApp y crees su perfil.</p>
          <a href="/" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:border-gray-500">Ver página de inicio <Icon name="external" size={14} /></a>
        </div>
      )}

      {leads && leads.length > 0 && visible.length === 0 && (
        <p className="rounded-2xl border border-gray-800 px-6 py-10 text-center text-sm text-gray-400">
          {query ? <>Sin resultados para «{query}».</> : 'No hay solicitudes en este grupo.'}
        </p>
      )}

      <ul className="space-y-3">
        {visible.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onStatus={(status) => changeStatus(lead, status)}
            onReply={() => { if (lead.status === 'new') changeStatus(lead, 'contacted') }}
            onNote={(note) => update(lead.id, { note }).then(() => toast.success('Nota guardada.', { id: `note-${lead.id}` })).catch((err) => toast.error(err.message))}
            onCopy={async () => { (await copyText(formatPhone(lead.whatsapp))) ? toast.success('Número copiado.', { id: 'copy' }) : toast.error('No se pudo copiar el número.') }}
            onDelete={() => onDelete(lead)}
            onCreateProfile={() => onCreateProfile(lead)}
          />
        ))}
      </ul>
    </section>
  )
}

function LeadCard({ lead, onStatus, onReply, onNote, onCopy, onDelete, onCreateProfile }) {
  const rubro = getRubro(lead.rubro)
  const theme = THEMES[lead.theme]
  const [editingNote, setEditingNote] = useState(false)
  const [note, setNote] = useState(lead.note || '')
  const isNew = lead.status === 'new'

  function saveNote() {
    setEditingNote(false)
    if (note.trim() !== (lead.note || '').trim()) onNote(note)
  }

  return (
    <li className={`rounded-2xl border bg-gray-900/60 p-4 transition sm:p-5 ${isNew ? 'border-clickclick-orange/40 shadow-[0_0_0_1px_rgba(244,145,32,.08)]' : 'border-gray-800'}`}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {isNew && <span className="h-2 w-2 shrink-0 rounded-full bg-clickclick-orange" aria-label="Nueva" />}
            <h3 className="min-w-0 break-words font-semibold">{lead.businessName}</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-2 py-0.5 text-[11px] text-gray-300"><Icon name={rubro.icon} size={11} />{rubro.label}</span>
            {theme && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-800 px-2 py-0.5 text-[11px] text-gray-300">
                <span className="h-2.5 w-2.5 rounded-full ring-1 ring-white/20" style={{ background: theme.bgGradient || theme.bg }} />{theme.name}
              </span>
            )}
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-300">
            <span className="inline-flex items-center gap-1.5"><Icon name="contact" size={14} className="text-gray-500" />{lead.contactName}</span>
            <span className="text-gray-600">·</span>
            <span className="tabular-nums">{formatPhone(lead.whatsapp)}</span>
            {lead.email && (<><span className="text-gray-600">·</span><a href={`mailto:${lead.email}`} className="break-all text-gray-300 underline decoration-gray-600 hover:text-white">{lead.email}</a></>)}
          </p>
          <p className="mt-1 text-[11px] text-gray-500" title={new Date(lead.createdAt).toLocaleString('es-EC')}>
            Recibida {timeAgo(lead.createdAt)} · {LEAD_SOURCES[lead.source] || 'Página de inicio'}
          </p>
        </div>
        <label className="sr-only" htmlFor={`status-${lead.id}`}>Estado de la solicitud</label>
        <select
          id={`status-${lead.id}`}
          value={lead.status}
          onChange={(event) => onStatus(event.target.value)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-clickclick-orange/40 ${STATUS_STYLES[lead.status] || STATUS_STYLES.new}`}
        >
          {LEAD_STATUSES.map((status) => <option key={status.value} value={status.value} className="bg-gray-900 text-white">{status.label}</option>)}
        </select>
      </div>

      {lead.message && (
        <blockquote className="mt-3 whitespace-pre-line break-words rounded-xl border-l-2 border-clickclick-orange/50 bg-gray-950/60 px-3 py-2 text-sm text-gray-300">{lead.message}</blockquote>
      )}

      {editingNote || lead.note ? (
        <div className="mt-3">
          <label htmlFor={`note-${lead.id}`} className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">Nota interna</label>
          {editingNote ? (
            <textarea
              id={`note-${lead.id}`}
              autoFocus
              rows={2}
              maxLength={LEAD_LIMITS.note}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              onBlur={saveNote}
              onKeyDown={(event) => { if (event.key === 'Escape') { setNote(lead.note || ''); setEditingNote(false) } }}
              placeholder="Solo la ves tú. Ej.: quiere menú y Deuna; llamar el lunes."
              className={inputCls}
            />
          ) : (
            <button type="button" onClick={() => { setNote(lead.note || ''); setEditingNote(true) }} className="w-full whitespace-pre-line break-words rounded-lg border border-gray-800 px-3 py-2 text-left text-sm text-gray-300 hover:border-gray-600">{lead.note}</button>
          )}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-800 pt-3">
        <a
          href={whatsappLink(lead.whatsapp, leadReplyMessage(lead))}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onReply}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-[#062b16] hover:brightness-105"
        >
          <Icon name="whatsapp" size={15} /> Responder por WhatsApp
        </a>
        {lead.slug ? (
          <a href={`/${lead.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/50 px-3 py-2 text-xs font-semibold text-emerald-300 hover:border-emerald-500">
            <Icon name="external" size={14} /> Ver perfil /{lead.slug}
          </a>
        ) : (
          <button type="button" onClick={onCreateProfile} className="inline-flex items-center gap-1.5 rounded-lg bg-clickclick-orange/10 px-3 py-2 text-xs font-semibold text-clickclick-orange hover:bg-clickclick-orange/20">
            <Icon name="plus" size={14} /> Crear perfil
          </button>
        )}
        {!editingNote && !lead.note && (
          <button type="button" onClick={() => setEditingNote(true)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-gray-400 hover:bg-gray-800 hover:text-white">
            <Icon name="edit" size={13} /> Nota
          </button>
        )}
        <span className="flex-1" />
        <IconButton icon="copy" label="Copiar número" onClick={onCopy} />
        <IconButton icon="trash" label={`Eliminar la solicitud de ${lead.businessName}`} tone="danger" onClick={onDelete} />
      </div>
    </li>
  )
}
