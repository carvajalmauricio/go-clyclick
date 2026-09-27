import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ProfileView from '../components/ProfileView.jsx'
import AgeGate from '../components/AgeGate.jsx'
import NotFound from './NotFound.jsx'
import { shouldAdoptFresh } from '../utils/reconcileBusiness.js'

// Re-exporta el helper puro para compatibilidad con importadores previos.
export { shouldAdoptFresh }

// Lee el negocio incrustado en el HTML (window.__BUSINESS__) solo si su slug
// coincide con la ruta actual. Así una navegación posterior dentro de la SPA
// hacia otro slug no reutiliza por error el dato del primer perfil.
function readInlinedBusiness(slug) {
  if (typeof window === 'undefined') return null
  const inlined = window.__BUSINESS__
  if (inlined && typeof inlined === 'object' && inlined.slug === slug) return inlined
  return null
}

// Lee la config ligera de la puerta de edad incrustada en el HTML
// (window.__AGE_GATE__). Para perfiles con puerta de edad el servidor NO
// incrusta el negocio completo; en su lugar deja solo esta config no sensible
// (tema, idiomas y textos de la puerta) para poder pintar la puerta al instante
// y diferir la carga del negocio completo hasta que el visitante confirme.
function readInlinedGate(slug) {
  if (typeof window === 'undefined') return null
  const hint = window.__AGE_GATE__
  if (hint && typeof hint === 'object' && hint.slug === slug && hint.ageGate?.enabled === true) return hint
  return null
}

// ¿El visitante ya confirmó la edad de este slug en la sesión actual? (misma
// clave que usa AgeGate). Si es así, el negocio completo se puede cargar sin
// mostrar de nuevo la puerta.
function gateAlreadyConfirmed(slug) {
  try {
    return typeof window !== 'undefined' && window.sessionStorage?.getItem(`clyclick:agegate:${slug}`) === '1'
  } catch {
    return false
  }
}

export default function PublicProfile() {
  const { slug } = useParams()
  // Estado inicial perezoso:
  //   - Si el perfil completo viene incrustado para este slug, pintamos al
  //     instante (sin skeleton ni fetch).
  //   - Si viene la config de puerta de edad (perfil gated), mostramos la
  //     puerta al instante con esa config ligera y NO pedimos el negocio
  //     completo hasta que el visitante confirme la edad. Así ningún dato
  //     sensible viaja al cliente antes de la confirmación.
  //   - En Vite dev o navegación SPA (sin dato incrustado) usamos fetch.
  const [state, setState] = useState(() => {
    const inlined = readInlinedBusiness(slug)
    if (inlined) return { status: 'ready', business: inlined }
    const gate = readInlinedGate(slug)
    if (gate) return { status: 'gated', business: gate }
    return { status: 'loading', business: null }
  })

  useEffect(() => {
    let active = true
    const inlined = readInlinedBusiness(slug)
    if (inlined) {
      // Pintado instantáneo desde el dato incrustado. Para no servir datos
      // obsoletos si una capa de caché reprodujo un HTML viejo, revalidamos en
      // segundo plano contra la API y actualizamos el estado solo si difiere.
      setState({ status: 'ready', business: inlined })
      fetch(`/api/business/${encodeURIComponent(slug)}`)
        .then(async (res) => {
          if (!active || !res.ok) return
          const fresh = await res.json()
          // Reconciliación barata: comparamos la serialización. Si el servidor
          // devuelve algo distinto al snapshot incrustado, adoptamos lo fresco.
          if (shouldAdoptFresh(fresh, inlined, slug)) {
            setState({ status: 'ready', business: fresh })
          }
        })
        .catch(() => {
          // Fallo de red en la revalidación: mantenemos el pintado instantáneo.
        })
      return () => {
        active = false
      }
    }

    // Perfil con puerta de edad incrustada: NO pedimos el negocio completo aún.
    // La carga se difiere a confirmGate(), que se dispara al confirmar la edad.
    // Excepción: si el visitante ya confirmó en esta sesión, la puerta no vuelve
    // a mostrarse, así que cargamos el negocio completo de una vez.
    if (readInlinedGate(slug)) {
      if (gateAlreadyConfirmed(slug)) {
        setState({ status: 'loading', business: null })
        fetch(`/api/business/${encodeURIComponent(slug)}`)
          .then(async (res) => {
            if (!active) return
            if (res.status === 404) {
              setState({ status: 'notfound', business: null })
              return
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            setState({ status: 'ready', business: data })
          })
          .catch(() => {
            if (active) setState({ status: 'error', business: null })
          })
        return () => {
          active = false
        }
      }
      setState({ status: 'gated', business: readInlinedGate(slug) })
      return () => {
        active = false
      }
    }

    setState({ status: 'loading', business: null })

    fetch(`/api/business/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!active) return
        if (res.status === 404) {
          setState({ status: 'notfound', business: null })
          return
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setState({ status: 'ready', business: data })
      })
      .catch(() => {
        if (active) setState({ status: 'error', business: null })
      })

    return () => {
      active = false
    }
  }, [slug])

  // Se ejecuta cuando el visitante confirma la edad en la puerta incrustada.
  // Recién ahí pedimos el negocio completo a la API pública.
  function confirmGate() {
    fetch(`/api/business/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (res.status === 404) {
          setState({ status: 'notfound', business: null })
          return
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setState({ status: 'ready', business: data })
      })
      .catch(() => {
        setState({ status: 'error', business: null })
      })
  }

  if (state.status === 'gated') {
    // Puerta de edad pintada desde la config ligera. Al confirmar se dispara
    // confirmGate() (carga diferida) y el estado pasa a 'ready'. Mientras la
    // carga está en curso, AgeGate ya está confirmada, así que revela children,
    // que muestra el skeleton hasta que llega el negocio completo.
    return (
      <AgeGate business={state.business} onConfirm={confirmGate}>
        <ProfileSkeleton />
      </AgeGate>
    )
  }

  if (state.status === 'loading') return <ProfileSkeleton />
  if (state.status === 'notfound') return <NotFound slug={slug} />
  if (state.status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-clickclick-dark text-white p-6 text-center">
        <p className="text-lg">No se pudo cargar el perfil.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-5 py-2.5 rounded-xl bg-clickclick-orange text-clickclick-dark font-semibold"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <AgeGate business={state.business}>
      <ProfileView business={state.business} />
    </AgeGate>
  )
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-clickclick-dark px-6 py-10">
      <div className="w-full max-w-md flex flex-col items-center animate-pulse">
        <div className="rounded-full bg-gray-700/50" style={{ width: 104, height: 104 }} />
        <div className="mt-4 h-6 w-40 rounded bg-gray-700/50" />
        <div className="mt-2 h-4 w-24 rounded bg-gray-700/40" />
        <div className="w-full mt-6 flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-full rounded-xl bg-gray-700/40" />
          ))}
        </div>
      </div>
    </div>
  )
}
