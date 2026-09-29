import { useState } from 'react'
import { uploadMedia } from '../../utils/api.js'
import { canProcess, compressImage } from '../../utils/image.js'
import ImageCropDialog from './ImageCropDialog.jsx'
import { FileButton } from './ui.jsx'
import { useToast } from './Toast.jsx'

// Botón de subida de imágenes con recorte y compresión previos (#11).
// - Con `preset`, abre el recorte (logo, portada, miniatura, slide).
// - Sin `preset`, solo comprime (p. ej. fondos).
// GIF y SVG se suben sin procesar para no perder la animación ni el vector.
export default function ImageUploadButton({ label, preset, kind, slug, accept = 'image/png,image/jpeg,image/webp,image/gif', onUploaded, onBusyChange, disabled, variant, maxDimension = 2000 }) {
  const toast = useToast()
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState(false)

  function setBusyState(value) {
    setBusy(value)
    onBusyChange?.(value)
  }

  async function upload(file) {
    setPending(null)
    setBusyState(true)
    try {
      const { url } = await uploadMedia(file, slug || 'general', kind || preset?.kind || 'media')
      onUploaded(url)
    } catch (error) {
      toast.error(error.message || 'No se pudo subir la imagen.')
    } finally {
      setBusyState(false)
    }
  }

  async function onFile(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // permite volver a elegir el mismo archivo
    if (!file) return
    if (preset && canProcess(file)) {
      setPending(file)
      return
    }
    if (!preset && canProcess(file)) {
      setBusyState(true)
      try {
        const compressed = await compressImage(file, maxDimension)
        await upload(compressed)
      } finally {
        setBusyState(false)
      }
      return
    }
    upload(file)
  }

  return (
    <>
      <FileButton label={label} busy={busy} accept={accept} onFile={onFile} disabled={disabled} variant={variant} />
      {pending && <ImageCropDialog file={pending} preset={preset} onCancel={() => setPending(null)} onConfirm={upload} />}
    </>
  )
}
