import { Component, Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import PublicProfile from './pages/PublicProfile.jsx'
import NotFound from './pages/NotFound.jsx'

// Tras un despliegue, una pestaña abierta antes pide archivos que ya no
// existen: se recarga una vez para obtener la versión nueva.
function lazyWithReload(load) {
  return lazy(() => load().then((module) => {
    try { sessionStorage.removeItem('clyclick:chunk-reload') } catch { /* ignore */ }
    return module
  }).catch((error) => {
    try {
      if (!sessionStorage.getItem('clyclick:chunk-reload')) {
        sessionStorage.setItem('clyclick:chunk-reload', '1')
        window.location.reload()
        return new Promise(() => {})
      }
    } catch { /* Sin sessionStorage: se muestra el error. */ }
    throw error
  }))
}

// La página de inicio y el panel se cargan aparte: quien abre un perfil
// (escaneando un QR) solo descarga el código del perfil.
const Landing = lazyWithReload(() => import('./pages/Landing.jsx'))
const AdminDashboard = lazyWithReload(() => import('./pages/AdminDashboard.jsx'))

function Loading({ label }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-clickclick-dark" role="status" aria-label={label}>
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-clickclick-orange border-t-transparent" />
    </div>
  )
}

class LoadBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-clickclick-dark p-6 text-center text-white">
        <p className="text-lg">No se pudo cargar la página.</p>
        <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-clickclick-orange px-5 py-2.5 font-semibold text-clickclick-dark">Reintentar</button>
      </div>
    )
  }
}

function LazyRoute({ label, children }) {
  return <LoadBoundary><Suspense fallback={<Loading label={label} />}>{children}</Suspense></LoadBoundary>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LazyRoute label="Cargando"><Landing /></LazyRoute>} />
      <Route path="/admin" element={<LazyRoute label="Cargando el panel"><AdminDashboard /></LazyRoute>} />
      <Route path="/:slug" element={<PublicProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
