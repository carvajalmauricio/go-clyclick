import { useState } from 'react'
import ThemeSelector from './ThemeSelector.jsx'
import ActionManager from './ActionManager.jsx'
import CustomLinksManager from './CustomLinksManager.jsx'
import BankAccountManager from './BankAccountManager.jsx'
import HeroSlidesManager from './HeroSlidesManager.jsx'
import { uploadLogo } from '../utils/api.js'
import { resolveTheme, THEME_LIST } from '../utils/themes.js'
import { getActionSettings, buildSocials, SOCIAL_NETWORKS, SOCIAL_POSITIONS, normalizeSocialPosition, normalizeSocialOrder } from '../utils/links.js'
import { Field, FileButton, IconButton, SectionCard, SubHeading, inputCls } from './admin/ui.jsx'

// Secciones del formulario. El editor las usa también para la navegación rápida.
export const FORM_SECTIONS = [
  { id: 'basic', icon: 'store', title: 'Información básica', short: 'Básico', description: 'Nombre, logo, categoría y descripción del negocio.' },
  { id: 'slides', icon: 'slides', title: 'Slides de presentación', short: 'Slides', description: 'Rota la tarjeta de presentación con servicios o platos.' },
  { id: 'actions', icon: 'cursor', title: 'Botones de acción', short: 'Botones', description: 'Destinos, orden, estilo y secciones de los botones.' },
  { id: 'bank', icon: 'bank', title: 'Datos bancarios', short: 'Bancos', description: 'Cuentas para transferencias y enlaces de pago.' },
  { id: 'contact', icon: 'contact', title: 'Contacto y redes', short: 'Contacto', description: 'Datos del contacto descargable (vCard) y redes sociales.' },
  { id: 'design', icon: 'palette', title: 'Diseño', short: 'Diseño', description: 'Tema, fondo y estilo de los botones.' },
]

// Formulario controlado de configuración de negocio.
// `value` es el objeto negocio; `onChange(patch)` aplica cambios parciales.
// `openSections` (Set) y `onToggleSection(id)` controlan qué tarjetas están abiertas.
export default function BusinessForm({ value, onChange, isEdit, openSections, onToggleSection }) {
  const b = value
  const theme = resolveTheme(b.theme, b.customColors)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const set = (field) => (e) => onChange({ [field]: e.target.value })
  const setSocial = (field) => (e) =>
    onChange({ social: { ...(b.social || {}), [field]: e.target.value } })

  // Orden efectivo de las redes activas (para reordenar en el editor). Se basa
  // en buildSocials, que ya respeta socialOrder y filtra las redes con valor.
  const enabledSocials = buildSocials(b)
  const moveSocial = (index, dir) => {
    const keys = enabledSocials.map((s) => s.key)
    const target = index + dir
    if (target < 0 || target >= keys.length) return
    ;[keys[index], keys[target]] = [keys[target], keys[index]]
    onChange({ socialOrder: normalizeSocialOrder(keys) })
  }

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

  const summaries = getSummaries(b)
  const card = (id) => {
    const meta = FORM_SECTIONS.find((section) => section.id === id)
    return {
      id: `section-${id}`,
      icon: meta.icon,
      title: meta.title,
      description: meta.description,
      summary: summaries[id],
      open: openSections.has(id),
      onToggle: () => onToggleSection(id),
    }
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <SectionCard {...card('basic')}>
        <div className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-950/40 p-3">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-gray-800"
            style={{ borderColor: theme.accent }}
          >
            {b.logo ? (
              <img src={b.logo} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-gray-500">{initials(b.name)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-300">Logo del negocio</p>
            <p className="mb-2 text-[11px] text-gray-500">PNG, JPG, WEBP, SVG o GIF. Ideal cuadrado.</p>
            <div className="flex flex-wrap items-center gap-2">
              <FileButton
                label={b.logo ? 'Cambiar logo' : 'Subir logo'}
                busy={uploading}
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                onFile={onLogoFile}
              />
              {b.logo && !uploading && (
                <button type="button" onClick={() => onChange({ logo: '' })} className="px-2 text-xs text-gray-400 hover:text-white">
                  Quitar
                </button>
              )}
            </div>
            {uploadError && <p role="alert" className="mt-1 text-xs text-red-400">{uploadError}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del negocio *" className="sm:col-span-2">
            <input className={inputCls} value={b.name || ''} onChange={set('name')} placeholder="Pizzería Napoli" />
          </Field>
          <Field
            label="Dirección web (slug)"
            hint={isEdit ? 'La dirección no se puede cambiar al editar.' : 'Si lo dejas vacío se genera a partir del nombre.'}
          >
            <div className={`${inputCls} flex items-center gap-0.5 ${isEdit ? 'opacity-60' : ''}`}>
              <span className="shrink-0 text-gray-500">/</span>
              <input
                className="min-w-0 flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none disabled:cursor-not-allowed"
                value={b.slug || ''}
                onChange={set('slug')}
                placeholder="pizzeria-napoli"
                disabled={isEdit}
                aria-label="Slug (URL)"
              />
            </div>
          </Field>
          <Field label="Categoría">
            <input className={inputCls} value={b.category || ''} onChange={set('category')} placeholder="Restaurante" />
          </Field>
          <Field label="Descripción / Eslogan" className="sm:col-span-2">
            <textarea className={inputCls} rows={2} value={b.description || ''} onChange={set('description')} placeholder="La mejor pizza al horno de leña" />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-gray-300">Color de la descripción</span>
          <input
            type="color"
            aria-label="Color de la descripción"
            value={b.descriptionColor || theme.subtext}
            onInput={set('descriptionColor')}
            onChange={set('descriptionColor')}
            className="h-9 w-12 cursor-pointer rounded-lg border border-gray-700 bg-gray-800 p-1"
          />
          <button
            type="button"
            onClick={() => onChange({ descriptionColor: '' })}
            disabled={!b.descriptionColor}
            className="text-xs text-gray-400 hover:text-white disabled:opacity-40"
          >
            {b.descriptionColor ? 'Usar color del tema' : 'Usando color del tema'}
          </button>
        </div>
      </SectionCard>

      <SectionCard {...card('slides')}>
        <HeroSlidesManager business={b} onChange={onChange} />
      </SectionCard>

      <SectionCard {...card('actions')}>
        <SubHeading>Destinos</SubHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp (con código de país)">
            <input className={inputCls} value={b.whatsapp || ''} onChange={set('whatsapp')} placeholder="+593999999999" inputMode="tel" />
          </Field>
          <Field label="Menú / Catálogo (PDF o enlace)">
            <input className={inputCls} value={b.menuUrl || ''} onChange={set('menuUrl')} placeholder="https://..." />
          </Field>
          <Field label="Reseña en Google (5 estrellas)" className="sm:col-span-2">
            <input className={inputCls} value={b.googleReviewUrl || ''} onChange={set('googleReviewUrl')} placeholder="https://g.page/r/.../review" />
          </Field>
          <Field label="Google Maps">
            <input className={inputCls} value={b.mapsUrl || ''} onChange={set('mapsUrl')} placeholder="https://maps.google.com/?q=..." />
          </Field>
          <Field label="Waze">
            <input className={inputCls} value={b.wazeUrl || ''} onChange={set('wazeUrl')} placeholder="https://waze.com/ul?..." />
          </Field>
        </div>
        <SubHeading>Orden y presentación</SubHeading>
        <ActionManager business={b} onChange={onChange} />
        <SubHeading>Enlaces personalizados</SubHeading>
        <CustomLinksManager business={b} onChange={onChange} />
      </SectionCard>

      <SectionCard {...card('bank')}>
        <BankAccountManager business={b} onChange={onChange} />
      </SectionCard>

      <SectionCard {...card('contact')}>
        <SubHeading>Contacto (vCard)</SubHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teléfono">
            <input className={inputCls} value={b.phone || ''} onChange={set('phone')} placeholder="+593..." inputMode="tel" />
          </Field>
          <Field label="Email">
            <input className={inputCls} type="email" value={b.email || ''} onChange={set('email')} placeholder="hola@negocio.com" />
          </Field>
          <Field label="Sitio web" className="sm:col-span-2">
            <input className={inputCls} value={b.website || ''} onChange={set('website')} placeholder="negocio.com" />
          </Field>
        </div>
        <SubHeading>Redes sociales</SubHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_NETWORKS.map((network) => (
            <Field key={network.key} label={`${network.label} (usuario o URL)`}>
              <input
                className={inputCls}
                value={b.social?.[network.key] || ''}
                onChange={setSocial(network.key)}
                placeholder={network.placeholder}
              />
            </Field>
          ))}
        </div>
        <SubHeading>Posición de las redes</SubHeading>
        <Field label="¿Dónde se muestran los iconos de redes?" hint="Arriba: justo debajo de la tarjeta de presentación. Abajo: después de los botones de acción.">
          <select
            className={inputCls}
            value={normalizeSocialPosition(b.socialPosition)}
            onChange={(e) => onChange({ socialPosition: e.target.value })}
          >
            {SOCIAL_POSITIONS.map((position) => (
              <option key={position} value={position}>
                {position === 'top' ? 'Arriba del perfil (bajo la presentación)' : 'Abajo del perfil (tras los botones)'}
              </option>
            ))}
          </select>
        </Field>
        {enabledSocials.length > 1 && (
          <>
            <SubHeading>Orden de las redes</SubHeading>
            <ul className="flex flex-col gap-2">
              {enabledSocials.map((social, index) => (
                <li
                  key={social.key}
                  className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-200">
                    {SOCIAL_NETWORKS.find((n) => n.key === social.key)?.label || social.key}
                  </span>
                  <IconButton icon="chevron-up" label="Subir" onClick={() => moveSocial(index, -1)} disabled={index === 0} />
                  <IconButton icon="chevron-down" label="Bajar" onClick={() => moveSocial(index, 1)} disabled={index === enabledSocials.length - 1} />
                </li>
              ))}
            </ul>
          </>
        )}
      </SectionCard>

      <SectionCard {...card('design')}>
        <ThemeSelector
          value={b.theme || 'vibrant'}
          customColors={b.customColors}
          background={b.background}
          buttonStyle={b.buttonStyle}
          slug={b.slug || b.name}
          onChange={(theme) => onChange({ theme })}
          onCustomChange={(customColors) => onChange({ customColors })}
          onBackgroundChange={(background) => onChange({ background })}
          onButtonStyleChange={(buttonStyle) => onChange({ buttonStyle })}
        />
      </SectionCard>
    </div>
  )
}

function initials(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

// Resumen corto que se muestra cuando una tarjeta está plegada.
function getSummaries(b) {
  const slides = b.heroSlides?.items?.length || 0
  const enabledActions = getActionSettings(b).filter((item) => item.enabled !== false)
  const customLinks = (Array.isArray(b.links) ? b.links : []).filter((link) => link && link.enabled !== false && (link.title || link.url)).length
  const destinations = [b.whatsapp, b.googleReviewUrl, b.mapsUrl, b.wazeUrl, b.menuUrl].filter(Boolean).length
  const accounts = b.bankAccounts?.length || 0
  const socials = Object.values(b.social || {}).filter(Boolean).length
  const contact = [b.phone, b.email, b.website].filter(Boolean).length
  const themeName = b.theme === 'custom' ? 'Personalizado' : THEME_LIST.find((t) => t.id === b.theme)?.name || b.theme
  return {
    basic: [b.name || 'Sin nombre', b.category, b.logo ? 'con logo' : 'sin logo'].filter(Boolean).join(' · '),
    slides: b.heroSlides?.enabled && slides
      ? `Activo · ${plural(slides + 1, 'slide', 'slides')} · cada ${b.heroSlides.interval || 3} s`
      : 'Desactivado',
    actions: `${plural(destinations, 'destino configurado', 'destinos configurados')} · ${plural(enabledActions.length, 'botón activo', 'botones activos')}${customLinks ? ` · ${plural(customLinks, 'enlace personalizado', 'enlaces personalizados')}` : ''}`,
    bank: accounts ? plural(accounts, 'cuenta', 'cuentas') : 'Sin cuentas',
    contact: `${plural(contact, 'dato de contacto', 'datos de contacto')} · ${plural(socials, 'red social', 'redes sociales')}`,
    design: `Tema ${themeName}`,
  }
}
