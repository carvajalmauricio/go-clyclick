import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteLead, listLeads, updateLead } from '../../utils/api.js'

const byNewest = (a, b) => (b.createdAt || 0) - (a.createdAt || 0)

// Solicitudes del panel: carga, cambios optimistas (se revierten si fallan) y
// contador de nuevas para la pestaña.
export function useLeads() {
  const [leads, setLeads] = useState(null) // null mientras carga
  const [error, setError] = useState('')
  const latest = useRef([])
  latest.current = leads || []

  const refresh = useCallback(async () => {
    setError('')
    try {
      setLeads((await listLeads()).sort(byNewest))
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las solicitudes.')
      setLeads((current) => current ?? [])
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const update = useCallback(async (id, changes) => {
    const previous = latest.current.find((lead) => lead.id === id)
    setLeads((list) => (list || []).map((lead) => (lead.id === id ? { ...lead, ...changes, updatedAt: Date.now() } : lead)))
    try {
      const saved = await updateLead(id, changes)
      setLeads((list) => (list || []).map((lead) => (lead.id === id ? { ...lead, ...saved } : lead)))
      return saved
    } catch (err) {
      if (previous) setLeads((list) => (list || []).map((lead) => (lead.id === id ? previous : lead)))
      throw err
    }
  }, [])

  const remove = useCallback(async (id) => {
    const removed = latest.current.find((lead) => lead.id === id)
    setLeads((list) => (list || []).filter((lead) => lead.id !== id))
    try {
      await deleteLead(id)
    } catch (err) {
      if (removed) setLeads((list) => [...(list || []), removed].sort(byNewest))
      throw err
    }
  }, [])

  const newCount = (leads || []).filter((lead) => lead.status === 'new').length
  return { leads, error, refresh, update, remove, newCount }
}
