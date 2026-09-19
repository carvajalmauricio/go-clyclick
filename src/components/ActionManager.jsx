import { useMemo, useState } from 'react'
import { ACTION_DEFINITIONS, getActionSettings } from '../utils/links.js'
import { uploadMedia } from '../utils/api.js'
import { Icon } from './Icons.jsx'

export default function ActionManager({ business, onChange }) {
  const [open, setOpen] = useState('whatsapp')
  const [dragged, setDragged] = useState('')
  const [uploading, setUploading] = useState('')
  const settings = useMemo(() => getActionSettings(business), [business.actionSettings])
  const definitions = new Map(ACTION_DEFINITIONS.map((item) => [item.type, item]))
  const sections = Array.isArray(business.sections) ? business.sections : []

  function commit(next) {
    onChange({ actionSettings: next.map((item, order) => ({ ...item, order })) })
  }

  function patch(type, update) {
    commit(settings.map((item) => item.type === type ? { ...item, ...update } : item))
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

  async function uploadThumbnail(type, event) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(type)
    try {
      const { url } = await uploadMedia(file, business.slug || business.name || 'general', 'thumbnail')
      patch(type, { thumbnail: url })
    } finally {
      setUploading('')
      event.target.value = ''
    }
  }

  function addSection() {
    const id = `section-${Date.now()}`
    onChange({ sections: [...sections, { id, title: 'Nueva sección' }] })
  }

  function patchSection(id, title) {
    onChange({ sections: sections.map((section) => section.id === id ? { ...section, title } : section) })
  }

  function removeSection(id) {
    onChange({
      sections: sections.filter((section) => section.id !== id),
      actionSettings: settings.map((item) => item.sectionId === id ? { ...item, sectionId: '' } : item),
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
              draggable
              onDragStart={() => setDragged(item.type)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => drop(item.type)}
              className={`overflow-hidden rounded-xl border bg-gray-900/70 ${dragged === item.type ? 'border-clickclick-orange opacity-60' : 'border-gray-700'}`}
            >
              <div className="flex items-center gap-3 p-3">
                <span className="cursor-grab text-gray-500" title="Arrastrar">⋮⋮</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-clickclick-orange"><Icon name={definition.icon} size={19} /></span>
                <button type="button" onClick={() => setOpen(open === item.type ? '' : item.type)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium">{item.label || definition.label}</span>
                  <span className={`text-[11px] ${configured ? 'text-emerald-400' : 'text-gray-500'}`}>{configured ? 'Configurado' : 'Falta configurar destino'}</span>
                </button>
                <button type="button" onClick={() => move(item.type, -1)} disabled={index === 0} className="px-1 text-gray-400 disabled:opacity-20" aria-label="Subir">↑</button>
                <button type="button" onClick={() => move(item.type, 1)} disabled={index === settings.length - 1} className="px-1 text-gray-400 disabled:opacity-20" aria-label="Bajar">↓</button>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" checked={item.enabled !== false} onChange={(event) => patch(item.type, { enabled: event.target.checked })} className="peer sr-only" />
                  <span className="h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-clickclick-orange peer-checked:after:translate-x-5" />
                </label>
              </div>

              {open === item.type && (
                <div className="border-t border-gray-800 p-4">
                  <label className="flex flex-col gap-1 text-xs text-gray-400">Título visible
                    <input value={item.label || ''} onChange={(event) => patch(item.type, { label: event.target.value })} className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white" />
                  </label>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 text-xs text-gray-400">Presentación
                      <select value={item.layout || 'classic'} onChange={(event) => patch(item.type, { layout: event.target.value })} className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"><option value="classic">Clásico</option><option value="featured">Destacado</option></select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-gray-400">Animación
                      <select value={item.animation || 'none'} onChange={(event) => patch(item.type, { animation: event.target.value })} className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"><option value="none">Ninguna</option><option value="pulse">Pulso</option><option value="bounce">Flotar</option></select>
                    </label>
                  </div>
                  <label className="mt-3 flex flex-col gap-1 text-xs text-gray-400">Sección
                    <select value={item.sectionId || ''} onChange={(event) => patch(item.type, { sectionId: event.target.value })} className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"><option value="">Sin sección</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}</select>
                  </label>
                  <div className="mt-3 flex items-center gap-3">
                    {item.thumbnail && <img src={item.thumbnail} alt="Miniatura" className="h-14 w-14 rounded-lg object-cover" />}
                    <label className="cursor-pointer rounded-lg border border-dashed border-gray-600 px-3 py-2 text-xs text-gray-300">
                      {uploading === item.type ? 'Subiendo...' : item.thumbnail ? 'Cambiar miniatura' : 'Agregar miniatura'}
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadThumbnail(item.type, event)} className="hidden" />
                    </label>
                    {item.thumbnail && <button type="button" onClick={() => patch(item.type, { thumbnail: '' })} className="text-xs text-gray-400 underline">Quitar</button>}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-gray-700 p-4">
        <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-clickclick-orange">Secciones</p><button type="button" onClick={addSection} className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs">+ Agregar</button></div>
        {sections.length === 0 && <p className="text-xs text-gray-500">Puedes agrupar acciones bajo encabezados.</p>}
        <div className="space-y-2">{sections.map((section) => <div key={section.id} className="flex gap-2"><input value={section.title} onChange={(event) => patchSection(section.id, event.target.value)} className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm" /><button type="button" onClick={() => removeSection(section.id)} className="px-2 text-xs text-red-400">Eliminar</button></div>)}</div>
      </div>
    </div>
  )
}
