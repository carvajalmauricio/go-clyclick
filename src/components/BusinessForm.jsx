import { useState } from 'react'
import ThemeSelector from './ThemeSelector.jsx'
import { uploadLogo } from '../utils/api.js'

// Formulario controlado de configuración de negocio.
// `value` es el objeto negocio; `onChange(patch)` aplica cambios parciales.
export default function BusinessForm({ value, onChange, isEdit }) {
  const b = value
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const set = (field) => (e) => onChange({ [field]: e.target.value })
  const setSocial = (field) => (e) =>
    onChange({ social: { ...(b.social || {}), [field]: e.target.value } })

  async function onLogoFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const slug = b.slug || b.name || 'general'
      const { url } = await uploadLogo(file, slug)
      onChange({ logo: url })
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      e.target.value = '' // permite volver a subir el mismo archivo
    }
  }

  return (
    <div className="flex flex-col gap-5 text-sm">
      <Section title="Información básica">
        <Field label="Nombre del negocio *">
          <input className={inputCls} value={b.name || ''} onChange={set('name')} placeholder="Pizzería Napoli" />
        </Field>
        <Field label="Slug (URL)">
          <input
            className={inputCls}
            value={b.slug || ''}
            onChange={set('slug')}
            placeholder="pizzeria-napoli"
            disabled={isEdit}
          />
          {isEdit && <span className="text-xs text-gray-500">El slug no se puede cambiar al editar.</span>}
        </Field>
        <Field label="Categoría">
          <input className={inputCls} value={b.category || ''} onChange={set('category')} placeholder="Restaurante" />
        </Field>
        <Field label="Descripción / Eslogan">
          <textarea className={inputCls} rows={2} value={b.description || ''} onChange={set('description')} />
        </Field>
        <Field label="Logo del negocio">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center overflow-hidden shrink-0">
              {b.logo ? (
                <img src={b.logo} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-500 text-xs">Sin logo</span>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                onChange={onLogoFile}
                disabled={uploading}
                className="block w-full text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-clickclick-orange file:text-clickclick-dark file:font-semibold file:cursor-pointer"
              />
              {uploading && <span className="text-xs text-clickclick-orange">Subiendo...</span>}
              {uploadError && <span className="text-xs text-red-400">{uploadError}</span>}
              {b.logo && !uploading && (
                <button
                  type="button"
                  onClick={() => onChange({ logo: '' })}
                  className="text-xs text-gray-400 underline mt-1"
                >
                  Quitar logo
                </button>
              )}
            </div>
          </div>
        </Field>
      </Section>

      <Section title="Botones de acción">
        <Field label="WhatsApp (con código de país)">
          <input className={inputCls} value={b.whatsapp || ''} onChange={set('whatsapp')} placeholder="+593999999999" />
        </Field>
        <Field label="URL reseña Google (5 estrellas)">
          <input className={inputCls} value={b.googleReviewUrl || ''} onChange={set('googleReviewUrl')} placeholder="https://g.page/r/.../review" />
        </Field>
        <Field label="Google Maps">
          <input className={inputCls} value={b.mapsUrl || ''} onChange={set('mapsUrl')} placeholder="https://maps.google.com/?q=..." />
        </Field>
        <Field label="Waze">
          <input className={inputCls} value={b.wazeUrl || ''} onChange={set('wazeUrl')} placeholder="https://waze.com/ul?..." />
        </Field>
        <Field label="Menú / Catálogo (PDF o enlace)">
          <input className={inputCls} value={b.menuUrl || ''} onChange={set('menuUrl')} placeholder="https://..." />
        </Field>
      </Section>

      <Section title="Contacto (vCard)">
        <Field label="Teléfono">
          <input className={inputCls} value={b.phone || ''} onChange={set('phone')} placeholder="+593..." />
        </Field>
        <Field label="Email">
          <input className={inputCls} value={b.email || ''} onChange={set('email')} placeholder="hola@negocio.com" />
        </Field>
        <Field label="Sitio web">
          <input className={inputCls} value={b.website || ''} onChange={set('website')} placeholder="negocio.com" />
        </Field>
      </Section>

      <Section title="Redes sociales">
        <Field label="Instagram (usuario o URL)">
          <input className={inputCls} value={b.social?.instagram || ''} onChange={setSocial('instagram')} placeholder="minegocio" />
        </Field>
        <Field label="TikTok (usuario o URL)">
          <input className={inputCls} value={b.social?.tiktok || ''} onChange={setSocial('tiktok')} placeholder="minegocio" />
        </Field>
        <Field label="Facebook (usuario o URL)">
          <input className={inputCls} value={b.social?.facebook || ''} onChange={setSocial('facebook')} placeholder="minegocio" />
        </Field>
        <Field label="LinkedIn (usuario, company/nombre o URL)">
          <input className={inputCls} value={b.social?.linkedin || ''} onChange={setSocial('linkedin')} placeholder="company/minegocio" />
        </Field>
      </Section>

      <Section title="Tema visual">
        <ThemeSelector
          value={b.theme || 'vibrant'}
          customColors={b.customColors}
          onChange={(theme) => onChange({ theme })}
          onCustomChange={(customColors) => onChange({ customColors })}
        />
      </Section>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-clickclick-orange'

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-clickclick-orange font-semibold mb-3 text-xs uppercase tracking-wide">{title}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-gray-400 text-xs">{label}</span>
      {children}
    </label>
  )
}
