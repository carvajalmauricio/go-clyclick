import { useState } from 'react'
import { uploadMedia } from '../utils/api.js'
import {
  DEFAULT_HERO_SLIDES,
  HERO_INTERVAL_MAX,
  HERO_INTERVAL_MIN,
  HERO_SLIDES_LIMIT,
} from '../utils/heroSlides.js'
import { Icon } from './Icons.jsx'
import { Field, FileButton, IconButton, Toggle, inputCls } from './admin/ui.jsx'

// Editor de los slides de la tarjeta de presentación. El slide 1 siempre es la
// presentación base (logo, nombre, descripción y categoría de "Información básica").
export default function HeroSlidesManager({ business, onChange }) {
  const config = { ...DEFAULT_HERO_SLIDES, ...(business.heroSlides || {}) }
  const items = Array.isArray(config.items) ? config.items : []
  const [uploading, setUploading] = useState('')
  const [uploadError, setUploadError] = useState('')

  function commit(update) {
    onChange({ heroSlides: { ...config, items, ...update } })
  }

  function patchItem(id, update) {
    commit({ items: items.map((item) => (item.id === id ? { ...item, ...update } : item)) })
  }

  function addItem() {
    if (items.length >= HERO_SLIDES_LIMIT) return
    commit({
      enabled: true,
      items: [...items, { id: `slide-${Date.now()}`, image: '', title: '', description: '', category: '' }],
    })
  }

  function removeItem(id) {
    commit({ items: items.filter((item) => item.id !== id) })
  }

  function move(index, direction) {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    commit({ items: next })
  }

  async function onImage(id, event) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(id)
    try {
      const { url } = await uploadMedia(file, business.slug || business.name || 'general', 'slide')
      patchItem(id, { image: url })
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading('')
      event.target.value = ''
    }
  }

  const intervalValid = config.interval !== '' && Number.isFinite(Number(config.interval))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-950/40 p-3">
        <div>
          <p className="text-sm font-medium text-white">Rotar la presentación</p>
          <p className="text-xs text-gray-400">Rota sola o deslizando.</p>
        </div>
        <Toggle checked={config.enabled} onChange={(enabled) => commit({ enabled })} label="Activar slides de presentación" />
      </div>

      <div className={`space-y-4 ${config.enabled ? '' : 'opacity-50'}`}>
        <Field label="Tiempo por slide" hint={`Entre ${HERO_INTERVAL_MIN} y ${HERO_INTERVAL_MAX} segundos.`}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={HERO_INTERVAL_MIN}
              max={HERO_INTERVAL_MAX}
              step={0.5}
              value={config.interval}
              onChange={(event) => commit({ interval: event.target.value === '' ? '' : Number(event.target.value) })}
              onBlur={() => {
                const seconds = Number(config.interval)
                commit({ interval: intervalValid ? Math.max(HERO_INTERVAL_MIN, Math.min(HERO_INTERVAL_MAX, seconds)) : 3 })
              }}
              className={`${inputCls} w-24`}
            />
            <span className="text-xs text-gray-400">segundos</span>
          </div>
        </Field>

        <ol className="space-y-3">
          <li className="flex items-center gap-3 rounded-xl border border-dashed border-gray-700 p-3">
            <SlideThumb image={business.logo} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Slide 1 · Presentación</p>
              <p className="truncate text-sm text-gray-300">{business.name || 'Nombre del negocio'}</p>
              <p className="text-[11px] text-gray-500">Se edita en «Información básica».</p>
            </div>
          </li>

          {items.map((item, index) => (
            <li key={item.id} className="rounded-xl border border-gray-700 bg-gray-900/70 p-3">
              <div className="flex gap-3">
                <SlideThumb image={item.image} fallback={business.logo} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-clickclick-orange">Slide {index + 2}</p>
                    <IconButton icon="chevron-up" label="Subir slide" onClick={() => move(index, -1)} disabled={index === 0} />
                    <IconButton icon="chevron-down" label="Bajar slide" onClick={() => move(index, 1)} disabled={index === items.length - 1} />
                    <IconButton icon="trash" label="Eliminar slide" tone="danger" onClick={() => removeItem(item.id)} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <FileButton
                      label={item.image ? 'Cambiar imagen' : 'Subir imagen'}
                      busy={uploading === item.id}
                      disabled={Boolean(uploading)}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                      onFile={(event) => onImage(item.id, event)}
                    />
                    {item.image
                      ? <button type="button" onClick={() => patchItem(item.id, { image: '' })} className="px-1 text-xs text-gray-400 hover:text-white">Quitar</button>
                      : <span className="text-[11px] text-gray-500">Sin imagen se usa el logo.</span>}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Título">
                  <input className={inputCls} value={item.title || ''} maxLength={80} onChange={(event) => patchItem(item.id, { title: event.target.value })} placeholder="Diagnóstico electrónico" />
                </Field>
                <Field label="Categoría (opcional)">
                  <input className={inputCls} value={item.category || ''} maxLength={60} onChange={(event) => patchItem(item.id, { category: event.target.value })} placeholder="Servicios · Los mejores platos" />
                </Field>
                <Field label="Descripción (opcional)" className="sm:col-span-2">
                  <textarea className={inputCls} rows={2} maxLength={200} value={item.description || ''} onChange={(event) => patchItem(item.id, { description: event.target.value })} />
                </Field>
              </div>
            </li>
          ))}
        </ol>

        {uploadError && <p role="alert" className="text-xs text-red-400">{uploadError}</p>}
        {config.enabled && items.length === 0 && (
          <p className="flex items-center gap-2 text-xs text-amber-300"><Icon name="info" size={14} />Agrega al menos un slide para que la presentación empiece a rotar.</p>
        )}
        <button
          type="button"
          onClick={addItem}
          disabled={items.length >= HERO_SLIDES_LIMIT}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-600 py-3 text-xs font-semibold text-gray-300 transition hover:border-clickclick-orange hover:text-white disabled:opacity-50"
        >
          <Icon name="plus" size={14} />
          {items.length >= HERO_SLIDES_LIMIT ? `Máximo ${HERO_SLIDES_LIMIT} slides` : 'Agregar slide'}
        </button>
      </div>
    </div>
  )
}

function SlideThumb({ image, fallback }) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-600 bg-gray-800">
      {image ? (
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : fallback ? (
        <img src={fallback} alt="" className="h-full w-full object-cover opacity-40" />
      ) : (
        <Icon name="slides" size={18} className="text-gray-500" />
      )}
    </div>
  )
}
