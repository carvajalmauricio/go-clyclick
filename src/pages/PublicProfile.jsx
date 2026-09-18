import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ProfileView from '../components/ProfileView.jsx'
import NotFound from './NotFound.jsx'

export default function PublicProfile() {
  const { slug } = useParams()
  const [state, setState] = useState({ status: 'loading', business: null })

  useEffect(() => {
    let active = true
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

  return <ProfileView business={state.business} />
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
