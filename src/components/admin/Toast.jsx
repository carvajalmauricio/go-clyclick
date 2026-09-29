import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Icon } from '../Icons.jsx'

// Avisos flotantes temporales del panel (#3). Se apilan abajo, se cierran solos
// y pueden llevar una acción (p. ej. "Deshacer"). Los errores duran más.
const ToastContext = createContext(null)

const DURATION = { success: 3200, info: 4200, error: 7000 }
const STYLES = {
  success: { icon: 'check', cls: 'border-emerald-700/60 bg-emerald-950/95 text-emerald-100', iconCls: 'text-emerald-400' },
  info: { icon: 'info', cls: 'border-gray-700 bg-gray-900/95 text-gray-100', iconCls: 'text-clickclick-orange' },
  error: { icon: 'info', cls: 'border-red-800/70 bg-red-950/95 text-red-100', iconCls: 'text-red-400' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id))
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
  }, [])

  const show = useCallback((type, message, options = {}) => {
    const id = options.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    // Un aviso con el mismo id reemplaza al anterior (evita duplicados).
    setToasts((list) => [...list.filter((toast) => toast.id !== id), { id, type, message, action: options.action }].slice(-4))
    clearTimeout(timers.current.get(id))
    timers.current.set(id, setTimeout(() => dismiss(id), options.duration || DURATION[type]))
    return id
  }, [dismiss])

  const api = useMemo(() => ({
    success: (message, options) => show('success', message, options),
    info: (message, options) => show('info', message, options),
    error: (message, options) => show('error', message, options),
    dismiss,
  }), [show, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-start lg:px-6">
        {toasts.map((toast) => {
          const style = STYLES[toast.type]
          return (
            <div key={toast.id} role={toast.type === 'error' ? 'alert' : 'status'} className={`admin-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${style.cls}`}>
              <Icon name={style.icon} size={17} className={`mt-0.5 shrink-0 ${style.iconCls}`} />
              <p className="min-w-0 flex-1 leading-snug">{toast.message}</p>
              {toast.action && (
                <button type="button" onClick={() => { toast.action.onClick(); dismiss(toast.id) }} className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold text-clickclick-orange hover:bg-white/10">
                  {toast.action.label}
                </button>
              )}
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Cerrar aviso" className="-mr-1 shrink-0 px-1 text-lg leading-none opacity-60 hover:opacity-100">×</button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return context
}
