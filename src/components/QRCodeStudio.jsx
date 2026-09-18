import { useEffect, useState } from 'react'
import {
  profileUrl,
  generatePngDataUrl,
  generateSvgString,
  downloadDataUrl,
  downloadString,
} from '../utils/qrGenerator.js'

// Estudio de generación de QR para un negocio.
export default function QRCodeStudio({ business }) {
  const url = profileUrl(business.slug)
  const [dark, setDark] = useState('#0f0f12')
  const [light, setLight] = useState('#ffffff')
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)

  // Preview a resolución baja para la pantalla
  useEffect(() => {
    let active = true
    generatePngDataUrl(url, { size: 512, dark, light, logoUrl: business.logo })
      .then((d) => active && setPreview(d))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [url, dark, light, business.logo])

  async function downloadPng() {
    setBusy(true)
    try {
      const d = await generatePngDataUrl(url, { size: 2048, dark, light, logoUrl: business.logo })
      downloadDataUrl(d, `qr-${business.slug}.png`)
    } finally {
      setBusy(false)
    }
  }

  async function downloadSvg() {
    setBusy(true)
    try {
      const svg = await generateSvgString(url, { dark, light })
      downloadString(svg, `qr-${business.slug}.svg`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white rounded-2xl p-4 shadow-lg">
        {preview ? (
          <img src={preview} alt="QR" style={{ width: 240, height: 240 }} />
        ) : (
          <div style={{ width: 240, height: 240 }} className="flex items-center justify-center text-gray-400">
            Generando...
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 break-all text-center max-w-xs">{url}</p>

      <div className="flex gap-4 text-xs">
        <label className="flex flex-col items-center gap-1 text-gray-400">
          Color
          <input type="color" value={dark} onChange={(e) => setDark(e.target.value)} className="h-9 w-14 rounded cursor-pointer bg-transparent" />
        </label>
        <label className="flex flex-col items-center gap-1 text-gray-400">
          Fondo
          <input type="color" value={light} onChange={(e) => setLight(e.target.value)} className="h-9 w-14 rounded cursor-pointer bg-transparent" />
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={downloadPng}
          disabled={busy}
          className="rounded-lg bg-clickclick-orange text-clickclick-dark font-semibold px-4 py-2 text-sm disabled:opacity-50"
        >
          Descargar PNG (2048px)
        </button>
        <button
          onClick={downloadSvg}
          disabled={busy}
          className="rounded-lg bg-gray-700 text-white font-semibold px-4 py-2 text-sm disabled:opacity-50"
        >
          Descargar SVG
        </button>
      </div>
    </div>
  )
}
