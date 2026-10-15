// Shared geometry for the in-app icons and their downloadable SVG/PNG assets.
export const TRAINING_ICONS = {
  'training-system': [
    { tag: 'path', attrs: { d: 'M3 20h5v-5h5v-5h2' } },
    { tag: 'circle', attrs: { cx: 3, cy: 20, r: 1 } },
    { tag: 'circle', attrs: { cx: 18, cy: 6, r: 4 } },
    { tag: 'path', attrs: { d: 'm16.4 6 1.1 1.1 2.2-2.2' } },
  ],
  'training-programs': [
    { tag: 'path', attrs: { d: 'M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2' } },
    { tag: 'rect', attrs: { x: 8, y: 2, width: 8, height: 4, rx: 1 } },
    { tag: 'path', attrs: { d: 'M8 11v6m-2-4v2m10-4v6m2-4v2M8 14h8M9 19h6' } },
  ],
}

export function trainingIconSvg(name, color = '#d6ff00', size = 512) {
  const shapes = TRAINING_ICONS[name]
  if (!shapes) throw new Error(`Unknown training icon: ${name}`)
  const body = shapes.map(({ tag, attrs }) => `<${tag} ${Object.entries(attrs).map(([key, value]) => `${key}="${value}"`).join(' ')}/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-2 -2 28 28" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`
}
