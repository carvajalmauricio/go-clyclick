// Helper compartido de portapapeles y de compartir enlaces.
// Centraliza la lógica que antes estaba duplicada en ShareMenu.jsx y
// BankAccountDialog.jsx, para que todo el perfil use el mismo comportamiento.

// Copia `text` al portapapeles. Devuelve true si tuvo éxito, false si no.
// Intenta primero navigator.clipboard.writeText y cae a un fallback con
// execCommand('copy') sobre un <textarea> temporal (para navegadores/HTTP sin
// permiso de Clipboard API). Nunca lanza.
export async function copyText(text) {
  const value = String(text ?? '')
  if (!value) return false
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // Continúa al fallback.
  }
  return legacyCopy(value)
}

// Fallback sin Clipboard API: crea un <textarea> fuera de pantalla, lo
// selecciona y ejecuta document.execCommand('copy'). Devuelve true si copió.
function legacyCopy(value) {
  if (typeof document === 'undefined') return false
  try {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

// Comparte un enlace usando la Web Share API cuando existe; si no, o si el
// usuario cancela sin éxito, cae a copiar la URL al portapapeles.
// Devuelve { shared, copied }:
//   - shared: true si se abrió el diálogo nativo de compartir con éxito.
//   - copied: true si (sin poder compartir) se copió el enlace como respaldo.
// Un AbortError (usuario cierra el diálogo) no dispara el fallback de copia.
export async function shareLink({ title, text, url }) {
  const link = String(url ?? '')
  if (!link) return { shared: false, copied: false }
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url: link })
      return { shared: true, copied: false }
    } catch (error) {
      if (error?.name === 'AbortError') return { shared: false, copied: false }
      // Cualquier otro error: intenta copiar como respaldo.
    }
  }
  const copied = await copyText(link)
  return { shared: false, copied }
}
