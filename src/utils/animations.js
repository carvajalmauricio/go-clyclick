// Catálogo compartido por el editor, el perfil y la validación al guardar.
// `inner: true` indica que la clase se aplica al propio botón (y no a su
// contenedor) porque el efecto debe quedar recortado dentro de sus bordes.
export const ANIMATION_OPTIONS = [
  { value: 'none', label: 'Ninguna', description: 'El botón permanece estático.', className: '' },
  { value: 'pulse', label: 'Pulso', description: 'Aumenta y reduce suavemente el tamaño.', className: 'profile-action-pulse' },
  { value: 'bounce', label: 'Flotar', description: 'Sube y baja sin cambiar de tamaño.', className: 'profile-action-bounce' },
  { value: 'glow', label: 'Brillo', description: 'Ilumina el contorno sin mover el botón.', className: 'profile-action-glow' },
  { value: 'shine', label: 'Destello', description: 'Un reflejo de luz cruza el botón cada pocos segundos.', className: 'profile-action-shine', inner: true },
  { value: 'heartbeat', label: 'Latido', description: 'Doble latido rápido seguido de una pausa.', className: 'profile-action-heartbeat' },
  { value: 'shake', label: 'Vibrar', description: 'Vibra de lado a lado para llamar la atención y luego descansa.', className: 'profile-action-shake' },
  { value: 'jelly', label: 'Gelatina', description: 'Se estira y rebota como gelatina de vez en cuando.', className: 'profile-action-jelly' },
]

export function normalizeAnimation(value) {
  return ANIMATION_OPTIONS.some((option) => option.value === value) ? value : 'none'
}

function find(value) {
  return ANIMATION_OPTIONS.find((option) => option.value === value)
}

// Clase para el contenedor del botón (efectos que mueven o iluminan el botón).
export function animationClass(value) {
  const option = find(value)
  return option && !option.inner ? option.className : ''
}

// Clase para el propio botón (efectos recortados dentro del botón).
export function innerAnimationClass(value) {
  const option = find(value)
  return option?.inner ? option.className : ''
}
