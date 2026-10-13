// Contenido de la página de error del sitio (error.vue) según el código HTTP. Lógica pura (sin Nuxt) para poder probarla con Node.
//  - 404 es "no existe"; 401/403 NO se convierten en 404; un fallo temporal de conexión/servicio (503…) no se confunde con una ruta inexistente.
//  - Nunca se muestran trazas, excepciones ni mensajes técnicos: el texto sale de aquí. La única excepción es el mensaje de un 403 del panel
//    (p. ej. «Solo el líder de la línea puede acceder a la configuración»), que es texto de usuario escrito a propósito.

export type SiteErrorVariant = 'not-found' | 'auth' | 'forbidden' | 'unavailable' | 'unexpected' | 'bad-request'

export interface SiteErrorView {
  variant: SiteErrorVariant
  code: number
  title: string
  message: string
  /** Reintentar tiene sentido (fallo temporal o inesperado); en 404/401/403 no. */
  retry: boolean
  /** Ofrecer «Iniciar sesión» (sesión del panel vencida). */
  login: boolean
  /** La ruta es del panel: se ofrece volver al panel además del inicio. */
  admin: boolean
}

export interface SiteErrorInput { statusCode?: number | null, statusMessage?: string | null, path?: string | null }

const SAFE_FORBIDDEN_MESSAGE = /^[\p{L}\p{N} .,;:¿?¡!()«»'"áéíóúñÁÉÍÓÚÑ-]{8,160}$/u

export const isAdminPath = (path?: string | null) => /^\/admin(\/|$)/.test(String(path ?? ''))

export function describeSiteError(input: SiteErrorInput): SiteErrorView {
  const raw = Number(input.statusCode)
  const code = Number.isInteger(raw) && raw >= 400 && raw <= 599 ? raw : 500
  const admin = isAdminPath(input.path)
  const base = { code, admin, retry: false, login: false }

  if (code === 404) {
    return { ...base, variant: 'not-found', title: 'Esta página no está disponible', message: 'La dirección no existe o el contenido ya no está disponible. Revisa que esté bien escrita o vuelve al inicio para seguir navegando.' }
  }
  if (code === 401) {
    return { ...base, variant: 'auth', login: true, title: 'Necesitas iniciar sesión', message: 'Tu sesión no está activa o ya expiró. Inicia sesión de nuevo para continuar.' }
  }
  if (code === 403) {
    const custom = admin && typeof input.statusMessage === 'string' && SAFE_FORBIDDEN_MESSAGE.test(input.statusMessage.trim()) ? input.statusMessage.trim() : ''
    return { ...base, variant: 'forbidden', title: 'No tienes acceso a esta sección', message: custom || 'Tu usuario no tiene permiso para ver esta página. Si crees que es un error, consulta con quien administra tu cuenta.' }
  }
  if (code === 502 || code === 503 || code === 504 || code === 429) {
    return { ...base, variant: 'unavailable', retry: true, title: 'No pudimos cargar el contenido', message: 'Es un problema temporal de conexión con nuestros servicios, no de la dirección que visitaste. Inténtalo de nuevo en unos segundos.' }
  }
  if (code >= 500) {
    return { ...base, variant: 'unexpected', retry: true, title: 'Estamos teniendo dificultades', message: 'Ocurrió un error inesperado de nuestro lado. Ya puedes volver a intentarlo o regresar al inicio.' }
  }
  return { ...base, variant: 'bad-request', title: 'No pudimos procesar la solicitud', message: 'Algo en la dirección o en la solicitud no es válido. Vuelve al inicio e inténtalo de nuevo.' }
}
