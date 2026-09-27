// Elige el idioma de la puerta de edad. La puerta aparece antes de que exista
// el selector de idioma del perfil, así que respeta el idioma del visitante:
// usa 'en' solo si está entre los idiomas habilitados del negocio y el
// navegador prefiere inglés; en cualquier otro caso usa el idioma por defecto
// del perfil ('es', o 'en' si es el único configurado). Sin coincidencias, 'es'.
// Helper puro (solo lee navigator.language si existe) para testearlo aislado.
export function pickGateLanguage(languages) {
  const enabled = Array.isArray(languages) ? languages.filter((l) => l === 'es' || l === 'en') : []
  const hasEs = enabled.includes('es')
  const hasEn = enabled.includes('en')
  if (hasEn && !hasEs) return 'en'
  if (hasEn && typeof navigator !== 'undefined') {
    const prefers = String(navigator.language || '').toLowerCase()
    if (prefers.startsWith('en')) return 'en'
  }
  return 'es'
}
