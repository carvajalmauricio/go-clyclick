import { paymentUrl } from './banking.js'

export async function readPaymentQr(file) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
    throw new Error('Selecciona una imagen PNG, JPG, WebP o GIF del QR.')
  }
  if (file.size > 10 * 1024 * 1024) throw new Error('La imagen debe pesar menos de 10 MB.')
  const objectUrl = URL.createObjectURL(file)
  const canvas = document.createElement('canvas')
  const image = new Image()
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () => reject(new Error('No se pudo abrir la imagen. Prueba con otra captura del QR.'))
      image.src = objectUrl
    })
    if (image.naturalWidth * image.naturalHeight > 24000000) {
      throw new Error('La imagen es demasiado grande. Recórtala alrededor del QR e inténtalo otra vez.')
    }
    const { default: jsQR } = await import('jsqr')
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('No se pudo procesar la imagen en este navegador.')
    for (const maxSize of [1024, 2048]) {
      const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight))
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
      const result = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' })
      if (result) {
        const url = paymentUrl(result.data)
        if (!url) throw new Error('El QR no contiene un enlace web. Usa un QR con enlace de pago o registra los datos de la cuenta.')
        return url
      }
      if (scale === 1) break
    }
    throw new Error('No se encontró un QR legible. Prueba con una imagen más nítida y recortada alrededor del código.')
  } finally {
    URL.revokeObjectURL(objectUrl)
    image.src = ''
    canvas.width = canvas.height = 0
  }
}
