import { resolveTheme } from '../utils/themes.js'
import { getButtonColors, normalizeButtonColors } from '../utils/buttonColors.js'

export default function ButtonColorFields({ business, action, onChange }) {
  const theme = resolveTheme(business.theme, business.customColors)
  const colors = normalizeButtonColors(action.colors)
  const effective = getButtonColors(action, theme, business.buttonStyle)
  return (
    <fieldset className="mt-3 rounded-lg border border-gray-700 p-3">
      <legend className="px-1 text-xs text-gray-400">Colores de este botón</legend>
      <div className="grid grid-cols-3 gap-3">
        {[['background', 'Fondo'], ['text', 'Texto'], ['border', 'Borde']].map(([key, label]) => (
          <label key={key} className="flex flex-col gap-1 text-xs text-gray-400">
            {label}
            <input
              type="color"
              aria-label={`${label} del botón`}
              value={colors[key] || hexOr(effective[key], fallbackFor(key, action, theme))}
              onInput={(event) => onChange({ ...colors, [key]: event.target.value })}
              onChange={(event) => onChange({ ...colors, [key]: event.target.value })}
              className="h-9 w-full cursor-pointer rounded border border-gray-600 bg-gray-800 p-1"
            />
          </label>
        ))}
      </div>
      <button type="button" disabled={!Object.keys(colors).length} onClick={() => onChange({})} className="mt-2 text-xs text-gray-400 underline disabled:opacity-40">Usar colores del tema</button>
    </fieldset>
  )
}

const isHex = (value) => /^#[0-9a-f]{6}$/i.test(String(value || ''))
const hexOr = (value, fallback) => (isHex(value) ? value : fallback)

// Para acabados cuyo color efectivo no es un hex (degradados, transparencias),
// el selector parte del color base del tema.
function fallbackFor(key, action, theme) {
  const candidate = key === 'text' ? theme.text : key === 'border' ? theme.accent : action.primary ? theme.accent : theme.card
  return hexOr(candidate, key === 'text' ? '#ffffff' : '#1c1c22')
}
