import QRCode from 'qrcode'

// Genera la URL pública del perfil de un negocio.
export function profileUrl(slug, origin) {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/${slug}`
}

// Genera un data URL PNG de alta resolución del QR.
// Con corrección de error 'H' para permitir logo centrado.
export async function generatePngDataUrl(text, { size = 2048, dark = '#000000', light = '#ffffff', logoUrl } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  await QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: size,
    color: { dark, light },
  })

  if (logoUrl) {
    await drawLogo(canvas, logoUrl, size)
  }

  return canvas.toDataURL('image/png')
}

// Dibuja el logo en el centro del QR (con recuadro claro de fondo).
function drawLogo(canvas, logoUrl, size) {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const logoSize = size * 0.2
      const x = (size - logoSize) / 2
      const y = (size - logoSize) / 2
      const pad = logoSize * 0.12
      // Fondo blanco redondeado detrás del logo
      ctx.fillStyle = '#ffffff'
      roundRect(ctx, x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2, logoSize * 0.15)
      ctx.fill()
      ctx.drawImage(img, x, y, logoSize, logoSize)
      resolve()
    }
    img.onerror = () => resolve() // si el logo falla, deja el QR sin logo
    img.src = logoUrl
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Genera un string SVG vectorial del QR.
export async function generateSvgString(text, { dark = '#000000', light = '#ffffff' } = {}) {
  return QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: { dark, light },
  })
}

// Descarga un data URL como archivo
export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// Descarga un string (SVG) como archivo
export function downloadString(content, filename, mime = 'image/svg+xml') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  downloadDataUrl(url, filename)
  URL.revokeObjectURL(url)
}
