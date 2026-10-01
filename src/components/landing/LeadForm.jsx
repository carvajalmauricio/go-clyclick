import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '../Icons.jsx'
import { RUBROS, getRubro } from '../../utils/rubros.js'
import { THEME_LIST, THEMES } from '../../utils/themes.js'
import { LEAD_LIMITS, MIN_FILL_MS, validateLead } from '../../utils/leads.js'
import { CONTACT, contactWhatsappUrl, formatPhone } from '../../utils/contact.js'
import { submitLead } from '../../utils/api.js'
import { primaryButton, whatsappButton } from './shared.jsx'

const FIELD_ORDER = ['contactName', 'businessName', 'whatsapp', 'email']
const inputCls = 'w-full rounded-xl border bg-white/[.05] px-4 py-3 text-[15px] text-white outline-none transition placeholder:text-white/35 focus:bg-white/[.08] focus:ring-4'
const selectCls = `${inputCls} border-white/15 bg-[#18181f] focus:border-clickclick-orange focus:ring-clickclick-orange/20`

// Formulario "Prefiero que me contacten". Se precarga con lo elegido en la
// portada (negocio, rubro y estilo) mientras la persona no edite esos campos.
export default function LeadForm({ initial = {}, source = 'contact', autoFocus = false }) {
  const formId = useId()
  const startedAt = useRef(Date.now())
  const edited = useRef(new Set())
  const fields = useRef({})
  const [values, setValues] = useState(() => ({
    contactName: '',
    businessName: initial.businessName || '',
    whatsapp: '',
    email: '',
    rubro: initial.rubro || '',
    theme: initial.theme || '',
    message: '',
    website: '',
  }))
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | sent
  const [serverError, setServerError] = useState('')
  const [sent, setSent] = useState(null)
  const successHeading = useRef(null)

  // El formulario se reemplaza por el mensaje de éxito: el foco va al título.
  useEffect(() => {
    if (status === 'sent') successHeading.current?.focus({ preventScroll: true })
  }, [status])

  useEffect(() => {
    setValues((current) => {
      const next = { ...current }
      for (const key of ['businessName', 'rubro', 'theme']) {
        if (!edited.current.has(key)) next[key] = initial[key] || ''
      }
      return next
    })
  }, [initial.businessName, initial.rubro, initial.theme])

  function set(key) {
    return (event) => {
      edited.current.add(key)
      const value = event.target.value
      setValues((current) => ({ ...current, [key]: value }))
      if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
    }
  }

  async function onSubmit(event) {
    event.preventDefault()
    if (status === 'sending') return
    setServerError('')
    const check = validateLead({ ...values, source })
    if (!check.ok) {
      setErrors(check.errors)
      fields.current[FIELD_ORDER.find((key) => check.errors[key])]?.focus()
      return
    }
    setStatus('sending')
    try {
      // El servidor exige un tiempo mínimo de llenado (anti-bots): con
      // autocompletar se puede enviar antes, así que se espera lo que falte.
      const wait = MIN_FILL_MS + 150 - (Date.now() - startedAt.current)
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
      await submitLead({ ...values, source, elapsed: Date.now() - startedAt.current })
      setSent({ ...check.lead })
      setStatus('sent')
    } catch (error) {
      setStatus('idle')
      if (error.fields && Object.keys(error.fields).length) {
        setErrors(error.fields)
        fields.current[FIELD_ORDER.find((key) => error.fields[key])]?.focus()
      } else {
        setServerError(error.message || 'No se pudo enviar tu solicitud.')
      }
    }
  }

  if (status === 'sent' && sent) {
    const first = sent.contactName.split(' ')[0]
    return (
      <div role="status" className="landing-pop text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-clickclick-orange/15 text-clickclick-orange"><Icon name="check" size={28} /></span>
        <h3 ref={successHeading} tabIndex={-1} className="mt-4 text-xl font-bold text-white outline-none">¡Gracias, {first}!</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/65">
          Recibimos tu solicitud para <strong className="text-white">{sent.businessName}</strong>. Te escribiremos al <strong className="text-white">{formatPhone(sent.whatsapp)}</strong> muy pronto.
        </p>
        <a
          href={contactWhatsappUrl({ businessName: sent.businessName, rubroLabel: getRubro(sent.rubro).label, themeName: THEMES[sent.theme]?.name })}
          target="_blank"
          rel="noopener noreferrer"
          className={`${whatsappButton} mt-6 w-full text-sm`}
        >
          <Icon name="whatsapp" size={18} /> ¿No quieres esperar? Escríbenos
        </a>
        <button type="button" onClick={() => { setStatus('idle'); setSent(null); startedAt.current = Date.now() }} className="mt-3 text-xs text-white/50 underline hover:text-white">Enviar otra solicitud</button>
      </div>
    )
  }

  const field = (key, label, props = {}, hint) => (
    <div className={props.wide ? 'sm:col-span-2' : ''}>
      <label htmlFor={`${formId}-${key}`} className="mb-1.5 block text-sm font-medium text-white/80">{label}</label>
      <input
        ref={(element) => { fields.current[key] = element }}
        id={`${formId}-${key}`}
        name={key}
        value={values[key]}
        onChange={set(key)}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] || hint ? `${formId}-${key}-hint` : undefined}
        className={`${inputCls} ${errors[key] ? 'border-red-400/70 focus:border-red-400 focus:ring-red-400/20' : 'border-white/15 focus:border-clickclick-orange focus:ring-clickclick-orange/20'}`}
        {...Object.fromEntries(Object.entries(props).filter(([name]) => name !== 'wide'))}
      />
      {(errors[key] || hint) && <p id={`${formId}-${key}-hint`} className={`mt-1.5 text-xs ${errors[key] ? 'text-red-300' : 'text-white/45'}`}>{errors[key] || hint}</p>}
    </div>
  )

  return (
    <form onSubmit={onSubmit} noValidate className="text-left">
      <div className="grid gap-4 sm:grid-cols-2">
        {field('contactName', 'Tu nombre', { autoComplete: 'name', placeholder: 'Ej.: María Pérez', maxLength: LEAD_LIMITS.contactName, autoFocus })}
        {field('businessName', 'Nombre del negocio', { autoComplete: 'organization', placeholder: 'Ej.: Café La Esquina', maxLength: LEAD_LIMITS.businessName })}
        {field('whatsapp', 'WhatsApp', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: 'Ej.: 0991234567', maxLength: 24 }, 'Te escribiremos a este número.')}
        {field('email', 'Correo (opcional)', { type: 'email', inputMode: 'email', autoComplete: 'email', placeholder: 'tucorreo@ejemplo.com', maxLength: LEAD_LIMITS.email })}
        <div>
          <label htmlFor={`${formId}-rubro`} className="mb-1.5 block text-sm font-medium text-white/80">¿A qué se dedica?</label>
          <select id={`${formId}-rubro`} value={values.rubro} onChange={set('rubro')} className={selectCls}>
            <option value="">Elige una opción</option>
            {RUBROS.map((rubro) => <option key={rubro.id} value={rubro.id}>{rubro.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${formId}-theme`} className="mb-1.5 block text-sm font-medium text-white/80">Estilo que te gustó</label>
          <select id={`${formId}-theme`} value={values.theme} onChange={set('theme')} className={selectCls}>
            <option value="">Aún no lo sé</option>
            {THEME_LIST.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${formId}-message`} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-white/80">
            ¿Algo más que debamos saber? <span className="text-xs font-normal text-white/40">{values.message.length}/{LEAD_LIMITS.message}</span>
          </label>
          <textarea
            id={`${formId}-message`}
            value={values.message}
            onChange={set('message')}
            rows={3}
            maxLength={LEAD_LIMITS.message}
            placeholder="Opcional. Ej.: tengo logo, quiero mostrar mi menú y recibir transferencias."
            className={`${inputCls} resize-y border-white/15 focus:border-clickclick-orange focus:ring-clickclick-orange/20`}
          />
        </div>
      </div>

      {/* Campo trampa: invisible para las personas; los bots lo llenan. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${formId}-website`}>Deja este campo vacío</label>
        <input id={`${formId}-website`} name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
      </div>

      {serverError && (
        <div role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {serverError}{' '}
          <a href={contactWhatsappUrl({ businessName: values.businessName })} target="_blank" rel="noopener noreferrer" className="font-semibold text-white underline">Escribir por WhatsApp</a>
        </div>
      )}

      <button type="submit" disabled={status === 'sending'} className={`${primaryButton} mt-6 w-full`}>
        {status === 'sending' ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> Enviando…</> : <>Enviar solicitud <Icon name="arrow-right" size={18} /></>}
      </button>
      <p className="mt-3 text-center text-xs leading-relaxed text-white/40">
        Usaremos estos datos solo para contactarte sobre tu perfil. También puedes escribirnos a <a href={`mailto:${CONTACT.email}`} className="text-white/70 underline hover:text-white">{CONTACT.email}</a>.
      </p>
    </form>
  )
}
