import { createContext, useContext } from 'react'

// Contexto del perfil renderizado:
// - portalTarget: dónde se montan las ventanas (el body en la página pública o
//   la pantalla del simulador en el admin, para que no se salgan del teléfono);
// - wide: diseño de escritorio (panel centrado, ventanas centradas);
// - embedded: dentro del simulador (no bloquea el scroll de la página);
// - fontFamily: fuente del perfil, para que las ventanas la hereden.
export const ProfileContext = createContext({ portalTarget: null, wide: false, embedded: false, fontFamily: undefined })

export function useProfileContext() {
  return useContext(ProfileContext)
}
