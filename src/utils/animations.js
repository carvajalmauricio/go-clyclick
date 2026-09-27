// Catálogo compartido por el editor, el perfil y la validación al guardar.
export const ANIMATION_OPTIONS = [
  { value: 'none', label: 'Ninguna', description: 'El botón permanece estático.', className: '' },
  { value: 'pulse', label: 'Pulso', description: 'Aumenta y reduce suavemente el tamaño.', className: 'profile-action-pulse' },
  { value: 'bounce', label: 'Flotar', description: 'Sube y baja sin cambiar de tamaño.', className: 'profile-action-bounce' },
  { value: 'glow', label: 'Brillo', description: 'Ilumina el contorno sin mover el botón.', className: 'profile-action-glow' },
]

export function normalizeAnimation(value) {
  return ANIMATION_OPTIONS.some((option) => option.value === value) ? value : 'none'
}

export function animationClass(value) {
  return ANIMATION_OPTIONS.find((option) => option.value === value)?.className || ''
}
