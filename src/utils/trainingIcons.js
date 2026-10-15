// Shared geometry for the in-app icons and their downloadable SVG/PNG assets.
export const TRAINING_ICON_STROKE_WIDTH = 1

export const TRAINING_ICONS = {
  'training-system': [
    { tag: 'path', attrs: { d: 'M3 20h5v-5h5v-5h2' } },
    { tag: 'circle', attrs: { cx: 3, cy: 20, r: 1 } },
    { tag: 'circle', attrs: { cx: 18, cy: 6, r: 4 } },
    { tag: 'path', attrs: { d: 'm16.4 6 1.1 1.1 2.2-2.2' } },
  ],
  'training-programs': [
    { tag: 'path', attrs: { d: 'M17 8V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h4' } },
    { tag: 'path', attrs: { d: 'm6 6 1 1 2-2m-3 6 1 1 2-2M11 6h3m-3 5h2' } },
    { tag: 'path', attrs: { d: 'm14 20 6-6m-9 3 6 6m-4.5-7.5 6 6m-3-9 6 6M17 11l6 6' } },
  ],
}

export function trainingIconSvg(name, color = '#000000', size = 512) {
  const shapes = TRAINING_ICONS[name]
  if (!shapes) throw new Error(`Unknown training icon: ${name}`)
  const body = shapes.map(({ tag, attrs }) => `<${tag} ${Object.entries(attrs).map(([key, value]) => `${key}="${value}"`).join(' ')}/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-2 -2 28 28" fill="none" stroke="${color}" stroke-width="${TRAINING_ICON_STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`
}
