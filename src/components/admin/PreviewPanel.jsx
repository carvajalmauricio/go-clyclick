import PhoneMockup, { DEVICES } from '../PhoneMockup.jsx'
import DesktopPreview from './DesktopPreview.jsx'
import { Icon } from '../Icons.jsx'

// Vista previa del editor con controles (#5): tamaño de móvil, vista de
// escritorio y modo claro/oscuro (cuando el tema automático está activo).
// `onSelect` y `highlightKey` conectan el preview con el editor (#6).
export default function PreviewPanel({ business, device, onDevice, scheme, onScheme, desktopOpen, onDesktop, onSelect, highlightKey }) {
  const current = DEVICES.find((item) => item.id === device) || DEVICES[1]
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex w-full max-w-[336px] flex-wrap items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-900/70 p-1.5" role="toolbar" aria-label="Controles de la vista previa">
        <div role="radiogroup" aria-label="Tamaño de móvil" className="flex flex-1 rounded-lg bg-gray-950/60 p-0.5">
          {DEVICES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={device === item.id}
              title={`${item.label} · ${item.width}×${item.height}`}
              onClick={() => onDevice(item.id)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[11px] ${device === item.id ? 'bg-gray-800 font-semibold text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Icon name="smartphone" size={item.id === 'small' ? 11 : item.id === 'large' ? 15 : 13} />
              {item.width}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => onDesktop(true)} title="Vista de escritorio (1280×800)" className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 hover:text-white">
          <Icon name="monitor" size={14} /> Escritorio
        </button>
        {business.autoTheme && (
          <div role="radiogroup" aria-label="Modo del sistema" className="flex w-full rounded-lg bg-gray-950/60 p-0.5">
            {[['light', 'sun', 'Modo claro'], ['dark', 'moon', 'Modo oscuro']].map(([value, icon, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={scheme === value}
                onClick={() => onScheme(value)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] ${scheme === value ? 'bg-gray-800 font-semibold text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Icon name={icon} size={13} /> {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <PhoneMockup business={business} device={current} scheme={business.autoTheme ? scheme : undefined} onSelect={onSelect} highlightKey={highlightKey} />

      {desktopOpen && (
        <DesktopPreview
          business={business}
          scheme={business.autoTheme ? scheme : undefined}
          onClose={() => onDesktop(false)}
          onSelect={(target) => { onDesktop(false); onSelect(target) }}
          highlightKey={highlightKey}
        />
      )}
    </div>
  )
}
