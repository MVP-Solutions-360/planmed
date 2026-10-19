// Guía de uso del panel (pantalla Configuración): qué hace cada opción y DÓNDE vive su contenido.
// Datos puros (sin dependencias) para poder probarlos. Debe mantenerse alineada con documentacion/guias/02-guia-panel-administrativo.md.

/** hub = se guarda en la BD de Wellezy Hub · web = vive en el servidor de la web de Planmed · code = está en el código (no editable en el panel). */
export type GuideStorage = 'hub' | 'web' | 'code'

export const GUIDE_STORAGE: Record<GuideStorage, { label: string, short: string, description: string, badge: string }> = {
  hub: {
    label: 'Wellezy Hub',
    short: 'Hub',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Se guarda en la base de datos de Wellezy Hub (el CRM administrativo). Al guardar, el Hub se actualiza y la web pública lo lee de allí. El Hub decide tus permisos (ver, crear, editar, eliminar).'
  },
  web: {
    label: 'Servidor de la web',
    short: 'Web',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Vive solo en el servidor de la web de Planmed (archivos propios). No se envía al Hub ni se ve en él. Hay que incluirlo en los respaldos de la web.'
  },
  code: {
    label: 'Código de la web',
    short: 'Código',
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    description: 'Está escrito en el código del sitio. No se edita desde el panel: para cambiarlo hay que pedírselo a desarrollo.'
  }
}

/** Dirección del Hub (CRM administrativo). Los accesos directos se arman con esta base + la ruta de cada pantalla. */
export const HUB_BASE_URL = 'https://wellezyhub.com'

export interface GuideHubLink {
  label: string
  /** Ruta de la pantalla dentro del Hub (empieza por /). */
  path: string
}

export interface GuideModule {
  id: string
  title: string
  /** Ruta del panel (vacía si no tiene pantalla propia). */
  route: string
  storage: GuideStorage
  /** Qué se ve en la web pública. */
  publicEffect: string
  /** Qué hace y cómo se usa, en pasos cortos. */
  steps: string[]
  /** Advertencias o detalles a tener en cuenta. */
  notes?: string[]
  /** Pantallas del Hub donde también se puede ver o gestionar este contenido (solo si existen). */
  hubLinks?: GuideHubLink[]
}

export function hubUrl(path: string): string {
  return `${HUB_BASE_URL}${path}`
}

export const GUIDE_MODULES: GuideModule[] = [
  {
    id: 'procedimientos',
    title: 'Procedimientos',
    route: '/admin/procedimientos',
    storage: 'hub',
    publicEffect: 'Menú y página «Procedimientos», fichas de cada procedimiento y «Procedimientos destacados» del inicio.',
    steps: [
      'Los procedimientos se administran centralmente en Wellezy Hub (catálogo «cirugías» y su habilitación por línea). Planmed no guarda una copia: consulta el catálogo de su línea mediante la API del Hub, así que los cambios se hacen en el Hub o desde este panel, que escribe en el Hub.',
      'Hay dos tipos. «Maestro»: procedimiento global del catálogo, que no pertenece a ninguna empresa ni línea y solo se publica en las líneas donde esté habilitado. «Propio»: procedimiento específico de una empresa y una línea; el Hub lo asigna a la empresa y la línea de tu sesión.',
      'Crear no es lo mismo que publicar. Un maestro nuevo (creado en el Hub) no queda visible en ninguna web hasta que se habilite para la línea: en la lista, usa el botón de habilitar de su fila. Un procedimiento propio que crees desde este panel queda habilitado en tu línea.',
      'En la lista, la estrella marca o desmarca un procedimiento como destacado (aparece primero y en «Procedimientos destacados» del inicio). El botón de activar actúa así: en un maestro lo habilita o deshabilita solo en Planmed; en un propio lo activa o desactiva. Desactivar no elimina: el procedimiento se conserva y puede reactivarse.',
      'Un maestro solo se puede habilitar, deshabilitar o destacar; su contenido global no se edita aquí. Un propio se edita completo con «Nuevo Procedimiento» o con el lápiz: nombre, slug (URL), categoría, descripción corta, «¿Qué es?», ficha técnica, perfil del paciente, imagen principal, galería y SEO.',
      'Pulsa Guardar. Las imágenes nuevas se suben en ese momento.'
    ],
    notes: [
      'Cambiar el slug de un procedimiento cambia su URL pública.',
      'Los cambios se guardan en el Hub, pero no se garantiza que la web pública los muestre al instante: si no ves un cambio, revisa que el procedimiento esté activo y habilitado en tu línea.',
      'Crear un procedimiento global o elegir otra empresa o línea se hace en el Hub (superadmin). Desde este panel solo se crean procedimientos propios de tu línea.',
      'Usa «Procedimientos en el Hub» (catálogo vigente). No uses /procedimientos del Hub: es un módulo antiguo que no alimenta la web.'
    ],
    hubLinks: [{ label: 'Procedimientos en el Hub', path: '/cirugias' }, { label: 'Crear procedimiento en el Hub', path: '/cirugias/create' }]
  },
  {
    id: 'noticias',
    title: 'Noticias',
    route: '/admin/noticias',
    storage: 'hub',
    publicEffect: 'Página «Noticias» y cada artículo.',
    steps: [
      'Filtra la lista por Todos, Publicados o Borradores.',
      '«Nueva Noticia»: título, slug, extracto y contenido con formato; opcionalmente un post de Instagram y un video de YouTube.',
      'Activa «Noticia publicada», elige la fecha, sube la portada (16:9) y completa el SEO.',
      'Guardar cambios. Para eliminar usa el botón de la lista y confirma.'
    ],
    notes: ['Eliminar una noticia no se puede deshacer.'],
    hubLinks: [{ label: 'Noticias en el Hub', path: '/posts/cms' }, { label: 'Crear noticia en el Hub', path: '/posts/cms/create' }]
  },
  {
    id: 'pacientes',
    title: 'Nuestros Pacientes',
    route: '/admin/testimonios',
    storage: 'hub',
    publicEffect: 'Páginas «Videos», «Antes y después» y «Programa de referidos» (y su submenú).',
    steps: [
      'Pestaña Videos: agrega enlaces de YouTube (título opcional) y marca cuáles están visibles.',
      'Pestaña Antes y después: cada caso lleva título, foto del antes y foto del después; actívalo con «Publicado». Al final puedes agregar videos de Instagram.',
      'Pestaña Programa de referidos: escribe el título y el texto de la página. Si lo dejas vacío, la web muestra el contenido del programa que ya trae incluido.',
      'Con el interruptor Publicado/Oculto puedes quitar «Videos» o «Antes y después» de la web y del menú sin borrar nada.',
      'Guardar cambios guarda las tres pestañas a la vez.'
    ]
  },
  {
    id: 'recomendaciones',
    title: 'Recomendaciones',
    route: '/admin/recomendaciones/temas',
    storage: 'hub',
    publicEffect: 'Menú «Recomendaciones» por temas principales y sus subtemas (/recomendaciones/tema/subtema), con sus secciones y recomendaciones.',
    steps: [
      'Crea un tema principal y ábrelo para añadir sus subtemas; cada subtema es una página con su introducción, sus secciones y su enlace corto.',
      'En el subtema edita la introducción (texto, imagen y vídeo) y añade secciones: descripción, lista de recomendaciones, texto con botón, contacto o personalizada. El botón es opcional.',
      'En las secciones de lista añade cada recomendación individual; ordénalas con las flechas y publícalas u ocúltalas.',
      'Un tema solo se elimina sin subtemas, un subtema sin secciones y una sección sin recomendaciones. El Hub decide tus permisos.'
    ],
    notes: ['Un tema oculto oculta todos sus subtemas en la web. El enlace corto lo genera el Hub al publicar.']
  },
  {
    id: 'micrositios',
    title: 'Micrositios (PRP)',
    route: '/admin/micrositios',
    storage: 'hub',
    publicEffect: 'Páginas de referidores en /prp/<slug> con su formulario.',
    steps: [
      'Filtra por Activos o Inactivos.',
      '«Nuevo Micrositio»: nombre, código PRP (el del CRM médico, que se envía con cada formulario), slug y título.',
      'Mantén «Micrositio activo» encendido para que el enlace público funcione y comparte el enlace que se muestra al final.',
      'Guardar cambios.'
    ],
    notes: ['Si cambias el slug, el enlace que ya compartiste deja de funcionar.']
  },
  {
    id: 'nosotros',
    title: 'Nosotros → Nosotros',
    route: '/admin/nosotros',
    storage: 'web',
    publicEffect: 'Página «Nosotros» completa. Las preguntas frecuentes también salen en «Servicios» y «Financiación», y el contacto en «Financiación».',
    steps: [
      'Portada: título, descripción de la imagen (accesibilidad) e imagen.',
      'Información institucional: título, descripción legal y tres párrafos, con formato.',
      'Video institucional: pega el enlace de YouTube; se valida y muestra vista previa.',
      'Preguntas frecuentes: agrega, edita, ordena con Subir/Bajar, activa o desactiva y elimina. Una pregunta activa necesita pregunta y respuesta.',
      'Contacto: dirección, teléfono, correo, horario, redes (enlaces https) y «Mostrar mapa» (necesita dirección y ciudad).',
      'Guardar cambios (barra fija inferior). Los errores se marcan en rojo bajo cada campo.'
    ],
    notes: ['Este contenido NO está en el Hub: no se ve ni se respalda desde allí.']
  },
  {
    id: 'clinicas',
    title: 'Nosotros → Clínicas aliadas',
    route: '/admin/paginas/clinicas-aliadas',
    storage: 'web',
    publicEffect: 'Página «Clínicas aliadas» (una tarjeta por clínica) y la sección «Red médica aliada» del inicio.',
    steps: [
      'Textos de la página: título, subtítulo y contenido introductorio; se guardan con «Guardar textos».',
      '«Agregar clínica» (aparece arriba): nombre, descripción e imagen principal son obligatorios; la galería es opcional.',
      '«¿Agregar documentos?» habilita título y archivos (PDF o imágenes); solo son obligatorios si decides agregar un documento.',
      'Ordena con Subir/Bajar (ese es el orden en la web) y guarda con «Guardar clínicas».'
    ],
    notes: [
      'Hay dos botones de guardado: uno para los textos y otro para las clínicas.',
      'Los archivos se suben al instante; si no guardas, quedan en el servidor sin usarse.'
    ]
  },
  {
    id: 'configuracion',
    title: 'Configuración',
    route: '/admin/configuracion',
    storage: 'hub',
    publicEffect: 'No afecta la web pública.',
    steps: [
      'Pueden entrar el líder de la línea y la diseñadora. El líder ve las pestañas Configuración y Tasa de usura; la diseñadora solo ve Tasa de usura y la guía.',
      'Pestaña Tasa de usura: muestra la tasa de interés mensual vigente (con quién y cuándo la cambió), permite escribir una nueva con punto decimal y hasta cuatro decimales (por ejemplo 2.0126) y guarda el historial. El simulador de Financiación y el formulario «Solicitar financiación» calculan la cuota con exactamente esa tasa; si no se puede leer, muestran que la simulación no está disponible.',
      'Pestaña Configuración (solo líder): lista los colaboradores (con usuario) de la misma empresa y línea que tu usuario. Busca por nombre o correo, filtra por Activos o Inactivos y pasa de página.',
      'El listado es de solo lectura: activar o desactivar usuarios todavía no está disponible desde el panel.',
      'Pestaña Guía del panel: esta guía, con cómo usar cada módulo y dónde vive cada contenido.'
    ],
    notes: [
      'La empresa y la línea salen del usuario con el que iniciaste sesión, no se configuran en la web.',
      'La tasa se guarda en el servidor de la web (no en Wellezy Hub). Al desplegar por primera vez arranca en 2.0000 % mensual y no se vuelve a pisar.'
    ],
    hubLinks: [{ label: 'Usuarios en el Hub', path: '/users' }]
  }
]

/** Contenido de la web que NO se edita en el panel. */
export const GUIDE_FIXED_PAGES: { name: string, route: string, note: string }[] = [
  { name: 'Inicio (textos)', route: '/', note: 'Solo cambian los procedimientos destacados y las clínicas de «Red médica aliada».' },
  { name: 'Quiénes somos', route: '/quienes-somos', note: 'Texto y videos fijos.' },
  { name: 'Servicios', route: '/servicios', note: 'Fijo; las preguntas frecuentes se editan en Nosotros.' },
  { name: 'Financiación y simulador', route: '/financiacion', note: 'Fijo; las preguntas frecuentes y el contacto se editan en Nosotros. El simulador usa la tasa de usura mensual que se configura en Configuración.' },
  { name: 'Estudio de créditos', route: '/estudio-de-creditos', note: 'Formulario maquetado (aún no funcional).' },
  { name: 'Información precontractual', route: '/informacion-precontractual', note: 'Texto legal fijo.' },
  { name: 'Política de datos personales', route: '/politica-datos-personales', note: 'Texto y enlaces a PDF fijos.' },
  { name: 'Recursos', route: '/recursos', note: 'Aún sin contenido.' }
]

/** Resumen por origen: qué módulos viven dónde. */
export function guideModulesBy(storage: GuideStorage): GuideModule[] {
  return GUIDE_MODULES.filter(m => m.storage === storage)
}
