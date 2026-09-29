import { BUTTON_LAYOUTS } from '../utils/buttonStyles.js'

// Selector de presentación con miniaturas que reproducen la estructura real
// de cada layout en el perfil (ver ActionCard en ProfileView).
const HINTS = {
  classic: 'Botón a lo ancho con icono y título.',
  featured: 'Tarjeta grande con imagen o icono arriba y título abajo.',
  grid: 'Tarjeta cuadrada; los enlaces seguidos con este estilo se muestran de 2 en 2.',
  icon: 'Solo el icono; los enlaces seguidos con este estilo forman una fila.',
}

export default function LayoutSelector({ value, onChange }) {
  const current = value || 'classic'
  return (
    <fieldset className="mt-3">
      <legend className="mb-1 text-xs text-gray-400">Presentación</legend>
      <div className="grid grid-cols-4 gap-2">
        {BUTTON_LAYOUTS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={current === option.value}
            title={HINTS[option.value]}
            className={`flex flex-col items-center gap-1.5 rounded-lg border px-1.5 py-2 text-[11px] leading-tight ${current === option.value ? 'border-clickclick-orange bg-clickclick-orange/10 text-clickclick-orange' : 'border-gray-700 text-gray-300 hover:border-gray-500'}`}
          >
            <LayoutDiagram layout={option.value} />
            {option.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-gray-500">{HINTS[current]}</p>
    </fieldset>
  )
}

function LayoutDiagram({ layout }) {
  const box = 'rounded-[3px] border border-current'
  return (
    <span aria-hidden="true" className="flex h-10 w-12 flex-col items-center justify-center gap-1 opacity-90">
      {layout === 'classic' && (
        <>
          <span className={`${box} flex h-3 w-11 items-center gap-0.5 px-0.5`}><span className="h-1.5 w-1.5 rounded-full bg-current" /><span className="h-0.5 flex-1 bg-current opacity-60" /></span>
          <span className={`${box} flex h-3 w-11 items-center gap-0.5 px-0.5 opacity-50`}><span className="h-1.5 w-1.5 rounded-full bg-current" /><span className="h-0.5 flex-1 bg-current opacity-60" /></span>
        </>
      )}
      {layout === 'featured' && (
        <span className={`${box} flex h-9 w-11 flex-col overflow-hidden`}><span className="flex-1 bg-current opacity-30" /><span className="mx-1 my-1 h-0.5 bg-current opacity-80" /></span>
      )}
      {layout === 'grid' && (
        <span className="grid w-11 grid-cols-2 gap-1">
          {[0, 1].map((i) => <span key={i} className={`${box} flex h-8 flex-col overflow-hidden`}><span className="flex-1 bg-current opacity-30" /><span className="mx-0.5 my-0.5 h-0.5 bg-current opacity-80" /></span>)}
        </span>
      )}
      {layout === 'icon' && (
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => <span key={i} className={`${box} flex h-3.5 w-3.5 items-center justify-center`}><span className="h-1.5 w-1.5 rounded-full bg-current" /></span>)}
        </span>
      )}
    </span>
  )
}
