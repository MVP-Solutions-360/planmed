// Acciones de compartir (copiar enlace y WhatsApp). Módulo PURO (sin imports): lo usan el componente, la página y las pruebas.
//
// Reglas:
//  · El enlace corto SOLO es el que entrega Wellezy Hub (`short_url`); nunca se construye ni se adivina.
//  · Sin enlace corto se usa la URL pública de la página actual: origen del sitio (configuración) + ruta del contenido ya cargado.
//    Una ruta del panel (/admin) o de la API (/api), con doble barra, barra invertida o caracteres de control se rechaza (null).
//  · WhatsApp recibe título + URL en un único parámetro `text` bien codificado; no se envía nada automáticamente.

export type ShareKind = 'short' | 'canonical'
export interface ShareTarget { url: string, kind: ShareKind }

/** URL absoluta http(s) sin credenciales (mismo criterio que el árbol de recomendaciones). */
export function httpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  // eslint-disable-next-line no-control-regex
  if (!raw || raw.length > 2048 || /[\u0000- \u007F\\]/.test(raw)) return null
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    if (u.username || u.password || !u.hostname) return null
    return raw
  } catch {
    return null
  }
}

/** Ruta pública interna válida: empieza con una sola «/», sin esquema, sin barra invertida y fuera de /admin y /api. */
export function publicPath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 512) return null
  // eslint-disable-next-line no-control-regex
  if (!value.startsWith('/') || value.startsWith('//') || /[\u0000- \u007F\\]/.test(value)) return null
  if (/^\/(admin|api)(\/|$|\?|#)/i.test(value)) return null
  return value
}

/** Destino a compartir: el enlace corto de Hub si es válido; si no, la URL pública de la página; null si no hay nada seguro que compartir. */
export function resolveShareTarget(input: { shortUrl?: unknown, origin?: unknown, path?: unknown }): ShareTarget | null {
  const short = httpUrl(input.shortUrl)
  if (short) return { url: short, kind: 'short' }
  const origin = httpUrl(typeof input.origin === 'string' ? input.origin.replace(/\/+$/, '') : input.origin)
  const path = publicPath(input.path)
  if (!origin || !path) return null
  try {
    const u = new URL(origin)
    if (u.pathname !== '/' || u.search || u.hash) return null
  } catch {
    return null
  }
  return { url: `${origin}${path}`, kind: 'canonical' }
}

/** Título limpio para el mensaje (una línea, sin controles, máx. 140 caracteres). */
export function shareTitle(value: unknown): string {
  // eslint-disable-next-line no-control-regex
  const t = (typeof value === 'string' ? value : '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim()
  return t.length > 140 ? `${t.slice(0, 139).trimEnd()}…` : t
}

/** Enlace de compartir de WhatsApp (https://wa.me/?text=…): el título y la URL van en el mismo parámetro, codificado. */
export function whatsappShareUrl(title: unknown, url: string): string {
  const t = shareTitle(title)
  return `https://wa.me/?text=${encodeURIComponent(t ? `${t}\n${url}` : url)}`
}
