// Tabla de rutas permitidas del panel de Recomendaciones (jerarquía Tema → Subtemas → Secciones → Recomendaciones) hacia la API
// administrativa de Wellezy Hub (/cms/recommendation-*). Módulo PURO (sin imports): lo usan la ruta de Nitro y las pruebas.
//
// El navegador solo habla con /api/admin/recommendation-tree/*; la ruta de Nitro autentica con el Bearer de la sesión del servidor y
// únicamente reenvía lo que está en esta tabla: método + ruta exactos y SOLO los campos de cuerpo permitidos. Nunca se reenvía
// company_id, linea_id, created_by ni el id de un padre en el cuerpo (el padre sale de la URL y Hub lo valida dentro de la línea del token).
// Las rutas públicas de lectura (/v1/web/*) nunca se usan para escribir.

export type AdminHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface AdminRoute {
  method: AdminHttpMethod
  /** Ruta en Hub, relativa a /cms. */
  hubPath: string
  /** Campos de cuerpo JSON permitidos (los demás se descartan). */
  body: readonly string[]
  /** Filtros de consulta permitidos. */
  query: readonly string[]
  /** Subida de imagen: el cuerpo trae `image` como data URL y se envía a Hub como multipart. */
  upload: boolean
}

interface Def { method: AdminHttpMethod, pattern: string, hub: string, body?: readonly string[], query?: readonly string[], upload?: boolean }

const TOPIC = ['title', 'menu_label', 'slug', 'orden', 'published'] as const
const SUBTOPIC_CREATE = ['title', 'menu_label', 'slug', 'grupo', 'orden', 'published', 'content', 'video_url'] as const
const SUBTOPIC_UPDATE = ['title', 'menu_label', 'slug', 'grupo', 'orden', 'published', 'topic_id'] as const
const SECTION = ['type', 'title', 'subtitle', 'content', 'layout', 'image_alt', 'video_url', 'cta_label', 'cta_url', 'orden', 'visible'] as const
const ITEM = ['title', 'content', 'slug', 'orden', 'published'] as const
const REORDER = ['ids'] as const

// `:id` = identificador numérico de Hub. Cada segmento literal se traduce al recurso de Hub.
const DEFS: readonly Def[] = [
  { method: 'GET', pattern: 'section-types', hub: '/recommendation-section-types' },

  { method: 'GET', pattern: 'topics', hub: '/recommendation-topics', query: ['published'] },
  { method: 'POST', pattern: 'topics', hub: '/recommendation-topics', body: TOPIC },
  { method: 'POST', pattern: 'topics/reorder', hub: '/recommendation-topics/reorder', body: REORDER },
  { method: 'GET', pattern: 'topics/:id', hub: '/recommendation-topics/:id' },
  { method: 'PUT', pattern: 'topics/:id', hub: '/recommendation-topics/:id', body: TOPIC },
  { method: 'DELETE', pattern: 'topics/:id', hub: '/recommendation-topics/:id' },

  { method: 'GET', pattern: 'topics/:id/subtopics', hub: '/recommendation-topics/:id/subtopics', query: ['published'] },
  { method: 'POST', pattern: 'topics/:id/subtopics', hub: '/recommendation-topics/:id/subtopics', body: SUBTOPIC_CREATE },
  { method: 'POST', pattern: 'topics/:id/subtopics/reorder', hub: '/recommendation-topics/:id/subtopics/reorder', body: REORDER },

  { method: 'GET', pattern: 'subtopics/:id', hub: '/recommendation-subtopics/:id' },
  { method: 'PUT', pattern: 'subtopics/:id', hub: '/recommendation-subtopics/:id', body: SUBTOPIC_UPDATE },
  { method: 'DELETE', pattern: 'subtopics/:id', hub: '/recommendation-subtopics/:id' },
  { method: 'GET', pattern: 'subtopics/:id/intro', hub: '/recommendation-subtopics/:id/intro' },
  { method: 'PUT', pattern: 'subtopics/:id/intro', hub: '/recommendation-subtopics/:id/intro', body: ['content', 'video_url'] },
  { method: 'POST', pattern: 'subtopics/:id/intro/image', hub: '/recommendation-subtopics/:id/intro/image', body: ['image'], upload: true },
  { method: 'DELETE', pattern: 'subtopics/:id/intro/image', hub: '/recommendation-subtopics/:id/intro/image' },
  { method: 'GET', pattern: 'subtopics/:id/short-link', hub: '/recommendation-subtopics/:id/short-link' },

  { method: 'GET', pattern: 'subtopics/:id/sections', hub: '/recommendation-subtopics/:id/sections' },
  { method: 'POST', pattern: 'subtopics/:id/sections', hub: '/recommendation-subtopics/:id/sections', body: SECTION },
  { method: 'POST', pattern: 'subtopics/:id/sections/reorder', hub: '/recommendation-subtopics/:id/sections/reorder', body: REORDER },

  { method: 'GET', pattern: 'sections/:id', hub: '/recommendation-sections/:id' },
  { method: 'PUT', pattern: 'sections/:id', hub: '/recommendation-sections/:id', body: SECTION },
  { method: 'DELETE', pattern: 'sections/:id', hub: '/recommendation-sections/:id' },
  { method: 'POST', pattern: 'sections/:id/image', hub: '/recommendation-sections/:id/image', body: ['image'], upload: true },
  { method: 'DELETE', pattern: 'sections/:id/image', hub: '/recommendation-sections/:id/image' },

  { method: 'GET', pattern: 'sections/:id/items', hub: '/recommendation-sections/:id/items' },
  { method: 'POST', pattern: 'sections/:id/items', hub: '/recommendation-sections/:id/items', body: ITEM },
  { method: 'POST', pattern: 'sections/:id/items/reorder', hub: '/recommendation-sections/:id/items/reorder', body: REORDER },

  { method: 'GET', pattern: 'items/:id', hub: '/recommendation-items/:id' },
  { method: 'PUT', pattern: 'items/:id', hub: '/recommendation-items/:id', body: ITEM },
  { method: 'DELETE', pattern: 'items/:id', hub: '/recommendation-items/:id' }
]

const ID_RE = /^[1-9]\d{0,9}$/

/** Resuelve (método, segmentos de la URL) a la ruta permitida de Hub, o null si no está en la tabla (404 sin llamar a Hub). */
export function resolveAdminRoute(method: string, segments: string[]): AdminRoute | null {
  const verb = method.toUpperCase()
  for (const def of DEFS) {
    if (def.method !== verb) continue
    const parts = def.pattern.split('/')
    if (parts.length !== segments.length) continue

    const ids: string[] = []
    const ok = parts.every((part, i) => {
      const seg = segments[i]!
      if (part === ':id') {
        if (!ID_RE.test(seg)) return false
        ids.push(seg)
        return true
      }
      return part === seg
    })
    if (!ok) continue

    let n = 0
    return { method: def.method, hubPath: def.hub.replace(':id', () => ids[n++]!), body: def.body ?? [], query: def.query ?? [], upload: def.upload === true }
  }
  return null
}

/** Solo los campos permitidos del cuerpo (el resto, p. ej. company_id o linea_id, se descarta). */
export function pickAllowed(body: unknown, allowed: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!body || typeof body !== 'object' || Array.isArray(body)) return out
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) out[key] = (body as Record<string, unknown>)[key]
  }
  return out
}

/** Filtros de consulta permitidos (solo `published` = 0|1). */
export function pickQuery(query: unknown, allowed: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {}
  if (!query || typeof query !== 'object') return out
  for (const key of allowed) {
    const v = (query as Record<string, unknown>)[key]
    if (key === 'published' && (v === '0' || v === '1' || v === 0 || v === 1)) out.published = String(v)
  }
  return out
}

export type TreeErrorKind = 'auth' | 'forbidden' | 'notfound' | 'conflict' | 'validation' | 'transient' | 'other'

export interface TreeErrorInfo {
  status: number | null
  kind: TreeErrorKind
  message: string
  /** Primer mensaje por campo (los errores de validación de Hub, `ids.0` → `ids`). */
  fields: Record<string, string>
  /** true = el resultado de la operación es incierto (red/servidor): no se reintenta una escritura automáticamente. */
  transient: boolean
}

/** Clasifica un error de la capa cliente (statusCode + message + fieldErrors) para mostrarlo junto a la acción que lo originó. */
export function describeTreeError(error: any): TreeErrorInfo {
  const status = Number.isSafeInteger(error?.statusCode) ? error.statusCode as number : null
  const raw = typeof error?.message === 'string' ? error.message : ''
  const fields: Record<string, string> = {}
  const errors = error?.fieldErrors
  if (errors && typeof errors === 'object') {
    for (const [key, value] of Object.entries(errors)) {
      const msg = Array.isArray(value) ? value.find(v => typeof v === 'string') : value
      const name = key.replace(/\.\d+$/, '')
      if (typeof msg === 'string' && !(name in fields)) fields[name] = msg
    }
  }
  const generic = 'No fue posible completar la acción. Intenta nuevamente.'
  switch (status) {
    case 401: return { status, kind: 'auth', message: 'Tu sesión expiró. Inicia sesión de nuevo; lo que escribiste sigue en pantalla.', fields, transient: false }
    case 403: return { status, kind: 'forbidden', message: raw || 'Tu usuario no tiene permiso para esta acción en Wellezy Hub.', fields, transient: false }
    case 404: return { status, kind: 'notfound', message: raw || 'El elemento ya no existe.', fields, transient: false }
    case 409: return { status, kind: 'conflict', message: raw || 'La acción no se puede completar por la integridad del contenido.', fields, transient: false }
    case 422: return { status, kind: 'validation', message: raw || 'Revisa los datos ingresados.', fields, transient: false }
    default: {
      const transient = status === null || status === 0 || status === 429 || status >= 500
      return { status, kind: transient ? 'transient' : 'other', message: raw || generic, fields, transient }
    }
  }
}

/** Mueve el id de la posición `index` una posición (−1 arriba, +1 abajo) y devuelve la lista completa, o null si no se puede. */
export function moveId(ids: readonly number[], index: number, direction: -1 | 1): number[] | null {
  const target = index + direction
  if (index < 0 || index >= ids.length || target < 0 || target >= ids.length) return null
  const next = [...ids]
  ;[next[index], next[target]] = [next[target]!, next[index]!]
  return next
}
