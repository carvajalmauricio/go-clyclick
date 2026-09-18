import { useEffect, useState } from 'react'
import { profileUrl, generatePngDataUrl } from '../utils/qrGenerator.js'

const PRESET_PHRASES = [
  '¿Te encantó tu experiencia hoy? Califícanos en Google',
  'Escanea para ver nuestro menú y promociones',
  'Síguenos y déjanos tu reseña',
  'Escanea y conéctate con nosotros',
]

// Cartel de mesa imprimible (A6/A5) con QR grande.
export default function PrintableDisplay({ business }) {
  const url = profileUrl(business.slug)
  const [phrase, setPhrase] = useState(PRESET_PHRASES[0])
  const [size, setSize] = useState('a6') // 'a6' | 'a5'
  const [qr, setQr] = useState('')

  useEffect(() => {
    let active = true
    generatePngDataUrl(url, { size: 1024, dark: '#0f0f12', light: '#ffffff', logoUrl: business.logo })
      .then((d) => active && setQr(d))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [url, business.logo])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Controles (no se imprimen) */}
      <div className="no-print w-full max-w-md flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-400">
          Frase gancho
          <select
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            className="rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-white"
          >
            {PRESET_PHRASES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <input
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          className="rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-white text-sm"
          placeholder="O escribe tu propia frase"
        />
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-400 text-xs">Tamaño:</span>
          {['a6', 'a5'].map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`px-3 py-1.5 rounded-lg ${size === s ? 'bg-clickclick-orange text-clickclick-dark' : 'bg-gray-700 text-white'}`}
            >
              {s.toUpperCase()}
            </button>
          ))}
          <button
            onClick={() => window.print()}
            className="ml-auto rounded-lg bg-clickclick-orange text-clickclick-dark font-semibold px-4 py-1.5"
          >
            Imprimir
          </button>
        </div>
      </div>

      {/* El cartel imprimible */}
      <div className={`print-area tent-card tent-${size}`}>
        <div className="tent-inner">
          {business.logo ? (
            <img src={business.logo} alt={business.name} className="tent-logo" />
          ) : (
            <div className="tent-logo-fallback">{(business.name || '?').slice(0, 2).toUpperCase()}</div>
          )}
          <h2 className="tent-name">{business.name}</h2>
          <p className="tent-phrase">{phrase}</p>
          {qr && <img src={qr} alt="QR" className="tent-qr" />}
          <p className="tent-cta">Escanea con la cámara de tu teléfono</p>
          <p className="tent-footer">Powered by ClickClick</p>
        </div>
      </div>
    </div>
  )
}
