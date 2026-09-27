// Decide si el negocio recién traído de la API debe reemplazar al incrustado
// en el HTML (revalidación en segundo plano de la carga instantánea, #2).
// Solo adoptamos lo fresco si corresponde al mismo slug y su serialización
// difiere del snapshot incrustado (evita renders redundantes con dato idéntico).
// Helper puro (sin DOM) para poder testear la comparación de forma aislada.
export function shouldAdoptFresh(fresh, inlined, slug) {
  if (!fresh || typeof fresh !== 'object' || fresh.slug !== slug) return false
  return JSON.stringify(fresh) !== JSON.stringify(inlined)
}
