import { ACTION_DEFINITIONS, buildSocials, getActionSettings } from './links.js'
import { sortContent } from './contentOrder.js'

export function editorContent(business) {
  return sortContent([
    ...getActionSettings(business).map((item) => ({ ...item, key: item.id, kind: 'action', title: item.label || ACTION_DEFINITIONS.find((entry) => entry.type === item.type)?.label || 'Botón' })),
    ...(business.links || []).map((item) => ({ ...item, valueTitle: item.title || '', key: `link-${item.id}`, kind: 'link', title: item.title || 'Nuevo enlace' })),
    ...buildSocials(business, 'buttons').map((item) => ({ ...item, key: `social:${item.key}`, id: item.key, kind: 'social', title: item.label, sectionId: business.socialSections?.[item.key] || '' })),
  ], business.contentOrder)
}

// Patch a single entry against the latest state, including asynchronous uploads.
export function patchContent(business, entry, changes) {
  if (entry.kind === 'social') return { socialSections: { ...business.socialSections, [entry.id]: changes.sectionId ?? entry.sectionId } }
  if (entry.kind === 'link') return { links: (business.links || []).map((item) => item.id === entry.id ? { ...item, ...changes } : item) }
  return { actionSettingsVersion: 2, actionSettings: getActionSettings(business).map((item) => item.id === entry.id ? { ...item, ...changes } : item) }
}
