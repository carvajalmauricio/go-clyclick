// Historial de cambios del editor para deshacer / rehacer (#4).
// Los cambios rápidos sobre los mismos campos (escribir en un input, mover un
// selector de color) se agrupan en un solo paso mientras no pasen más de
// `COALESCE_MS` desde el inicio del grupo: Ctrl+Z no deshace letra por letra,
// pero tampoco un párrafo entero escrito de corrido.

export const HISTORY_LIMIT = 100
export const COALESCE_MS = 1500

export function createHistory(present) {
  return { past: [], present, future: [], lastKeys: '', lastAt: 0 }
}

export function historyReducer(state, action) {
  switch (action.type) {
    case 'reset':
      return createHistory(action.value)
    case 'patch': {
      const patch = typeof action.patch === 'function' ? action.patch(state.present) : action.patch
      if (!patch || typeof patch !== 'object') return state
      const next = { ...state.present, ...patch }
      if (Object.keys(patch).every((key) => Object.is(state.present[key], patch[key]))) return state
      const keys = Object.keys(patch).sort().join('|')
      const now = action.at ?? Date.now()
      const coalesce = keys === state.lastKeys && now - state.lastAt < COALESCE_MS && state.past.length > 0
      return {
        past: coalesce ? state.past : [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: next,
        future: [],
        lastKeys: keys,
        // lastAt marca el inicio del grupo actual (no se renueva al agrupar).
        lastAt: coalesce ? state.lastAt : now,
      }
    }
    case 'undo': {
      if (!state.past.length) return state
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
        lastKeys: '',
        lastAt: 0,
      }
    }
    case 'redo': {
      if (!state.future.length) return state
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
        lastKeys: '',
        lastAt: 0,
      }
    }
    // Reemplaza el estado actual guardando el anterior como paso (p. ej. al
    // descartar un borrador, para poder deshacerlo).
    case 'replace':
      return {
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: action.value,
        future: [],
        lastKeys: '',
        lastAt: 0,
      }
    default:
      return state
  }
}
