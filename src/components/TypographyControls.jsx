import { normalizeTypography, textPresentation, contrastRatio } from '../utils/typography.js'
import { resolveTheme } from '../utils/themes.js'
import { buildActions } from '../utils/links.js'
import { getButtonColors } from '../utils/buttonColors.js'

export default function TypographyControls({ business, onChange }) {
  const theme = resolveTheme(business.theme, business.customColors)
  const text = textPresentation(business, theme)
  const value = text.typography
  const patch = (changes) => onChange({ typography: { ...value, ...changes } })
  const background = text.background || (business.background?.type === 'solid' && !(business.background.pattern && business.background.pattern !== 'none') && !theme.pattern ? business.background.color || theme.bg : null)
  const checks = [
    { label: 'Nombre', ratio: contrastRatio(text.title, background), minimum: 3 },
    ...(business.description ? [{ label: 'Descripción', ratio: contrastRatio(text.description, background), minimum: 4.5 }] : []),
    ...buildActions(business).map((action) => {
      const colors = getButtonColors(action, theme, business.buttonStyle)
      return { label: action.label, ratio: contrastRatio(colors.text, colors.background), minimum: 4.5 }
    }),
  ]
  return <div className="space-y-4 rounded-xl border border-gray-700 bg-gray-900/50 p-4">
    <h4 className="text-xs font-semibold uppercase tracking-wide text-clickclick-orange">Tipografía y legibilidad</h4>
    <Range label="Tamaño del nombre" field="titleSize" min={22} max={40} unit="px" value={value} patch={patch} />
    <Range label="Tamaño de la descripción" field="descriptionSize" min={14} max={22} unit="px" value={value} patch={patch} />
    <Range label="Tamaño del texto de botones" field="buttonSize" min={14} max={22} unit="px" value={value} patch={patch} />
    <Range label="Interlineado" field="lineHeight" min={1.3} max={2} step={0.1} unit="×" value={value} patch={patch} />
    <label className="flex flex-col gap-1 text-xs text-gray-400">Fondo de lectura para nombre y descripción
      <select value={value.textPanel} onChange={(event) => patch({ textPanel: event.target.value })} className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white">
        <option value="none">Sin fondo · conservar colores</option><option value="dark">Oscuro con texto blanco</option><option value="light">Claro con texto oscuro</option>
      </select>
    </label>
    <p className="text-xs text-gray-400">La alineación se ajusta en Presentación → Cabecera del perfil. El fondo de lectura mantiene estos textos legibles sobre fotos y videos. Al quitarlo se recuperan tus colores.</p>
    <details className="rounded-lg border border-gray-700 p-3">
      <summary className="cursor-pointer text-sm">Revisar contraste · {checks.filter((check) => check.ratio !== null && check.ratio < check.minimum).length} avisos</summary>
      <p className="mt-2 text-xs text-gray-400">Referencia: 4.5:1 para texto y 3:1 para el nombre en negrita. Los fondos con imágenes, degradados o transparencias requieren revisión visual.</p>
      <ul className="mt-2 space-y-2 text-xs">{checks.map((check, index) => <li key={index} className={check.ratio === null ? 'text-gray-400' : check.ratio < check.minimum ? 'text-amber-300' : 'text-emerald-300'}>
        {check.label}: {check.ratio === null ? 'Revisar visualmente' : `${check.ratio.toFixed(2)}:1 · ${check.ratio < check.minimum ? 'Contraste bajo: cambia el color del texto o del fondo' : 'Contraste suficiente'}`}
      </li>)}</ul>
    </details>
    <button type="button" onClick={() => onChange({ typography: normalizeTypography() })} className="text-xs text-gray-400 underline">Restablecer tipografía y legibilidad</button>
  </div>
}

function Range({ label, field, min, max, step = 1, unit, value, patch }) {
  return <label className="flex flex-col gap-1 text-xs text-gray-400">{label}: {value[field]} {unit}
    <input type="range" min={min} max={max} step={step} value={value[field]} onChange={(event) => patch({ [field]: Number(event.target.value) })} />
  </label>
}
