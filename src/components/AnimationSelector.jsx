import { useId } from 'react'
import { ANIMATION_OPTIONS, normalizeAnimation } from '../utils/animations.js'

export default function AnimationSelector({ value, onChange, label = 'Animación', className }) {
  const hintId = useId()
  const selected = normalizeAnimation(value)
  return (
    <label className="flex flex-col gap-1 text-xs text-gray-400">
      {label}
      <select aria-label={label} aria-describedby={hintId} value={selected} onChange={(event) => onChange(event.target.value)} className={className}>
        {ANIMATION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <span id={hintId} className="text-[11px] text-gray-500">{ANIMATION_OPTIONS.find((option) => option.value === selected).description}</span>
    </label>
  )
}
