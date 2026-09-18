import { Routes, Route, Link } from 'react-router-dom'
import PublicProfile from './pages/PublicProfile.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import NotFound from './pages/NotFound.jsx'

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-clickclick-dark text-white p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-clickclick-dark border-2 border-clickclick-orange flex items-center justify-center mb-6">
        <div className="w-6 h-6 rounded-full bg-clickclick-orange" />
      </div>
      <h1 className="text-4xl font-bold text-clickclick-orange">ClickClick Go</h1>
      <p className="mt-3 text-gray-300">Conecta tu negocio con un toque</p>
      <Link
        to="/admin"
        className="mt-8 px-5 py-2.5 rounded-xl bg-clickclick-orange text-clickclick-dark font-semibold"
      >
        Panel de administración
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/:slug" element={<PublicProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
