// Rubros (tipos de negocio) de la página de inicio.
// Cada rubro define un perfil de ejemplo para el teléfono de la portada
// (nombre, descripción, tema, estilo de botones y acciones) y los valores con
// los que el panel precarga un perfil nuevo creado desde una solicitud.
// Lo comparten la página de inicio, el panel y la validación de solicitudes.
import { ACTION_DEFINITIONS } from './links.js'
import { BANK_SECTION_ID } from './banking.js'
import { DEFAULT_HEADER } from './header.js'
import { THEMES } from './themes.js'
import { slugify } from './slug.js'

export const RUBROS = [
  {
    id: 'restaurante',
    icon: 'food',
    label: 'Restaurante',
    category: 'Restaurante',
    sampleName: 'Sazón de la Costa',
    description: 'Comida casera hecha con cariño. Pide, reserva y encuéntranos aquí.',
    theme: 'sunset',
    buttonStyle: { shape: 'rounded', variant: 'filled', shadow: 'soft' },
    actions: [
      { type: 'whatsapp', label: 'Pide por WhatsApp', animation: 'shine' },
      { type: 'menu', label: 'Ver el menú' },
      { type: 'review', label: 'Déjanos 5 estrellas' },
      { type: 'maps', label: 'Cómo llegar' },
    ],
    links: [{ title: 'Pedidos a domicilio', icon: 'truck' }],
    social: { instagram: 'demo', facebook: 'demo', tiktok: 'demo' },
    keywords: ['restaur', 'comida', 'pizz', 'burger', 'hambur', 'asadero', 'marisq', 'cevich', 'parrill', 'polleri', 'pollo', 'sushi', 'taco', 'cocina', 'picanteri', 'chifa', 'grill', 'almuerz', 'comedor', 'food', 'sazon', 'sabor', 'fritad', 'hornado', 'encebollad', 'bolon', 'mariscos', 'wings', 'alitas'],
  },
  {
    id: 'cafeteria',
    icon: 'coffee',
    label: 'Cafetería',
    category: 'Cafetería',
    sampleName: 'Café La Esquina',
    description: 'Café de especialidad y postres artesanales, a un toque de ti.',
    theme: 'blueprint',
    buttonStyle: { shape: 'rounded', variant: 'filled', shadow: 'soft' },
    actions: [
      { type: 'menu', label: 'Ver la carta' },
      { type: 'whatsapp', label: 'Haz tu pedido', animation: 'shine' },
      { type: 'review', label: 'Déjanos 5 estrellas' },
      { type: 'maps', label: 'Cómo llegar' },
    ],
    links: [],
    social: { instagram: 'demo', tiktok: 'demo' },
    keywords: ['cafe', 'coffee', 'panader', 'pasteler', 'postre', 'helad', 'dulce', 'bakery', 'reposter', 'cupcake', 'brownie', 'bistro', 'chocolat', 'crepe', 'waffle', 'jugo', 'batido', 'smoothie', 'donut'],
  },
  {
    id: 'barberia',
    icon: 'scissors',
    label: 'Barbería y belleza',
    category: 'Barbería',
    sampleName: 'Barbería Norte',
    description: 'Cortes clásicos y modernos. Reserva tu turno sin esperas.',
    theme: 'luxury',
    buttonStyle: { shape: 'pill', variant: 'outline', shadow: 'none' },
    header: { logoShape: 'rounded' },
    actions: [
      { type: 'whatsapp', label: 'Agenda por WhatsApp', animation: 'pulse' },
      { type: 'review', label: 'Déjanos 5 estrellas' },
      { type: 'maps', label: 'Cómo llegar' },
    ],
    links: [{ title: 'Cortes y precios', icon: 'scissors' }],
    social: { instagram: 'demo', tiktok: 'demo' },
    keywords: ['barber', 'peluq', 'salon', 'spa', 'estetic', 'unas', 'nails', 'belleza', 'beauty', 'makeup', 'maquill', 'lash', 'pestan', 'ceja', 'tattoo', 'tatuaj', 'masaje', 'depila', 'stylist', 'estilist'],
  },
  {
    id: 'tienda',
    icon: 'cart',
    label: 'Tienda',
    category: 'Tienda de regalos',
    sampleName: 'Tienda Arcoíris',
    description: 'Detalles que alegran el día. Mira el catálogo y paga fácil.',
    theme: 'rainbow',
    buttonStyle: { shape: 'pill', variant: 'filled', shadow: 'soft' },
    actions: [
      { type: 'menu', label: 'Ver el catálogo' },
      { type: 'whatsapp', label: 'Compra por WhatsApp', animation: 'shine' },
      { type: 'maps', label: 'Visítanos' },
    ],
    links: [],
    bank: { bank: 'deuna', label: 'Paga con Deuna', section: 'Pagos' },
    social: { instagram: 'demo', tiktok: 'demo', facebook: 'demo' },
    keywords: ['tienda', 'boutique', 'store', 'shop', 'market', 'bazar', 'regalo', 'moda', 'ropa', 'calzado', 'zapat', 'accesori', 'joyer', 'florist', 'flores', 'librer', 'ferreter', 'papeler', 'juguet', 'perfum', 'cosmetic', 'bisuter', 'variedades', 'importador', 'distribuidor', 'comercial', 'minimarket', 'licorer', 'detalles'],
  },
  {
    id: 'taller',
    icon: 'wrench',
    label: 'Taller y servicios',
    category: 'Taller y lubricadora',
    sampleName: 'Mecánica Express',
    description: 'Mantenimiento y reparación con garantía. Agenda tu servicio hoy.',
    theme: 'ocean',
    buttonStyle: { shape: 'rounded', variant: 'filled', shadow: 'soft' },
    actions: [
      { type: 'whatsapp', label: 'Agenda tu servicio', animation: 'shine' },
      { type: 'maps', label: 'Cómo llegar' },
      { type: 'waze', label: 'Abrir en Waze' },
      { type: 'review', label: 'Déjanos 5 estrellas' },
    ],
    links: [],
    social: { facebook: 'demo', instagram: 'demo' },
    keywords: ['taller', 'lubricad', 'mecanic', 'automotr', '=auto', '=autos', '=car', 'moto', 'llanta', 'repuesto', 'tecnic', 'reparac', 'electric', 'plomer', 'cerrajer', 'vidrier', 'carwash', 'lavado', 'lavander', 'detailing', 'mantenim', 'instalac', 'construc', 'pintur', 'soldadur', 'vulcaniz'],
  },
  {
    id: 'salud',
    icon: 'heart',
    label: 'Salud y bienestar',
    category: 'Odontología',
    sampleName: 'Consultorio Sonrisa',
    description: 'Atención cercana y profesional. Agenda tu cita en un toque.',
    theme: 'minimal',
    buttonStyle: { shape: 'rounded', variant: 'filled', shadow: 'soft' },
    actions: [
      { type: 'whatsapp', label: 'Agenda tu cita', animation: 'pulse' },
      { type: 'maps', label: 'Cómo llegar' },
      { type: 'review', label: 'Déjanos 5 estrellas' },
      { type: 'contact', label: 'Guardar contacto' },
    ],
    links: [],
    social: { instagram: 'demo', facebook: 'demo' },
    keywords: ['consultori', 'clinic', 'dental', 'odont', 'medic', 'doctor', '=dr', '=dra', 'fisio', 'psicolog', 'nutri', 'veterin', 'farmac', 'optic', 'laborator', 'gym', 'gimnas', 'fitness', 'yoga', 'pilates', 'terapi', 'pediatr', 'dermat', 'ginecol', 'salud', 'bienestar'],
  },
  {
    id: 'profesional',
    icon: 'briefcase',
    label: 'Profesional',
    category: 'Asesoría legal y contable',
    sampleName: 'Estudio Andrade',
    description: 'Asesoría clara y a tiempo para personas y empresas.',
    theme: 'grid',
    buttonStyle: { shape: 'square', variant: 'filled', shadow: 'soft' },
    header: { logoShape: 'square' },
    actions: [
      { type: 'whatsapp', label: 'Agenda una asesoría', animation: 'shine' },
      { type: 'website', label: 'Nuestros servicios' },
      { type: 'maps', label: 'Nuestra oficina' },
      { type: 'contact', label: 'Guardar contacto' },
    ],
    links: [],
    social: { linkedin: 'demo', facebook: 'demo' },
    keywords: ['estudio', 'abogad', 'juridic', 'legal', 'contador', 'contabl', 'asesor', 'consultor', 'arquitect', 'ingenier', 'diseno', 'agencia', 'marketing', 'fotograf', 'inmobiliar', 'seguros', 'notari', 'academia', 'escuela', 'colegio', 'curso', 'clases', 'tutor', 'software', 'tech', 'digital', 'studio'],
  },
  {
    id: 'otro',
    icon: 'sparkles',
    label: 'Otro',
    category: 'Emprendimiento',
    sampleName: 'Tu negocio',
    description: 'Todo lo que tus clientes necesitan, a un toque.',
    theme: 'vibrant',
    buttonStyle: { shape: 'rounded', variant: 'filled', shadow: 'soft' },
    actions: [
      { type: 'whatsapp', label: 'Escríbenos por WhatsApp', animation: 'shine' },
      { type: 'maps', label: 'Cómo llegar' },
      { type: 'review', label: 'Déjanos 5 estrellas' },
      { type: 'contact', label: 'Guardar contacto' },
    ],
    links: [],
    social: { instagram: 'demo', facebook: 'demo', tiktok: 'demo' },
    keywords: [],
  },
]

// Rubros que rota el teléfono de la portada mientras el visitante no interactúa.
export const SHOWCASE_ROTATION = ['cafeteria', 'barberia', 'tienda', 'restaurante', 'taller', 'salud', 'profesional']

const BY_ID = new Map(RUBROS.map((rubro) => [rubro.id, rubro]))

export function getRubro(id) {
  return BY_ID.get(id) || BY_ID.get('otro')
}

export function isRubro(id) {
  return BY_ID.has(id)
}

const plain = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Deduce el rubro a partir del nombre ("Barbería El Parce" → 'barberia').
// La primera palabra reconocida decide ("Restaurante y Café" → restaurante).
// Las claves con "=" deben coincidir con la palabra completa. Devuelve '' si
// no reconoce ninguna.
export function inferRubro(name) {
  const tokens = plain(name).split(/[^a-z0-9]+/).filter(Boolean)
  for (const token of tokens) {
    for (const rubro of RUBROS) {
      const match = rubro.keywords.some((keyword) => (keyword.startsWith('=') ? token === keyword.slice(1) : token.startsWith(keyword)))
      if (match) return rubro.id
    }
  }
  return ''
}

// Configuración completa de botones fijos: primero los del rubro (en su orden y
// con sus textos) y después el resto. `enableRest` decide si los demás quedan
// activos (en el panel sí, para configurarlos después; en la demo, no).
export function rubroActionSettings(rubro, { enableRest = false } = {}) {
  const listed = rubro.actions.map((action, order) => ({
    type: action.type,
    label: action.label,
    enabled: true,
    order,
    layout: 'classic',
    thumbnail: '',
    sectionId: '',
    animation: action.animation || 'none',
  }))
  const rest = ACTION_DEFINITIONS
    .filter((definition) => !rubro.actions.some((action) => action.type === definition.type))
    .map((definition, index) => ({
      type: definition.type,
      label: definition.label,
      enabled: enableRest,
      order: listed.length + index,
      layout: 'classic',
      thumbnail: '',
      sectionId: '',
      animation: 'none',
    }))
  return [...listed, ...rest]
}

const DEMO_URL = 'https://example.com/demo'

// Perfil de ejemplo para el teléfono de la portada. Con `name` muestra el
// nombre que escribe el visitante (y sus iniciales como logo); con `theme`
// aplica el estilo elegido. Los enlaces son de demostración: el teléfono de la
// portada no es interactivo.
export function sampleBusiness({ rubro: rubroId, name, theme } = {}) {
  const rubro = getRubro(rubroId)
  const displayName = String(name || '').trim().slice(0, 80) || rubro.sampleName
  const themeId = typeof theme === 'string' && Object.prototype.hasOwnProperty.call(THEMES, theme) ? theme : rubro.theme
  return {
    slug: slugify(displayName) || 'tu-negocio',
    name: displayName,
    category: rubro.category,
    description: rubro.description,
    theme: themeId,
    logo: '',
    header: { ...DEFAULT_HEADER, ...(rubro.header || {}) },
    background: { type: 'theme' },
    buttonStyle: { ...rubro.buttonStyle },
    languages: ['es'],
    whatsapp: '593900000000',
    googleReviewUrl: DEMO_URL,
    mapsUrl: 'https://maps.google.com/',
    wazeUrl: DEMO_URL,
    menuUrl: DEMO_URL,
    website: DEMO_URL,
    phone: '',
    email: '',
    social: { ...rubro.social },
    actionSettings: rubroActionSettings(rubro),
    links: rubro.links.map((link, order) => ({
      id: `demo-${order}`,
      title: link.title,
      url: DEMO_URL,
      icon: link.icon,
      layout: 'classic',
      enabled: true,
      order,
      animation: 'none',
      sectionId: '',
      colors: {},
    })),
    bankAccounts: rubro.bank
      ? [{ id: 'demo-bank', bank: rubro.bank.bank, label: rubro.bank.label, url: `${DEMO_URL}/pago`, enabled: true, sectionId: BANK_SECTION_ID, colors: {}, animation: 'none' }]
      : [],
    sections: [{ id: BANK_SECTION_ID, title: rubro.bank?.section || 'Datos Bancarios' }],
  }
}
