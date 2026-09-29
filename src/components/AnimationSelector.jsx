import { useId } from 'react'
import { ANIMATION_OPTIONS, animationClass, innerAnimationClass, normalizeAnimation } from '../utils/animations.js'
import { getButtonColors } from '../utils/buttonColors.js'
import { buttonBorderWidth, buttonRadius } from '../utils/buttonStyles.js'
import { profileThemeId, resolveTheme } from '../utils/themes.js'

// Selector de animación con vista previa en movimiento (#9). Cada opción
// muestra un mini botón con la animación real (mismas clases CSS que el
// perfil) y, si se pasa `business`, con los colores y la forma de sus botones.
export default function AnimationSelector({ value, onChange, label = 'Animación', business, primary = false }) {
  const hintId = useId()
  const selected = normalizeAnimation(value)
  const theme = resolveTheme(profileThemeId(business), business?.customColors)
  const style = business?.buttonStyle || {}
  const colors = getButtonColors({ primary }, theme, style)
  const sample = {
    background: colors.background,
    color: colors.text,
    border: `${buttonBorderWidth(style.variant)}px solid ${colors.border}`,
    borderRadius: buttonRadius(style.shape),
  }
  return (
    <fieldset className="flex flex-col gap-1.5 text-xs text-gray-400" aria-describedby={hintId}>
      <legend className="mb-1.5">{label}</legend>
      <div className="grid grid-cols-4 gap-2">
        {ANIMATION_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected === option.value}
            title={option.description}
            className={`flex flex-col items-center gap-1.5 overflow-hidden rounded-lg border px-1.5 pb-1.5 pt-2.5 text-[11px] ${selected === option.value ? 'border-clickclick-orange bg-clickclick-orange/10 text-clickclick-orange' : 'border-gray-700 text-gray-300 hover:border-gray-500'}`}
          >
            <span aria-hidden="true" className="flex h-9 w-full items-center justify-center rounded-md px-2" style={{ background: theme.bgGradient || theme.bg }}>
              <span className={`block w-full ${animationClass(option.value)}`} style={{ borderRadius: sample.borderRadius, '--profile-action-glow': theme.accent }}>
                <span className={`flex h-5 w-full items-center gap-1 px-1.5 ${innerAnimationClass(option.value)}`} style={sample}>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                  <span className="h-1 flex-1 rounded-full bg-current opacity-60" />
                </span>
              </span>
            </span>
            {option.label}
          </button>
        ))}
      </div>
      <span id={hintId} className="text-[11px] text-gray-500">{ANIMATION_OPTIONS.find((option) => option.value === selected).description}</span>
    </fieldset>
  )
}
