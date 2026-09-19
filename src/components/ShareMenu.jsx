import { useEffect, useState } from 'react'
import { Icon } from './Icons.jsx'
import { generatePngDataUrl, downloadDataUrl, profileUrl } from '../utils/qrGenerator.js'

export default function ShareMenu({ business, theme, compact = false }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qr, setQr] = useState('')
  const url = profileUrl(business.slug)

  useEffect(() => {
    if (!open || qr) return
    generatePngDataUrl(url, { size: 640, logoUrl: business.logo }).then(setQr).catch(() => {})
  }, [open, qr, url, business.logo])

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: business.name, text: business.description || business.name, url })
        return
      } catch (error) {
        if (error?.name === 'AbortError') return
      }
    }
    setOpen(true)
  }

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <button
        type="button"
        onClick={share}
        aria-label="Compartir perfil"
        className={`absolute z-20 flex items-center justify-center rounded-full backdrop-blur-md transition hover:scale-105 ${compact ? 'right-3 top-3 h-9 w-9' : 'right-5 top-5 h-11 w-11'}`}
        style={{ background: `${theme.card}dd`, color: theme.text, border: `1px solid ${theme.border}` }}
      >
        <Icon name="share" size={compact ? 17 : 20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-sm rounded-[1.75rem] bg-white p-5 text-gray-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Compartir {business.name}</h2>
                <p className="mt-1 text-xs text-gray-500">Escanea, copia o envía este perfil.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="h-9 w-9 rounded-full bg-gray-100 text-xl">&times;</button>
            </div>

            <div className="mx-auto mt-5 w-48 rounded-2xl border border-gray-200 bg-white p-3">
              {qr ? <img src={qr} alt={`QR de ${business.name}`} className="h-full w-full" /> : <div className="aspect-square animate-pulse rounded-xl bg-gray-100" />}
            </div>

            <button type="button" onClick={copy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white">
              <Icon name="copy" size={18} /> {copied ? 'Enlace copiado' : 'Copiar enlace'}
            </button>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${business.name} ${url}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-3 font-semibold text-white"
              >
                <Icon name="whatsapp" size={18} /> WhatsApp
              </a>
              <button
                type="button"
                disabled={!qr}
                onClick={() => qr && downloadDataUrl(qr, `qr-${business.slug}.png`)}
                className="rounded-xl border border-gray-200 px-3 py-3 font-semibold disabled:opacity-40"
              >
                Descargar QR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
