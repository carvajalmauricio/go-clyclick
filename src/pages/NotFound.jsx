import { Link } from 'react-router-dom'

export default function NotFound({ slug }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-clickclick-dark text-white p-6 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-clickclick-orange">Negocio no encontrado</h1>
      <p className="mt-3 text-gray-400 max-w-sm">
        {slug ? (
          <>No existe un negocio con el enlace <span className="font-mono text-gray-200">/{slug}</span>.</>
        ) : (
          <>La página que buscas no existe.</>
        )}
      </p>
      <Link
        to="/"
        className="mt-6 px-5 py-2.5 rounded-xl bg-clickclick-orange text-clickclick-dark font-semibold"
      >
        Ir al inicio
      </Link>
      <div className="mt-10 text-xs text-gray-600">Powered by ClickClick</div>
    </div>
  )
}
