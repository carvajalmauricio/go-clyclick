import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import ProfileView from '../ProfileView.jsx'
import { browserChrome, hostLabel, LockIcon } from '../PhoneMockup.jsx'
import { Icon } from '../Icons.jsx'

const DESKTOP = { width: 1280, height: 800 }
const TOOLBAR = 44

// Vista previa de escritorio a pantalla completa: el perfil se dibuja a
// 1280×800 (tamaño real de un portátil) dentro de una ventana de navegador y
// se escala para caber en la pantalla del admin.
export default function DesktopPreview({ business, scheme, onClose, onSelect, highlightKey }) {
  const [host, setHost] = useState(null)
  const [viewport, setViewport] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const scale = Math.min(1, (viewport.w - 48) / DESKTOP.width, (viewport.h - 120) / (DESKTOP.height + TOOLBAR))
  const chrome = browserChrome(business, scheme)

  // Portal al body: el panel del preview es `sticky` (crea su propio contexto
  // de apilamiento) y la cabecera del editor quedaría por encima.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Vista previa de escritorio" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80 p-6 backdrop-blur-sm" onClick={onClose}>
      <div className="flex w-full items-center justify-between text-sm text-gray-300" style={{ maxWidth: DESKTOP.width * scale }} onClick={(event) => event.stopPropagation()}>
        <span>Escritorio · {DESKTOP.width}×{DESKTOP.height} (escala {Math.round(scale * 100)} %)</span>
        <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs hover:border-gray-500">Cerrar <kbd className="rounded bg-gray-800 px-1 text-[10px]">Esc</kbd></button>
      </div>
      <div
        className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-gray-700"
        style={{ width: DESKTOP.width * scale, height: (DESKTOP.height + TOOLBAR) * scale }}
        onClick={(event) => event.stopPropagation()}
      >
        <div ref={setHost} className="relative flex flex-col" style={{ width: DESKTOP.width, height: DESKTOP.height + TOOLBAR, zoom: scale, transform: 'translateZ(0)' }}>
          <div className="flex shrink-0 items-center gap-3 px-4" style={{ height: TOOLBAR, background: chrome.bar, color: chrome.text }}>
            <span className="flex gap-1.5" aria-hidden="true">{['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />)}</span>
            <div className="mx-auto flex h-7 w-[420px] items-center justify-center gap-1.5 rounded-lg text-[13px]" style={{ background: chrome.field }}>
              <LockIcon color={chrome.muted} /> {hostLabel(business)}
            </div>
            <Icon name="share" size={16} className="opacity-50" />
          </div>
          <div data-preview-scroller className="relative min-h-0 flex-1 overflow-y-auto">
            {host && <ProfileView business={business} embedded device="desktop" forceScheme={scheme} onSelect={onSelect} highlightKey={highlightKey} portalTarget={host} />}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
