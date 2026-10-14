import { useCallback, useEffect, useRef, useState } from 'react'

// Drafts stay local. Publishing remains the only request that updates a profile.
export function useDraftAutosave({ business, baseline, draftKey, disabled }) {
  const [status, setStatus] = useState('idle')
  const latest = useRef(null)
  const suppressed = useRef(false)
  const saved = useRef('')
  latest.current = { business, baseline, draftKey, disabled }

  const flush = useCallback((notify = true) => {
    const current = latest.current
    if (current.disabled || suppressed.current) return false
    const value = JSON.stringify(current.business)
    if (value === JSON.stringify(current.baseline)) return true
    try {
      if (saved.current !== value) {
        localStorage.setItem(current.draftKey, JSON.stringify({ business: current.business, savedAt: Date.now() }))
        saved.current = value
      }
      if (notify) setStatus('saved')
      return true
    } catch {
      if (notify) setStatus('error')
      return false
    }
  }, [])

  const clear = useCallback(() => {
    suppressed.current = true
    saved.current = ''
    localStorage.removeItem(latest.current.draftKey)
    setStatus('idle')
  }, [])

  useEffect(() => {
    if (disabled) return
    suppressed.current = false
    if (JSON.stringify(business) === JSON.stringify(baseline)) {
      setStatus('idle')
      // Undoing back to the published state must not leave a stale draft.
      try { localStorage.removeItem(draftKey); saved.current = '' } catch { /* no new data to save */ }
      return
    }
    setStatus('pending')
    const timer = setTimeout(() => flush(), 600)
    return () => clearTimeout(timer)
  }, [business, baseline, draftKey, disabled, flush])

  useEffect(() => {
    const onHide = () => flush(false)
    const onVisibility = () => { if (document.visibilityState === 'hidden') onHide() }
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onVisibility)
      flush(false)
    }
  }, [flush])

  return { status, flush, clear }
}
