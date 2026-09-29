import { useState } from 'react'
import { LINK_ICONS } from '../utils/links.js'
import { uploadMedia } from '../utils/api.js'
import { Icon } from './Icons.jsx'
import ButtonColorFields from './ButtonColorFields.jsx'
import AnimationSelector from './AnimationSelector.jsx'
import { FileButton, IconButton, Toggle } from './admin/ui.jsx'
import { getProfileSections } from '../utils/banking.js'
import LayoutSelector from './LayoutSelector.jsx'

// Editor de enlaces personalizados ilimitados (más allá de los 7 botones fijos).
// Cada enlace tiene título, URL, icono o miniatura, interruptor, orden,
// presentación (layout), sección, colores y animación.
export default function CustomLinksManager({ business, onChange }) {
  const links = Array.isArray(business.links) ? business.links : []
  const [open, setOpen] = useState('')
  const [dragged, setDragged] = useState('')
  const [uploading, setUploading] = useState('')
  const sections = getProfileSections(business)

  function commit(next) {
    onChange({ links: next.map((item, order) => ({ ...item, order })) })
  }

  function addLink() {
    const id = `link-${Date.now().toString(36)}`
    commit([...links, { id, title: '', url: '', icon: 'link', thumbnail: '', enabled: true, layout: 'classic', sectionId: '', animation: 'none', colors: {} }])
    setOpen(id)
  }

  function patch(id, update) {
    commit(links.map((item) => (item.id === id ? { ...item, ...update } : item)))
  }

  function remove(id) {
    commit(links.filter((item) => item.id !== id))
  }

  function move(id, direction) {
    const index = links.findIndex((item) => item.id === id)
    const target = index + direction
    if (target < 0 || target >= links.length) return
    const next = [...links]
    ;[next[index], next[target]] = [next[target], next[index]]
    commit(next)
  }

  function drop(targetId) {
    if (!dragged || dragged === targetId) return
    const next = [...links]
    const from = next.findIndex((item) => item.id === dragged)
    const to = next.findIndex((item) => item.id === targetId)
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    commit(next)
    setDragged('')
  }

  async function uploadThumbnail(id, event) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(id)
    try {
      const { url } = await uploadMedia(file, business.slug || business.name || 'general', 'thumbnail')
      patch(id, { thumbnail: url })
    } finally {
      setUploading('')
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Enlaces ilimitados adicionales a los botones fijos. Arrástralos para ordenarlos.</p>
        <button type="button" onClick={addLink} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gray-800 px-3 py-1.5 text-xs hover:bg-gray-700"><Icon name="plus" size={12} />Agregar enlace</button>
      </div>

      {links.length === 0 && <p className="text-xs text-gray-500">Aún no has agregado enlaces personalizados.</p>}

      <div className="space-y-2">
        {links.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDragged(item.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => drop(item.id)}
            className={`overflow-hidden rounded-xl border bg-gray-900/70 ${dragged === item.id ? 'border-clickclick-orange opacity-60' : 'border-gray-700'}`}
          >
            <div className="flex items-center gap-2 p-3">
              <span className="cursor-grab text-gray-600 hover:text-gray-400" title="Arrastrar para ordenar"><Icon name="grip" size={16} /></span>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-clickclick-orange">
                {item.thumbnail ? <img src={item.thumbnail} alt="" className="h-full w-full rounded-lg object-cover" /> : <Icon name={item.icon || 'link'} size={19} />}
              </span>
              <button type="button" onClick={() => setOpen(open === item.id ? '' : item.id)} className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-medium">{item.title || 'Enlace sin título'}</span>
                <span className={`text-[11px] ${item.url ? 'text-emerald-400' : 'text-gray-500'}`}>{item.url ? 'Con destino' : 'Falta URL'}</span>
              </button>
              <IconButton icon="chevron-up" label="Subir" onClick={() => move(item.id, -1)} disabled={index === 0} />
              <IconButton icon="chevron-down" label="Bajar" onClick={() => move(item.id, 1)} disabled={index === links.length - 1} />
              <Toggle checked={item.enabled !== false} onChange={(enabled) => patch(item.id, { enabled })} label={`Mostrar ${item.title || 'enlace'}`} />
              <IconButton icon="trash" label="Eliminar enlace" tone="danger" onClick={() => remove(item.id)} />
            </div>

            {open === item.id && (
              <div className="border-t border-gray-800 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-xs text-gray-400">Título visible
                    <input value={item.title || ''} onChange={(event) => patch(item.id, { title: event.target.value })} className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white" placeholder="Mi enlace" />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-gray-400">URL de destino
                    <input value={item.url || ''} onChange={(event) => patch(item.id, { url: event.target.value })} className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white" placeholder="https://..." inputMode="url" />
                  </label>
                </div>
                <label className="mt-3 flex flex-col gap-1 text-xs text-gray-400">Icono
                  <select value={item.icon || 'link'} onChange={(event) => patch(item.id, { icon: event.target.value })} className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white">{LINK_ICONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                </label>
                <LayoutSelector value={item.layout} onChange={(layout) => patch(item.id, { layout })} />
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <AnimationSelector value={item.animation} onChange={(animation) => patch(item.id, { animation })} className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white" />
                  <label className="flex flex-col gap-1 text-xs text-gray-400">Sección
                    <select value={item.sectionId || ''} onChange={(event) => patch(item.id, { sectionId: event.target.value })} className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white"><option value="">Sin sección</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}</select>
                  </label>
                </div>
                <ButtonColorFields business={business} action={{ ...item, primary: false }} onChange={(colors) => patch(item.id, { colors })} />
                <div className="mt-3 flex items-center gap-3">
                  {item.thumbnail && <img src={item.thumbnail} alt="Miniatura" className="h-14 w-14 rounded-lg object-cover" />}
                  <FileButton label={item.thumbnail ? 'Cambiar miniatura' : 'Agregar miniatura'} busy={uploading === item.id} accept="image/png,image/jpeg,image/webp,image/gif" onFile={(event) => uploadThumbnail(item.id, event)} />
                  {item.thumbnail && <button type="button" onClick={() => patch(item.id, { thumbnail: '' })} className="text-xs text-gray-400 hover:text-white">Quitar</button>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
