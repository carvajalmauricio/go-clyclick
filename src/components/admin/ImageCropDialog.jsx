import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { centeredOffset, clampOffset, coverScale, cropToFile, formatBytes, loadImage, outputSize, sourceRect, zoomAround } from '../../utils/image.js'
import { Icon } from '../Icons.jsx'
import { Spinner } from './ui.jsx'

const MAX_ZOOM = 4

// Recorte con arrastre y zoom. Devuelve un File comprimido (WebP cuando el
// navegador lo permite) del tamaño definido por el preset.
export default function ImageCropDialog({ file, preset, onCancel, onConfirm }) {
  const [src, setSrc] = useState('')
  const [img, setImg] = useState(null)
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [busy, setBusy] = useState(false)
  const drag = useRef(null)

  const view = useMemo(() => {
    const max = preset.aspect >= 2 ? 460 : 320
    const width = Math.min(max, (typeof window !== 'undefined' ? window.innerWidth : 400) - 72)
    return { width, height: Math.round(width / preset.aspect) }
  }, [preset.aspect])

  const natural = img ? { width: img.naturalWidth, height: img.naturalHeight } : null
  const base = natural ? coverScale(natural, view) : 1
  const scale = base * zoom

  // La URL se crea y revoca dentro del mismo efecto (seguro en StrictMode).
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  useEffect(() => {
    if (!src) return
    let active = true
    loadImage(src).then((loaded) => {
      if (!active) return
      setImg(loaded)
      const n = { width: loaded.naturalWidth, height: loaded.naturalHeight }
      setOffset(centeredOffset(n, view, coverScale(n, view)))
    }).catch((err) => active && setError(err.message))
    return () => { active = false }
  }, [src, view])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') { event.stopPropagation(); onCancel() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onCancel])

  function setZoomLevel(value) {
    if (!natural) return
    const next = Math.min(MAX_ZOOM, Math.max(1, value))
    setOffset((current) => zoomAround(current, natural, view, scale, base * next))
    setZoom(next)
  }

  function onPointerDown(event) {
    if (!natural) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, start: offset }
  }
  function onPointerMove(event) {
    const state = drag.current
    if (!state) return
    setOffset(clampOffset({ x: state.start.x + event.clientX - state.x, y: state.start.y + event.clientY - state.y }, natural, view, scale))
  }
  function onKeyDown(event) {
    const step = event.shiftKey ? 20 : 6
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
    if (moves[event.key] && natural) {
      event.preventDefault()
      setOffset((current) => clampOffset({ x: current.x + moves[event.key][0], y: current.y + moves[event.key][1] }, natural, view, scale))
    }
    if (event.key === '+' || event.key === '=') setZoomLevel(zoom + 0.2)
    if (event.key === '-') setZoomLevel(zoom - 0.2)
  }

  async function confirm() {
    if (!img) return
    setBusy(true)
    try {
      onConfirm(await cropToFile(img, sourceRect(offset, view, scale), preset, file))
    } catch {
      setError('No se pudo recortar la imagen. Prueba con otra o súbela sin recortar.')
      setBusy(false)
    }
  }

  const out = natural ? outputSize(sourceRect(offset, view, scale), preset) : null
  const lowRes = out && out.width < preset.width * 0.5

  // Portal al body: fuera de las filas `draggable` de los gestores (arrastrar
  // para encuadrar no debe arrastrar la fila) y de sus contextos de apilamiento.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={preset.title} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-900 p-5 text-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center gap-2">
          <Icon name="crop" size={18} className="text-clickclick-orange" />
          <h2 className="flex-1 font-semibold">{preset.title}</h2>
          <button type="button" onClick={onCancel} aria-label="Cancelar" className="px-1 text-xl leading-none text-gray-400 hover:text-white">×</button>
        </div>

        <div
          tabIndex={0}
          aria-label="Área de recorte. Arrastra o usa las flechas para mover; + y - para el zoom."
          className="relative mx-auto touch-none select-none overflow-hidden rounded-lg bg-gray-800 outline-none ring-clickclick-orange focus-visible:ring-2"
          style={{ width: view.width, height: view.height, cursor: drag.current ? 'grabbing' : 'grab' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => { drag.current = null }}
          onPointerCancel={() => { drag.current = null }}
          onWheel={(event) => setZoomLevel(zoom - event.deltaY * 0.0015)}
          onKeyDown={onKeyDown}
        >
          {img ? (
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left"
              style={{ width: natural.width * scale, height: natural.height * scale, transform: `translate(${offset.x}px, ${offset.y}px)` }}
            />
          ) : !error && <div className="flex h-full items-center justify-center text-gray-400"><Spinner /></div>}
          {/* Guía: círculo para logos y slides; cuadrícula de tercios en el resto. */}
          {preset.shape === 'circle' ? (
            <>
              <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle closest-side, transparent 99%, rgba(0,0,0,.6) 100%)' }} />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-inset ring-white/80" />
            </>
          ) : (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(90deg, transparent 33.1%, #fff 33.3%, transparent 33.5%, transparent 66.5%, #fff 66.7%, transparent 66.9%), linear-gradient(transparent 33.1%, #fff 33.3%, transparent 33.5%, transparent 66.5%, #fff 66.7%, transparent 66.9%)' }} />
          )}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/30" />
        </div>

        <label className="mt-4 flex items-center gap-3 text-xs text-gray-400">
          <span>Zoom</span>
          <input type="range" min="1" max={MAX_ZOOM} step="0.01" value={zoom} onChange={(event) => setZoomLevel(Number(event.target.value))} className="flex-1 accent-clickclick-orange" disabled={!img} />
          <span className="w-10 text-right tabular-nums">{Math.round(zoom * 100)} %</span>
        </label>
        <p className="mt-2 text-[11px] text-gray-500">
          Arrastra para encuadrar. {out && <>Se guardará a {out.width}×{out.height} px en formato ligero (original: {formatBytes(file.size)}).</>}
        </p>
        {lowRes && <p className="mt-1 text-[11px] text-amber-300">La imagen tiene poca resolución para este uso; puede verse borrosa.</p>}
        {error && <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={() => onConfirm(file)} disabled={busy} className="mr-auto text-xs text-gray-400 underline hover:text-white disabled:opacity-40">Subir sin recortar</button>
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:border-gray-500">Cancelar</button>
          <button type="button" onClick={confirm} disabled={!img || busy} className="inline-flex items-center gap-2 rounded-lg bg-clickclick-orange px-4 py-2 text-sm font-semibold text-clickclick-dark hover:brightness-110 disabled:opacity-50">
            {busy && <Spinner />} Recortar y subir
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
