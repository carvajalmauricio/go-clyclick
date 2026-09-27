// i18n ligero para los textos fijos del perfil público. Sin dependencias.
// Solo dos idiomas soportados: español (por defecto) e inglés.
// t(lang, key) devuelve la cadena en el idioma pedido, con fallback a español.

export const LANGUAGES = ['es', 'en']
export const DEFAULT_LANGUAGE = 'es'

// Metadatos de idioma para los selectores (etiqueta corta visible en el toggle).
export const LANGUAGE_LABELS = {
  es: 'ES',
  en: 'EN',
}

// Diccionario de textos fijos de la interfaz del perfil.
const DICTIONARY = {
  es: {
    poweredBy: 'Powered by',
    tagline: 'Conecta tu negocio con un toque',
    saveContact: 'Guardar contacto',
    share: 'Compartir',
    languageLabel: 'Idioma',
    ageGateTitle: 'Contenido para mayores',
    ageGateQuestion: '¿Eres mayor de {age} años?',
    ageGateConfirm: 'Sí, soy mayor',
    ageGateLeave: 'No, salir',
    ageGateDefaultMessage: 'Este perfil contiene contenido para adultos. Confirma tu edad para continuar.',
  },
  en: {
    poweredBy: 'Powered by',
    tagline: 'Connect your business with a tap',
    saveContact: 'Save contact',
    share: 'Share',
    languageLabel: 'Language',
    ageGateTitle: 'Adults only content',
    ageGateQuestion: 'Are you over {age} years old?',
    ageGateConfirm: "Yes, I'm of age",
    ageGateLeave: 'No, leave',
    ageGateDefaultMessage: 'This profile contains adult content. Confirm your age to continue.',
  },
}

// Normaliza un idioma a uno soportado; los desconocidos caen a 'es'.
export function normalizeLang(lang) {
  const value = String(lang || '').toLowerCase().trim()
  return LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE
}

// Devuelve el texto para (lang, key). Si el idioma o la clave no existen en ese
// idioma, cae al español. `vars` permite interpolar marcadores tipo {age}.
export function t(lang, key, vars) {
  const language = normalizeLang(lang)
  const table = DICTIONARY[language] || DICTIONARY[DEFAULT_LANGUAGE]
  let value = table[key]
  if (value === undefined) value = DICTIONARY[DEFAULT_LANGUAGE][key]
  if (value === undefined) return key
  if (vars && typeof vars === 'object') {
    value = value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
  }
  return value
}
