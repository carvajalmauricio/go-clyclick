import { useState } from 'react'
import { resolveTheme, getBackgroundStyle } from '../utils/themes.js'
import { t } from '../utils/i18n.js'

// Clave de sessionStorage por slug para recordar que ya se confirmó la edad.
function storageKey(slug) {
  return `clyclick:agegate:${slug}`
}

function alreadyConfirmed(slug) {
  try {
    return typeof window !== 'undefined' && window.sessionStorage?.getItem(storageKey(slug)) === '1'
  } catch {
    return false
  }
}

// Puerta de edad / contenido sensible (#19). Bloquea el perfil detrás de una
// confirmación a pantalla completa. Al confirmar, revela el perfil y lo recuerda
// en sessionStorage. Al rechazar, redirige fuera del perfil.
// Los textos usan el idioma por defecto del negocio (español, o inglés si es el
// único configurado); son textos fijos vía i18n más el mensaje personalizado.
export default function AgeGate({ business, children }) {
  const gate = business?.ageGate
  const enabled = gate?.enabled === true
  const slug = business?.slug || ''
  const [confirmed, setConfirmed] = useState(() => !enabled || alreadyConfirmed(slug))

  if (confirmed) return children

  const lang = Array.isArray(business.languages) && !business.languages.includes('es') && business.languages.includes('en')
    ? 'en'
    : 'es'
  const minAge = Number.isFinite(Number(gate?.minAge)) ? Number(gate.minAge) : 18
  const message = gate?.message?.trim() || t(lang, 'ageGateDefaultMessage')
  const theme = resolveTheme(business.theme, business.customColors)

  function confirm() {
    try {
      window.sessionStorage?.setItem(storageKey(slug), '1')
    } catch {
      /* sessionStorage puede no estar disponible; se ignora. */
    }
    setConfirmed(true)
  }

  function leave() {
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) window.history.back()
      else window.location.href = 'https://www.google.com'
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(lang, 'ageGateTitle')}
      className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden p-6 text-center"
      style={{ ...getBackgroundStyle(theme, null), color: theme.text }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-7 shadow-2xl"
        style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
      >
        <h1 className="text-xl font-bold">{t(lang, 'ageGateTitle')}</h1>
        <p className="mt-3 text-sm" style={{ color: theme.subtext }}>{message}</p>
        <p className="mt-4 text-lg font-semibold">{t(lang, 'ageGateQuestion', { age: minAge })}</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={confirm}
            className="w-full rounded-xl px-4 py-3 font-semibold"
            style={{ background: theme.accent, color: theme.accentText }}
          >
            {t(lang, 'ageGateConfirm')}
          </button>
          <button
            type="button"
            onClick={leave}
            className="w-full rounded-xl px-4 py-3 font-semibold"
            style={{ border: `1px solid ${theme.border}`, color: theme.text }}
          >
            {t(lang, 'ageGateLeave')}
          </button>
        </div>
      </div>
    </div>
  )
}
