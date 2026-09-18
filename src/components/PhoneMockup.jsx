import ProfileView from './ProfileView.jsx'

// Simulador de smartphone que muestra el perfil en vivo mientras se edita.
export default function PhoneMockup({ business }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative rounded-[2.5rem] bg-black p-3 shadow-2xl"
        style={{ width: 320, height: 660 }}
      >
        {/* Notch */}
        <div className="absolute left-1/2 -translate-x-1/2 top-3 w-28 h-6 bg-black rounded-b-2xl z-10" />
        {/* Pantalla */}
        <div className="w-full h-full rounded-[2rem] overflow-hidden overflow-y-auto bg-white">
          <ProfileView business={business} compact />
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400">Vista previa en vivo</p>
    </div>
  )
}
