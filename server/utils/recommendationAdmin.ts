import type { H3Event } from 'h3'
import { pickAllowed, pickQuery, resolveAdminRoute } from '#shared/utils/recommendationAdminApi'

// Traducción de las respuestas de la API administrativa de Recomendaciones de Hub (/cms/recommendation-*) a errores HTTP de Planmed.
// A diferencia de `translate` (noticias), conserva el 409 de integridad con el mensaje real del Hub (p. ej. «el tema tiene subtemas»)
// y marca como transitorios (503) los fallos de red/servidor. Ningún error se interpreta como guardado exitoso.

const MSG_FORBIDDEN_WRITE = 'Tu usuario no tiene permiso para esta acción en Wellezy Hub.'
const MSG_HUB_INCOMPATIBLE = 'Wellezy Hub no tiene habilitada la administración de recomendaciones (versión incompatible). Avisa al administrador; no es un problema de tu línea.'
const MSG_UNAVAILABLE_TREE = 'No fue posible conectar con Wellezy Hub. Intenta nuevamente; no se sabe si el cambio llegó a guardarse, revisa antes de repetirlo.'

/** Mensaje de Hub solo si es texto corto y en español (los de autorización por defecto de Laravel están en inglés). */
function hubMessage(data: any): string | null {
  const message = data?.message
  if (typeof message !== 'string' || !message.trim() || message.length > 300) return null
  if (/unauthori[sz]ed|forbidden|this action/i.test(message)) return null
  return message
}

// `hasId`: la ruta lleva el id de un registro. Un 404 en una ruta de colección (listar, crear, ordenar, catálogo) no puede significar «el elemento no
// existe»: Hub no tiene esa ruta (versión anterior sin la API de recomendaciones). Se informa como incompatibilidad (501), no como falta de pertenencia.
export function translateTree(status: number, data: any, session: { clear: () => Promise<unknown> }, hasId = true): never | void {
  if (status >= 200 && status < 300) return
  switch (status) {
    case 401:
      throw authError(401, 'No autenticado')
    case 403:
      throw authError(403, hubMessage(data) ?? MSG_FORBIDDEN_WRITE)
    case 404:
      if (!hasId) throw createError({ statusCode: 501, message: MSG_HUB_INCOMPATIBLE, data: { message: MSG_HUB_INCOMPATIBLE } })
      throw authError(404, 'El elemento no existe o no pertenece a tu línea.')
    case 409:
      throw createError({ statusCode: 409, message: hubMessage(data) ?? 'La acción no se puede completar por la integridad del contenido.', data: { message: hubMessage(data) ?? '' } })
    case 422: {
      const message = hubMessage(data) ?? 'Revisa los datos ingresados.'
      throw createError({ statusCode: 422, message, data: { message, errors: data?.errors && typeof data.errors === 'object' ? data.errors : {} } })
    }
    case 429:
      throw authError(429, 'Demasiadas solicitudes. Espera unos segundos e intenta nuevamente.')
    default:
      throw createError({ statusCode: 503, message: MSG_UNAVAILABLE_TREE, data: { message: MSG_UNAVAILABLE_TREE, transient: true } })
  }
}

export function treeSegments(event: H3Event): string[] {
  const raw = String(getRouterParam(event, 'path') ?? '')
  return raw === '' ? [] : raw.split('/')
}


// Proxy ADMINISTRATIVO de la jerarquía de Recomendaciones (Tema → Subtemas → Secciones → Recomendaciones) hacia /cms/recommendation-* de
// Wellezy Hub. Solo reenvía las rutas y campos de shared/utils/recommendationAdminApi.ts; el Bearer de Hub sale de la sesión del servidor
// y nunca llega al navegador. Empresa y línea las deriva Hub del token. NO reintenta escrituras (una repetición podría duplicar contenido).
export async function handleTreeRequest(event: H3Event) {
  // Primero el origen y la sesión (PM-SEC-01 y 401), después la ruta: una petición sin sesión nunca llega a resolver nada.
  const { session, token } = await adminSession(event)
  const route = resolveAdminRoute(String(event.method), treeSegments(event))
  if (!route) throw createError({ statusCode: 404, message: 'Ruta no disponible.' })
  const path = `/cms${route.hubPath}`

  let res: { status: number, data?: any }
  if (route.upload) {
    const dataUrl = (await readBody(event).catch(() => null))?.image
    const blob = typeof dataUrl === 'string' ? dataUrlToBlob(dataUrl) : null
    if (!blob) throw createError({ statusCode: 422, message: 'La imagen debe ser JPG, PNG o WebP de máximo 5 MB.', data: { message: 'La imagen debe ser JPG, PNG o WebP de máximo 5 MB.', errors: { image: ['La imagen debe ser JPG, PNG o WebP de máximo 5 MB.'] } } })
    const form = new FormData()
    form.append('image', blob, `imagen.${blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'}`)
    res = await wellezyUpload<any>(event, token, path, form)
  } else if (route.method === 'GET' || route.method === 'DELETE') {
    res = await wellezyRequest<any>(event, token, route.method, path, { query: pickQuery(getQuery(event), route.query) })
  } else {
    const body = pickAllowed(await readBody(event).catch(() => null), route.body)
    res = await wellezyRequest<any>(event, token, route.method, path, { body })
  }

  if (res.status === 401) await session.clear()
  translateTree(res.status, res.data, session, route.hasId)

  // Una respuesta 2xx que no es un objeto JSON no es un guardado verificable.
  if (!res.data || typeof res.data !== 'object') throw createError({ statusCode: 503, message: 'Wellezy Hub respondió con un formato inesperado.', data: { transient: true } })
  return res.data
}
