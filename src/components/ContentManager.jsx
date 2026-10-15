import ContactCardFields from './ContactCardFields.jsx'
import { useState } from 'react'
import { ACTION_DEFINITIONS, getActionSettings, safeActionUrl, googleReviewUrl } from '../utils/links.js'
import { BANK_SECTION_ID, getProfileSections } from '../utils/banking.js'
import { editorContent, patchContent } from '../utils/editorContent.js'
import { moveContent } from '../utils/contentOrder.js'
import { Icon } from './Icons.jsx'
import { Field, IconButton, Toggle, inputCls } from './admin/ui.jsx'
import { editorItemId, FLASH_CLASS, useEditorFocus } from './admin/useEditorFocus.js'
import LayoutSelector from './LayoutSelector.jsx'
import IconPicker from './admin/IconPicker.jsx'
import AnimationSelector from './AnimationSelector.jsx'
import ButtonColorFields from './ButtonColorFields.jsx'
import ImageUploadButton from './admin/ImageUploadButton.jsx'
import { CROP_PRESETS } from '../utils/image.js'

export default function ContentManager({ business, onChange, focus, onFocusItem }) {
  const entries = editorContent(business)
  const sections = getProfileSections(business)
  const [open, setOpen] = useState('')
  const [dragged, setDragged] = useState('')
  const flash = useEditorFocus(focus, (key) => entries.some((item) => item.key === key) ? key : '', setOpen)
  const groups = [{ id: '', title: 'Botones principales' }, ...sections.filter((section) => section.id !== BANK_SECTION_ID || entries.some((item) => item.sectionId === section.id))]

  function patch(entry, changes) {
    onChange((prev) => patchContent(prev, entry, changes))
    onFocusItem?.(entry.key)
  }

  function add(type, sectionId) {
    if (type === 'link') {
      if ((business.links || []).length >= 50) return
      const id = crypto.randomUUID()
      const key = `link-${id}`
      onChange((prev) => ({ links: [...(prev.links || []), { id, title: '', url: '', icon: 'link', enabled: true, sectionId, order: (prev.links || []).length }], contentOrder: [...editorContent(prev).map((item) => item.key), key] }))
      setOpen(key)
    } else {
      if (getActionSettings(business).length >= 100) return
      const id = `action-${crypto.randomUUID()}`
      onChange((prev) => ({ actionSettingsVersion: 2, actionSettings: [...getActionSettings(prev), { id, type, label: ACTION_DEFINITIONS.find((item) => item.type === type)?.label, enabled: true, sectionId, order: getActionSettings(prev).length }], contentOrder: [...editorContent(prev).map((item) => item.key), id] }))
      setOpen(id)
    }
  }

  function remove(entry) {
    onChange((prev) => ({
      ...(entry.kind === 'link' ? { links: (prev.links || []).filter((item) => item.id !== entry.id) } : { actionSettingsVersion: 2, actionSettings: getActionSettings(prev).filter((item) => item.id !== entry.id) }),
      contentOrder: editorContent(prev).filter((item) => item.key !== entry.key).map((item) => item.key),
    }))
  }

  function reorder(entry, target) {
    onChange((prev) => ({ contentOrder: moveContent(editorContent(prev), entry.key, target.key).map((item) => item.key) }))
  }

  function drop(sectionId, target) {
    const entry = entries.find((item) => item.key === dragged)
    if (!entry) return
    onChange((prev) => ({ ...patchContent(prev, entry, { sectionId }), contentOrder: (target ? moveContent(editorContent(prev), entry.key, target.key) : editorContent(prev)).map((item) => item.key) }))
    setDragged('')
  }

  function moveSection(id, direction) {
    const editable = sections.filter((section) => section.id !== BANK_SECTION_ID)
    const index = editable.findIndex((section) => section.id === id)
    if (!editable[index + direction]) return
    ;[editable[index], editable[index + direction]] = [editable[index + direction], editable[index]]
    onChange({ sections: [...editable, ...sections.filter((section) => section.id === BANK_SECTION_ID)] })
  }

  function removeSection(id) {
    onChange((prev) => ({
      sections: getProfileSections(prev).filter((section) => section.id !== id),
      actionSettingsVersion: 2,
      actionSettings: getActionSettings(prev).map((item) => item.sectionId === id ? { ...item, sectionId: '' } : item),
      links: (prev.links || []).map((item) => item.sectionId === id ? { ...item, sectionId: '' } : item),
      socialSections: Object.fromEntries(Object.entries(prev.socialSections || {}).map(([key, value]) => [key, value === id ? '' : value])),
      bankAccounts: (prev.bankAccounts || []).map((item) => item.sectionId === id ? { ...item, sectionId: BANK_SECTION_ID } : item),
    }))
  }

  return <div className="space-y-4">
    <p className="text-xs text-gray-400">Cada sección contiene sus botones y enlaces. Arrastra para ordenar o mover entre secciones; también puedes usar las flechas y el selector de sección. Las redes se configuran en Redes sociales y las cuentas en Pagos.</p>
    {groups.map((section, groupIndex) => {
      const items = entries.filter((item) => (item.sectionId || '') === section.id)
      const editable = section.id && section.id !== BANK_SECTION_ID
      return <div key={section.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); drop(section.id) }} className={`min-w-0 rounded-xl border p-3 sm:p-4 ${dragged ? 'border-clickclick-orange/60' : 'border-gray-700'} bg-gray-950/40`}>
        <div className="mb-3 flex items-center gap-2">
          {editable ? <input aria-label="Nombre de sección" className={`${inputCls} flex-1 font-semibold`} value={section.title} maxLength={60} onChange={(event) => onChange({ sections: sections.map((item) => item.id === section.id ? { ...item, title: event.target.value } : item) })} /> : <h3 className="min-w-0 flex-1 text-sm font-semibold">{section.title}</h3>}
          <span className="text-xs text-gray-500">{items.length}</span>
          {editable && <><IconButton icon="chevron-up" label="Subir sección" disabled={groupIndex === 1} onClick={() => moveSection(section.id, -1)} /><IconButton icon="chevron-down" label="Bajar sección" disabled={groupIndex === groups.length - 1} onClick={() => moveSection(section.id, 1)} /><IconButton icon="trash" label="Eliminar sección y conservar botones" tone="danger" onClick={() => removeSection(section.id)} /></>}
        </div>
        <div className="space-y-2">
          {items.length === 0 && <p className="rounded-lg border border-dashed border-gray-700 p-4 text-xs text-gray-500">Agrega un botón o mueve uno aquí.</p>}
          {items.map((entry, index) => <div key={entry.key} id={editorItemId(entry.key)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.stopPropagation(); event.preventDefault(); drop(section.id, entry) }} className={`scroll-mt-40 overflow-hidden rounded-xl border border-gray-700 bg-gray-900 ${flash === entry.key ? FLASH_CLASS : ''}`}>
            <div className="flex items-center gap-1 p-2 sm:gap-2 sm:p-3">
              <span draggable onDragStart={(event) => { event.dataTransfer.setData('text/plain', entry.key); setDragged(entry.key) }} onDragEnd={() => setDragged('')} className="cursor-grab p-1 text-gray-500" title="Arrastrar botón"><Icon name="grip" size={16} /></span>
              <Icon name={entry.icon || ACTION_DEFINITIONS.find((item) => item.type === entry.type)?.icon || 'link'} size={19} />
              <button type="button" aria-expanded={open === entry.key} onClick={() => { setOpen(open === entry.key ? '' : entry.key); onFocusItem?.(entry.key) }} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-medium">{entry.title}</span><span className="text-[11px] text-gray-400">{entry.kind === 'social' ? 'Red social' : entry.enabled === false ? 'Oculto' : entry.kind === 'link' ? 'Enlace personalizado' : 'Botón de acción'}</span></button>
              <IconButton icon="chevron-up" label={`Subir ${entry.title}`} disabled={index === 0} onClick={() => reorder(entry, items[index - 1])} />
              <IconButton icon="chevron-down" label={`Bajar ${entry.title}`} disabled={index === items.length - 1} onClick={() => reorder(entry, items[index + 1])} />
              {entry.kind !== 'social' && <Toggle checked={entry.enabled !== false} onChange={(enabled) => patch(entry, { enabled })} label={`Mostrar ${entry.title}`} />}
            </div>
            {open === entry.key && <div className="space-y-4 border-t border-gray-800 p-3 sm:p-4">
              {entry.kind === 'social' ? <p className="text-xs text-gray-400">Edita la dirección y su presentación en el apartado Redes sociales.</p> : <ContentFields entry={entry} business={business} patch={(changes) => patch(entry, changes)} onChange={onChange} />}
              <Field label="Mover a sección"><select className={inputCls} value={entry.sectionId || ''} onChange={(event) => patch(entry, { sectionId: event.target.value })}>{groups.map((group) => <option key={group.id} value={group.id}>{group.title}</option>)}</select></Field>
              {entry.kind !== 'social' && <button type="button" onClick={() => remove(entry)} className="text-xs text-red-300">Eliminar botón</button>}
            </div>}
          </div>)}
        </div>
        <AddContent sectionId={section.id} add={add} business={business} />
      </div>
    })}
    <button type="button" disabled={sections.length >= 50} onClick={() => onChange({ sections: [...sections.filter((section) => section.id !== BANK_SECTION_ID), { id: `section-${crypto.randomUUID()}`, title: 'Nueva sección' }, ...sections.filter((section) => section.id === BANK_SECTION_ID)] })} className="w-full rounded-xl border border-dashed border-gray-600 p-3 text-sm text-clickclick-orange disabled:opacity-40">+ Agregar sección</button>
  </div>
}

function AddContent({ sectionId, add, business }) {
  const [type, setType] = useState('link')
  const full = type === 'link' ? (business.links || []).length >= 50 : getActionSettings(business).length >= 100
  return <div className="mt-3 flex flex-wrap gap-2">
    <select aria-label="Tipo de contenido nuevo" value={type} onChange={(event) => setType(event.target.value)} className={`${inputCls} min-w-0 flex-1`}><option value="link">Enlace personalizado</option>{ACTION_DEFINITIONS.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}</select>
    <button type="button" disabled={full} onClick={() => add(type, sectionId)} className="rounded-lg bg-clickclick-orange px-3 py-2 text-xs font-semibold text-clickclick-dark disabled:opacity-40">+ Agregar botón</button>
    {full && <p className="w-full text-xs text-amber-300">Límite alcanzado: {type === 'link' ? '50 enlaces' : '100 botones'}.</p>}
  </div>
}

function ContentFields({ entry, business, patch, onChange }) {
  const isLink = entry.kind === 'link'
  const definition = ACTION_DEFINITIONS.find((item) => item.type === entry.type)
  const field = definition?.field
  const value = isLink || entry.type === 'custom' ? entry.url || '' : entry.destination || ''
  return <>
    <Field label="Título visible"><input className={inputCls} maxLength={80} value={isLink ? entry.valueTitle : entry.label || ''} onChange={(event) => patch(isLink ? { title: event.target.value } : { label: event.target.value })} /></Field>
    {entry.type === 'contact' ? <ContactCardFields entry={entry} business={business} patch={patch} /> : <>
      {!isLink && entry.type !== 'custom' && <Field label="Destino del botón"><select className={inputCls} value={entry.destination ? 'own' : entry.useOwnDestination ? 'own' : 'general'} onChange={(event) => patch({ useOwnDestination: event.target.value === 'own', destination: '' })}><option value="general">Usar dato general de Contacto</option><option value="own">Usar un destino propio</option></select></Field>}
      {(isLink || entry.type === 'custom' || entry.destination || entry.useOwnDestination) ? <Field label={entry.type === 'whatsapp' ? 'Número para este botón' : entry.type === 'review' ? 'Enlace de reseñas o Place ID de Google' : 'URL de destino'}><input className={inputCls} value={value} onChange={(event) => patch(isLink || entry.type === 'custom' ? { url: event.target.value } : { destination: event.target.value })} placeholder={entry.type === 'whatsapp' ? '+593999999999' : entry.type === 'review' ? 'https://g.page/r/.../review o ChIJ...' : 'https://...'} />{value && entry.type !== 'whatsapp' && !(entry.type === 'review' ? googleReviewUrl(value) : safeActionUrl(value)) && <span className="text-xs text-amber-300">Revisa la dirección web.</span>}</Field> : <p className="break-all text-xs text-gray-400">{business[field] || 'Sin dato general. Completa este destino en Contacto o elige un destino propio.'}</p>}
    </>}
    {(isLink || entry.type === 'custom') && <IconPicker value={entry.icon || 'link'} onChange={(icon) => patch({ icon })} />}
    <details className="rounded-lg border border-gray-700 p-3"><summary className="cursor-pointer text-xs text-gray-300">Personalizar apariencia de este botón</summary><div className="mt-3 space-y-3">
      <LayoutSelector value={entry.layout} onChange={(layout) => patch({ layout })} />
      <AnimationSelector value={entry.animation} business={business} primary={entry.type === 'whatsapp'} onChange={(animation) => patch({ animation })} />
      <ButtonColorFields business={business} action={{ ...entry, primary: entry.type === 'whatsapp' }} onChange={(colors) => patch({ colors })} />
      {entry.thumbnail && <img src={entry.thumbnail} alt="Miniatura" className="h-16 w-24 rounded-lg object-cover" />}
      <ImageUploadButton label={entry.thumbnail ? 'Cambiar miniatura' : 'Agregar miniatura'} preset={entry.layout === 'featured' ? CROP_PRESETS.thumbWide : CROP_PRESETS.thumbSquare} slug={business.slug || business.name} onUploaded={(thumbnail) => onChange((prev) => patchContent(prev, entry, { thumbnail }))} />
      {entry.thumbnail && <button type="button" onClick={() => patch({ thumbnail: '' })} className="ml-3 text-xs text-gray-400">Quitar miniatura</button>}
    </div></details>
  </>
}
