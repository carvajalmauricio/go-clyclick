import { useState } from 'react'
import { THEME_LIST } from '../utils/themes.js'
import { uploadMedia } from '../utils/api.js'

export default function ThemeSelector({ value, customColors, background, buttonStyle, slug, onChange, onCustomChange, onBackgroundChange, onButtonStyleChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const bg = background || { type: 'theme', pattern: 'none', overlay: 0.25 }
  const buttons = buttonStyle || { shape: 'rounded', variant: 'filled', shadow: 'soft' }

  async function uploadBackground(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const { url } = await uploadMedia(file, slug || 'general', 'background')
      onBackgroundChange({ ...bg, type: file.type.startsWith('video/') ? 'video' : 'image', url })
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs text-gray-400">Galería de temas</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEME_LIST.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => { onChange(theme.id); onBackgroundChange({ ...bg, type: 'theme', pattern: theme.pattern || 'none' }) }}
              className={`relative h-28 overflow-hidden rounded-2xl border text-left transition ${value === theme.id && bg.type === 'theme' ? 'ring-2 ring-clickclick-orange border-transparent' : 'border-gray-600'}`}
              style={{ background: theme.bgGradient || theme.bg, color: theme.text }}
            >
              {theme.pattern && <span className={`profile-pattern profile-pattern-${theme.pattern}`} />}
              <span className="absolute inset-x-2 bottom-2 rounded-lg px-2 py-1 text-[11px] font-semibold backdrop-blur" style={{ background: `${theme.card}dd` }}>{theme.name}</span>
            </button>
          ))}
          <button type="button" onClick={() => onChange('custom')} className={`h-28 rounded-2xl border bg-gray-800 p-3 text-left text-xs font-semibold text-white ${value === 'custom' ? 'ring-2 ring-clickclick-orange border-transparent' : 'border-gray-600'}`}>
            <span className="mb-8 block h-7 w-7 rounded-full" style={{ background: customColors?.accent || '#F49120' }} />Personalizado
          </button>
        </div>
      </div>

      {value === 'custom' && (
        <div className="grid grid-cols-3 gap-3 text-xs">
          <Color label="Acento" value={customColors?.accent || '#F49120'} onChange={(accent) => onCustomChange({ ...customColors, accent })} />
          <Color label="Fondo" value={customColors?.bg || '#0f0f12'} onChange={(color) => onCustomChange({ ...customColors, bg: color, bgGradient: color })} />
          <Color label="Texto" value={customColors?.text || '#ffffff'} onChange={(text) => onCustomChange({ ...customColors, text })} />
        </div>
      )}

      <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-clickclick-orange">Fondo</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[["theme", "Tema"], ["solid", "Color"], ["gradient", "Degradado"], ["media", "Imagen / video"]].map(([type, label]) => (
            <button key={type} type="button" onClick={() => type !== 'media' && onBackgroundChange({ ...bg, type })} className={`rounded-lg border px-3 py-2 text-xs ${bg.type === type || (type === 'media' && ['image', 'video'].includes(bg.type)) ? 'border-clickclick-orange bg-clickclick-orange/10 text-clickclick-orange' : 'border-gray-700 text-gray-300'}`}>{label}</button>
          ))}
        </div>
        {bg.type === 'solid' && <div className="mt-3"><Color label="Color de fondo" value={bg.color || '#0f0f12'} onChange={(color) => onBackgroundChange({ ...bg, color })} /></div>}
        {bg.type === 'gradient' && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Color label="Color inicial" value={bg.color || '#0f0f12'} onChange={(color) => onBackgroundChange({ ...bg, color })} />
            <Color label="Color final" value={bg.color2 || '#F49120'} onChange={(color2) => onBackgroundChange({ ...bg, color2 })} />
            <label className="flex flex-col gap-1 text-xs text-gray-400">Dirección<select value={bg.angle || 160} onChange={(event) => onBackgroundChange({ ...bg, angle: Number(event.target.value) })} className="h-9 rounded bg-gray-800 px-2 text-white"><option value="0">Arriba</option><option value="90">Derecha</option><option value="160">Diagonal</option><option value="180">Abajo</option></select></label>
          </div>
        )}
        {['image', 'video'].includes(bg.type) && bg.url && (
          <div className="mt-3 flex items-center gap-3">
            {bg.type === 'video' ? <video src={bg.url} className="h-16 w-24 rounded-lg object-cover" muted /> : <img src={bg.url} alt="Fondo" className="h-16 w-24 rounded-lg object-cover" />}
            <button type="button" onClick={() => onBackgroundChange({ ...bg, type: 'theme', url: '' })} className="text-xs text-gray-400 underline">Quitar fondo</button>
          </div>
        )}
        <label className="mt-3 block cursor-pointer rounded-lg border border-dashed border-gray-600 px-3 py-3 text-center text-xs text-gray-300 hover:border-clickclick-orange">
          {uploading ? 'Subiendo...' : 'Subir imagen o video'}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm" onChange={uploadBackground} disabled={uploading} className="hidden" />
        </label>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <div className="mt-4">
          <p className="mb-2 text-xs text-gray-400">Formas y texturas</p>
          <div className="grid grid-cols-4 gap-2">
            {[["none", "Ninguna"], ["shapes", "Formas"], ["grid", "Cuadrícula"], ["glow", "Luces"]].map(([pattern, label]) => <button key={pattern} type="button" onClick={() => onBackgroundChange({ ...bg, pattern })} className={`rounded-lg border px-2 py-2 text-[11px] ${bg.pattern === pattern ? 'border-clickclick-orange text-clickclick-orange' : 'border-gray-700 text-gray-400'}`}>{label}</button>)}
          </div>
        </div>
        {['image', 'video'].includes(bg.type) && <label className="mt-4 flex flex-col gap-1 text-xs text-gray-400">Oscurecer fondo: {Math.round(Number(bg.overlay ?? .25) * 100)}%<input type="range" min="0" max="0.75" step="0.05" value={bg.overlay ?? .25} onChange={(event) => onBackgroundChange({ ...bg, overlay: Number(event.target.value) })} /></label>}
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-clickclick-orange">Estilo de botones</p>
        <SelectButtons label="Forma" value={buttons.shape || 'rounded'} options={[["square", "Recto"], ["rounded", "Redondeado"], ["pill", "Píldora"]]} onChange={(shape) => onButtonStyleChange({ ...buttons, shape })} />
        <SelectButtons label="Acabado" value={buttons.variant || 'filled'} options={[["filled", "Relleno"], ["outline", "Borde"], ["glass", "Cristal"]]} onChange={(variant) => onButtonStyleChange({ ...buttons, variant })} />
        <SelectButtons label="Sombra" value={buttons.shadow || 'soft'} options={[["none", "Sin sombra"], ["soft", "Suave"], ["solid", "Sólida"]]} onChange={(shadow) => onButtonStyleChange({ ...buttons, shadow })} />
      </div>
    </div>
  )
}

function Color({ label, value, onChange }) {
  return <label className="flex flex-col gap-1 text-xs text-gray-400">{label}<input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full cursor-pointer rounded bg-transparent" /></label>
}

function SelectButtons({ label, value, options, onChange }) {
  return <div className="mb-3"><p className="mb-1 text-xs text-gray-400">{label}</p><div className="grid grid-cols-3 gap-2">{options.map(([option, text]) => <button key={option} type="button" onClick={() => onChange(option)} className={`rounded-lg border px-2 py-2 text-xs ${value === option ? 'border-clickclick-orange text-clickclick-orange' : 'border-gray-700 text-gray-300'}`}>{text}</button>)}</div></div>
}
