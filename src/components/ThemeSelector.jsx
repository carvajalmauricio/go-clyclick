import { THEME_LIST } from '../utils/themes.js'

// Selector visual de temas + opción personalizada (color de acento).
export default function ThemeSelector({ value, customColors, onChange, onCustomChange }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {THEME_LIST.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-2 rounded-lg p-2 border transition ${
              value === t.id ? 'ring-2 ring-clickclick-orange border-transparent' : 'border-gray-600'
            }`}
            style={{ background: t.bg, color: t.text }}
          >
            <span className="w-5 h-5 rounded-full" style={{ background: t.accent }} />
            <span className="text-xs font-medium truncate">{t.name}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange('custom')}
          className={`flex items-center gap-2 rounded-lg p-2 border transition bg-gray-800 text-white ${
            value === 'custom' ? 'ring-2 ring-clickclick-orange border-transparent' : 'border-gray-600'
          }`}
        >
          <span
            className="w-5 h-5 rounded-full border border-white/30"
            style={{ background: customColors?.accent || '#F49120' }}
          />
          <span className="text-xs font-medium">Personalizado</span>
        </button>
      </div>

      {value === 'custom' && (
        <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-gray-400">Acento</span>
            <input
              type="color"
              value={customColors?.accent || '#F49120'}
              onChange={(e) => onCustomChange({ ...customColors, accent: e.target.value })}
              className="h-9 w-full rounded cursor-pointer bg-transparent"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-400">Fondo</span>
            <input
              type="color"
              value={customColors?.bg || '#0f0f12'}
              onChange={(e) => onCustomChange({ ...customColors, bg: e.target.value, bgGradient: e.target.value })}
              className="h-9 w-full rounded cursor-pointer bg-transparent"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-400">Texto</span>
            <input
              type="color"
              value={customColors?.text || '#ffffff'}
              onChange={(e) => onCustomChange({ ...customColors, text: e.target.value })}
              className="h-9 w-full rounded cursor-pointer bg-transparent"
            />
          </label>
        </div>
      )}
    </div>
  )
}
