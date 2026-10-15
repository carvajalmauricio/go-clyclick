import { CONTACT_CARD_FIELDS, copyBusinessContact } from '../utils/contactCard.js'
import { Field, inputCls } from './admin/ui.jsx'

export default function ContactCardFields({ entry, business, patch }) {
  const custom = entry.contactMode === 'custom'
  return <div className="space-y-3 rounded-xl border border-gray-700 p-3">
    <Field label="Datos que se guardarán en el contacto">
      <select className={inputCls} value={custom ? 'custom' : 'business'} onChange={(event) => patch({ contactMode: event.target.value, ...(event.target.value === 'custom' && !entry.contactData ? { contactData: copyBusinessContact(business) } : {}) })}>
        <option value="business">Usar los datos generales del negocio</option>
        <option value="custom">Personalizar este contacto</option>
      </select>
    </Field>
    {custom ? <>
      <p className="text-xs text-gray-400">Estos datos pertenecen solo a este botón. Puedes editarlos o dejar campos vacíos para excluirlos del contacto descargado.</p>
      <button type="button" onClick={() => patch({ contactData: copyBusinessContact(business) })} className="text-xs text-clickclick-orange underline">Copiar nuevamente los datos del negocio</button>
      <div className="grid gap-3 sm:grid-cols-2">
        {CONTACT_CARD_FIELDS.map(({ key, label, limit, type }) => <Field key={key} label={`${label}${key === 'name' ? ' *' : ''}`} className={key === 'description' ? 'sm:col-span-2' : ''}>
          {key === 'description'
            ? <textarea className={inputCls} maxLength={limit} rows={2} value={entry.contactData?.[key] || ''} onChange={(event) => patch({ contactData: { ...entry.contactData, [key]: event.target.value } })} />
            : <input className={inputCls} type={type || 'text'} maxLength={limit} value={entry.contactData?.[key] || ''} onChange={(event) => patch({ contactData: { ...entry.contactData, [key]: event.target.value } })} />}
        </Field>)}
      </div>
      {!String(entry.contactData?.name || '').trim() && <p className="text-xs text-amber-300">Añade el nombre para mostrar este botón en el perfil.</p>}
    </> : <>
      <p className="text-xs text-gray-400">Usa el nombre, empresa, categoría, teléfonos, correo, sitio web y descripción del negocio. Los cambios generales se reflejan automáticamente.</p>
      <p className="break-words text-xs text-gray-300">{[business.name, business.phone || business.whatsapp, business.email, business.website].filter(Boolean).join(' · ') || 'Completa los datos generales en Contacto.'}</p>
    </>}
  </div>
}
