import { useMemo, useState } from 'react'
import { ACTION_DEFINITIONS, getActionSettings } from '../utils/links.js'
import { Icon } from './Icons.jsx'
import ButtonColorFields from './ButtonColorFields.jsx'
import AnimationSelector from './AnimationSelector.jsx'
import { IconButton, Toggle } from './admin/ui.jsx'
import { BANK_SECTION_ID, getProfileSections } from '../utils/banking.js'
import LayoutSelector from './LayoutSelector.jsx'
import ImageUploadButton from './admin/ImageUploadButton.jsx'
import { CROP_PRESETS } from '../utils/image.js'
import { FLASH_CLASS, editorItemId, useEditorFocus } from './admin/useEditorFocus.js'

export default function ActionManager({ business, onChange, focus, onFocusItem }) {
  const [open, setOpen] = useState('whatsapp')
  const [dragged, setDragged] = useState('')
  const [uploading, setUploading] = useState('')
  const settings = useMemo(() => getActionSettings(business), [business.actionSettings])
  const definitions = new Map(ACTION_DEFINITIONS.map((item) => [item.type, item]))
  const sections = getProfileSections(business)
  const flash = useEditorFocus(focus, (key) => (definitions.has(key) ? key : ''), setOpen)

  function commit(next) {
    onChange({ actionSettings: next.map((item, order) => ({ ...item, order })) })
  }

  function patch(type, update) {
    commit(settings.map((item) => item.type === type ? { ...item, ...update } : item))
    onFocusItem?.(type)
  }

  // Para callbacks asíncronos (subidas): aplica el cambio sobre el estado más
  // reciente del editor, no sobre el de cuando empezó la subida.
  function patchLatest(type, update) {
    onChange((prev) => ({ actionSettings: getActionSettings(prev).map((item, order) => ({ ...item, order, ...(item.type === type ? update : {}) })) }))
  }

  function toggle(type) {
    const next = open === type ? '' : type
    setOpen(next)
    onFocusItem?.(next)
  }

  function move(type, direction) {
    const index = settings.findIndex((item) => item.type === type)
    const target = index + direction
    if (target < 0 || target >= settings.length) return
    const next = [...settings]
    ;[next[index], next[target]] = [next[target], next[index]]
    commit(next)
  }

  function drop(targetType) {
    if (!dragged || dragged === targetType) return
    const next = [...settings]
    const from = next.findIndex((item) => item.type === dragged)
    const to = next.findIndex((item) => item.type === targetType)
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    commit(next)
    setDragged('')
  }

  function addSection() {
    const id = `section-${Date.now()}`
    onChange({ sections: [...sections, { id, title: 'Nueva sección' }] })
  }

  function patchSection(id, title) {
    onChange({ sections: sections.map((section) => section.id === id ? { ...section, title } : section) })
  }

  function removeSection(id) {
    if (id === BANK_SECTION_ID) return
    onChange({
      sections: sections.filter((section) => section.id !== id),
      actionSettings: settings.map((item) => item.sectionId === id ? { ...item, sectionId: '' } : item),
      bankAccounts: (business.bankAccounts || []).map((account) => account.sectionId === id ? { ...account, sectionId: BANK_SECTION_ID } : account),
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">Arrastra las acciones para ordenarlas. Solo se muestran las que tienen destino configurado.</p>
      <div className="space-y-2">
        {settings.map((item, index) => {
          const definition = definitions.get(item.type)
          const configured = item.type === 'contact'
            ? Boolean(business.phone || business.email || business.whatsapp)
            : Boolean(business[definition.field])
          return (
            <div
              key={item.type}
              id={editorItemId(item.type)}
              draggable
              onDragStart={() => setDragged(item.type)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => drop(item.type)}
              className={`scroll-mt-40 overflow-hidden rounded-xl border bg-gray-900/70 transition-shadow ${dragged === item.type ? 'border-clickclick-orange opacity-60' : 'border-gray-700'} ${flash === item.type ? FLASH_CLASS : ''}`}
            >
              <div className="flex items-center gap-2 p-3">
                <span className="cursor-grab text-gray-600 hover:text-gray-400" title="Arrastrar para ordenar"><Icon name="grip" size={16} /></span>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-clickclick-orange"><Icon name={definition.icon} size={19} /></span>
                <button type="button" onClick={() => toggle(item.type)} aria-expanded={open === item.type} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium">{item.label || definition.label}</span>
                  <span className={`text-[11px] ${configured ? 'text-emerald-400' : item.enabled !== false ? 'text-amber-300' : 'text-gray-500'}`}>{configured ? 'Configurado' : 'Falta configurar destino'}</span>
                </button>
                <IconButton icon="chevron-up" label="Subir" onClick={() => move(item.type, -1)} disabled={index === 0} />
                <IconButton icon="chevron-down" label="Bajar" onClick={() => move(item.type, 1)} disabled={index === settings.length - 1} />
                <Toggle checked={item.enabled !== false} onChange={(enabled) => patch(item.type, { enabled })} label={`Mostrar ${item.label || definition.label}`} />
              </div>

              {open === item.type && (
                <div className="border-t border-gray-800 p-4">
                  <label className="flex flex-col gap-1 text-xs text-gray-400">Título visible
                    <input value={item.label || ''} onChange={(event) => patch(item.type, { label: event.target.value })} className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white" />
                  </label>
                  <LayoutSelector value={item.layout} onChange={(layout) => patch(item.type, { layout })} />
                  <div className="mt-3">
                    <AnimationSelector value={item.animation} business={business} primary={item.type === 'whatsapp'} onChange={(animation) => patch(item.type, { animation })} />
                  </div>
                  <ButtonColorFields business={business} action={{ ...item, primary: item.type === 'whatsapp' }} onChange={(colors) => patch(item.type, { colors })} />
                  <label className="mt-3 flex flex-col gap-1 text-xs text-gray-400">Sección
                    <select value={item.sectionId || ''} onChange={(event) => patch(item.type, { sectionId: event.target.value })} className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"><option value="">Sin sección</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}</select>
                  </label>
                  <div className="mt-3 flex items-center gap-3">
                    {item.thumbnail && <img src={item.thumbnail} alt="Miniatura" className={`h-14 rounded-lg object-cover ${item.layout === 'featured' ? 'w-24' : 'w-14'}`} />}
                    <ImageUploadButton
                      label={item.thumbnail ? 'Cambiar miniatura' : 'Agregar miniatura'}
                      preset={item.layout === 'featured' ? CROP_PRESETS.thumbWide : CROP_PRESETS.thumbSquare}
                      slug={business.slug || business.name}
                      onBusyChange={(busy) => setUploading(busy ? item.type : '')}
                      disabled={Boolean(uploading) && uploading !== item.type}
                      onUploaded={(thumbnail) => patchLatest(item.type, { thumbnail })}
                    />
                    {item.thumbnail && <button type="button" onClick={() => patch(item.type, { thumbnail: '' })} className="text-xs text-gray-400 hover:text-white">Quitar</button>}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-gray-700 p-4">
        <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-clickclick-orange">Secciones</p><button type="button" onClick={addSection} className="inline-flex items-center gap-1 rounded-lg bg-gray-800 px-3 py-1.5 text-xs hover:bg-gray-700"><Icon name="plus" size={12} />Agregar</button></div>
        {sections.length === 0 && <p className="text-xs text-gray-500">Puedes agrupar acciones bajo encabezados.</p>}
        <div className="space-y-2">{sections.map((section) => <div key={section.id} className="flex items-center gap-2"><input aria-label="Nombre de sección" value={section.title} onChange={(event) => patchSection(section.id, event.target.value)} className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm" />{section.id === BANK_SECTION_ID ? <span className="text-xs text-gray-500">Bancaria</span> : <IconButton icon="trash" label="Eliminar sección" tone="danger" onClick={() => removeSection(section.id)} />}</div>)}</div>
      </div>
    </div>
  )
}
