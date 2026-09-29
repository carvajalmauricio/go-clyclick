import { useEffect, useState } from 'react'
import { Icon } from './Icons.jsx'
import { generatePngDataUrl, downloadDataUrl, profileUrl } from '../utils/qrGenerator.js'
import { copyText, shareLink } from '../utils/clipboard.js'
import { cardTextColor } from '../utils/themes.js'
import ProfileSheet, { SheetButton } from './ProfileSheet.jsx'

export default function ShareMenu({ business, theme, compact = false, className = '' }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qr, setQr] = useState('')
  const url = profileUrl(business.slug)

  const [qrError, setQrError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setQr('')
    setQrError('')
    if (open) generatePngDataUrl(url, { size: 640, logoUrl: business.logo })
      .then((value) => { if (active) setQr(value) })
      .catch(() => { if (active) setQrError('No se pudo generar el QR.') })
    return () => { active = false }
  }, [open, url, business.logo, retry])

  async function share() {
    await shareLink({ title: business.name, text: business.description || business.name, url })
  }

  async function copy() {
    const ok = await copyText(url)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Compartir perfil"
        data-preview-ignore
        className={`profile-press absolute z-20 flex items-center justify-center rounded-full backdrop-blur-md ${compact ? 'right-3 top-3 h-9 w-9' : 'right-5 top-5 h-11 w-11'} ${className}`}
        style={{ background: `color-mix(in srgb, ${theme.card} 87%, transparent)`, color: cardTextColor(theme), border: `1px solid ${theme.border}` }}
      >
        <Icon name="share" size={compact ? 17 : 20} />
      </button>

      {open && (
        <ProfileSheet
          theme={theme}
          title={`Compartir ${business.name || 'perfil'}`}
          subtitle="Escanea, copia o envía este perfil."
          closeLabel="Cerrar compartir"
          onClose={() => setOpen(false)}
        >
          {(colors) => (
            <>
              {/* El QR se mantiene en blanco y negro para que siempre se pueda escanear. */}
              <div className="mx-auto mt-2 w-48 rounded-2xl bg-white p-3 shadow-sm" style={{ border: `1px solid ${colors.border}` }}>
                {qr ? <img src={qr} alt={`QR de ${business.name}`} width={168} height={168} className="h-full w-full" /> : <div className="aspect-square animate-pulse rounded-xl bg-gray-100" />}
              </div>

              {qrError && <p role="alert" className="mt-3 text-center text-sm">{qrError} <button type="button" className="underline" onClick={() => setRetry((value) => value + 1)}>Reintentar</button></p>}
              <SheetButton colors={colors} onClick={copy} className="mt-5">
                <Icon name="copy" size={18} /> {copied ? 'Enlace copiado' : 'Copiar enlace'}
              </SheetButton>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${business.name} ${url}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="profile-press flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-3 text-sm font-semibold text-white"
                >
                  <Icon name="whatsapp" size={18} /> WhatsApp
                </a>
                <SheetButton colors={colors} variant="secondary" disabled={!qr} onClick={() => qr && downloadDataUrl(qr, `qr-${business.slug}.png`)}>
                  Descargar QR
                </SheetButton>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <SheetButton colors={colors} variant="secondary" onClick={share} className="col-span-2">
                    <Icon name="share" size={18} /> Más opciones para compartir
                  </SheetButton>
                )}
              </div>
            </>
          )}
        </ProfileSheet>
      )}
    </>
  )
}
