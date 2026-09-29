import { useState } from 'react'
import ProfileView from './ProfileView.jsx'
import { isLightColor, themeColor } from '../utils/themes.js'

// Tamaños lógicos de móviles reales. El perfil se renderiza a ese ancho real y
// se escala con `zoom`, así el preview muestra los mismos tamaños, saltos de
// línea y proporciones que verá el visitante en su teléfono.
export const DEVICES = [
  { id: 'small', label: 'Pequeño', width: 360, height: 780 },
  { id: 'standard', label: 'Estándar', width: 390, height: 844 },
  { id: 'large', label: 'Grande', width: 430, height: 932 },
]
export const DEVICE_WIDTH = 390
export const DEVICE_HEIGHT = 844
const SCREEN_WIDTH = 316
const BEZEL = 10
const STATUS_BAR = 44
const URL_BAR = 44

// Colores de la barra del navegador: Safari y Chrome la tiñen con theme-color.
export function browserChrome(business, scheme) {
  const background = business.background || {}
  const top = ['image', 'video'].includes(background.type) ? '#111114' : themeColor(business, scheme === 'dark')
  const light = isLightColor(top)
  return light
    ? { bar: top, text: '#111827', field: 'rgba(0,0,0,.07)', muted: '#6b7280' }
    : { bar: top, text: '#f5f5f7', field: 'rgba(255,255,255,.12)', muted: '#a1a1aa' }
}

export function hostLabel(business) {
  return `go.clyclick.online/${business.slug || 'tu-negocio'}`
}

// Simulador de smartphone que muestra el perfil en vivo mientras se edita.
export default function PhoneMockup({ business, device = DEVICES[1], scheme, onSelect, highlightKey }) {
  const [host, setHost] = useState(null)
  const scale = SCREEN_WIDTH / device.width
  const screenHeight = Math.round(device.height * scale)
  const chrome = browserChrome(business, scheme)

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative rounded-[3rem] bg-black shadow-2xl ring-1 ring-gray-700"
        style={{ width: SCREEN_WIDTH + BEZEL * 2, height: screenHeight + BEZEL * 2, padding: BEZEL }}
      >
        {/* Pantalla: todo lo de dentro se dibuja a tamaño real y se escala */}
        <div className="h-full w-full overflow-hidden rounded-[2.4rem]" style={{ background: chrome.bar }}>
          <div
            ref={setHost}
            className="relative flex flex-col"
            // translateZ crea el bloque contenedor de los elementos `fixed`
            // (ventanas Compartir y cuentas) para que no se salgan del teléfono.
            style={{ width: device.width, height: device.height, zoom: scale, transform: 'translateZ(0)' }}
          >
            {/* Barra de estado con Dynamic Island */}
            <div className="relative flex shrink-0 items-center justify-between px-8 text-[15px] font-semibold" style={{ height: STATUS_BAR, color: chrome.text }}>
              <span>9:41</span>
              <span aria-hidden="true" className="absolute left-1/2 top-2.5 h-[30px] w-[118px] -translate-x-1/2 rounded-full bg-black" />
              <StatusIcons color={chrome.text} />
            </div>
            {/* Barra del navegador */}
            <div className="flex shrink-0 items-center px-4 pb-2" style={{ height: URL_BAR }}>
              <div className="flex h-9 w-full items-center justify-center gap-1.5 truncate rounded-xl px-3 text-[14px]" style={{ background: chrome.field, color: chrome.text }}>
                <LockIcon color={chrome.muted} />
                <span className="truncate">{hostLabel(business)}</span>
              </div>
            </div>
            {/* Viewport del navegador: aquí vive el perfil real */}
            <div data-preview-scroller className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {host && <ProfileView business={business} embedded device="mobile" forceScheme={scheme} onSelect={onSelect} highlightKey={highlightKey} portalTarget={host} />}
            </div>
            {/* Indicador de inicio */}
            <div aria-hidden="true" className="pointer-events-none absolute bottom-2 left-1/2 z-[60] h-[5px] w-[134px] -translate-x-1/2 rounded-full" style={{ background: chrome.text, opacity: 0.55 }} />
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-gray-400">
        {device.width}×{device.height} · tamaño real{onSelect ? ' · toca un elemento para editarlo' : ''}
      </p>
    </div>
  )
}

export function LockIcon({ color }) {
  return <svg width="11" height="13" viewBox="0 0 11 13" aria-hidden="true"><path d="M2 6V4a3.5 3.5 0 0 1 7 0v2h.5A1.5 1.5 0 0 1 11 7.5v4A1.5 1.5 0 0 1 9.5 13h-8A1.5 1.5 0 0 1 0 11.5v-4A1.5 1.5 0 0 1 1.5 6H2Zm1.5 0h4V4a2 2 0 0 0-4 0v2Z" fill={color} /></svg>
}

function StatusIcons({ color }) {
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      <svg width="18" height="12" viewBox="0 0 18 12"><g fill={color}><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></g></svg>
      <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.2A10.2 10.2 0 0 0 8 .5C5.2.5 2.7 1.6.8 3.4L2 4.6a8.5 8.5 0 0 1 6-2.4Zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.2-1.2A6.8 6.8 0 0 0 8 3.9c-1.8 0-3.5.7-4.8 1.9L4.4 7c1-.9 2.2-1.4 3.6-1.4Zm0 3.4c-.6 0-1.1.2-1.5.6L8 11.5l1.5-1.9c-.4-.4-.9-.6-1.5-.6Z" fill={color} /></svg>
      <svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke={color} strokeOpacity=".4" /><rect x="2" y="2" width="20" height="9" rx="2" fill={color} /><path d="M25 4.5v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2Z" fill={color} fillOpacity=".4" /></svg>
    </span>
  )
}
