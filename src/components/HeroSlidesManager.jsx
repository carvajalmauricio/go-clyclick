import { useState } from 'react'
import { uploadMedia } from '../utils/api.js'
import {
  DEFAULT_HERO_SLIDES,
  HERO_INTERVAL_MAX,
  HERO_INTERVAL_MIN,
  HERO_SLIDES_LIMIT,
} from '../utils/heroSlides.js'

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-700 p-3">
        <div>
          <p className="text-sm font-medium">Rotar la presentación</p>
          <p className="text-xs text-gray-400">El slide 1 es la presentación del negocio. Los demás rotan automáticamente o deslizando.</p>
        </div>
        <label className="relative inline-flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(event) => commit({ enabled: event.target.checked })}
            className="peer sr-only"
            aria-label="Activar slides de presentación"
          />
          <span className="h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-clickclick-orange peer-checked:after:translate-x-5" />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-400">Segundos por slide ({HERO_INTERVAL_MIN}–{HERO_INTERVAL_MAX})</span>
        <input
          type="number"
          min={HERO_INTERVAL_MIN}
          max={HERO_INTERVAL_MAX}
          step={0.5}
          value={config.interval}
          onChange={(event) => commit({ interval: event.target.value === '' ? '' : Number(event.target.value) })}
          onBlur={() => {
            const seconds = Number(config.interval)
            const valid = Number.isFinite(seconds) && config.interval !== ''
            commit({ interval: valid ? Math.max(HERO_INTERVAL_MIN, Math.min(HERO_INTERVAL_MAX, seconds)) : 3 })
          }}
          className={`${inputCls} w-32`}
        />
      </label>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="rounded-xl border border-gray-700 bg-gray-900/70 p-3">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs font-semibold text-clickclick-orange">Slide {index + 2}</span>
              <span className="flex-1" />
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="px-1 text-gray-400 disabled:opacity-20" aria-label="Subir slide">↑</button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="px-1 text-gray-400 disabled:opacity-20" aria-label="Bajar slide">↓</button>
              <button type="button" onClick={() => removeItem(item.id)} className="px-2 text-xs text-red-400">Eliminar</button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-600 bg-gray-800">
                {item.image ? (
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                ) : business.logo ? (
                  <img src={business.logo} alt="" className="h-full w-full object-cover opacity-40" />
                ) : (
                  <span className="text-[10px] text-gray-500">Sin imagen</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer rounded-lg border border-dashed border-gray-600 px-3 py-2 text-xs text-gray-300">
                  {uploading === item.id ? 'Subiendo...' : item.image ? 'Cambiar imagen' : 'Subir imagen'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                    onChange={(event) => onImage(item.id, event)}
                    disabled={Boolean(uploading)}
                    className="hidden"
                  />
                </label>
                {item.image && (
                  <button type="button" onClick={() => patchItem(item.id, { image: '' })} className="text-xs text-gray-400 underline">Quitar</button>
                )}
                {!item.image && <span className="text-[11px] text-gray-500">Sin imagen se usa el logo.</span>}
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">Título</span>
                <input className={inputCls} value={item.title || ''} maxLength={80} onChange={(event) => patchItem(item.id, { title: event.target.value })} placeholder="Diagnóstico electrónico" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">Categoría (opcional)</span>
                <input className={inputCls} value={item.category || ''} maxLength={60} onChange={(event) => patchItem(item.id, { category: event.target.value })} placeholder="Servicios · Los mejores platos" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">Descripción (opcional)</span>
                <textarea className={inputCls} rows={2} maxLength={200} value={item.description || ''} onChange={(event) => patchItem(item.id, { description: event.target.value })} />
              </label>
            </div>
          </div>
        ))}
      </div>

      {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
      {config.enabled && items.length === 0 && (
        <p className="text-xs text-amber-300">Agrega al menos un slide para que la presentación empiece a rotar.</p>
      )}
      <button
        type="button"
        onClick={addItem}
        disabled={items.length >= HERO_SLIDES_LIMIT}
        className="rounded-lg bg-gray-800 px-3 py-2 text-xs disabled:opacity-50"
      >
        + Agregar slide {items.length >= HERO_SLIDES_LIMIT ? `(máximo ${HERO_SLIDES_LIMIT})` : ''}
      </button>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-clickclick-orange'
