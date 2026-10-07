import type { H3Event } from 'h3'

// Proxy del módulo PRP hacia Wellezy Hub (/api/prp-referrers). Solo servidor: el Bearer de la sesión
// nunca llega al navegador. La autoridad final (permisos y empresa/línea) es Hub; aquí solo se exige
// una sesión de administrador válida y se traducen los errores a mensajes para la UI.
// Empresa y línea no se envían: Hub las deriva del contexto del token emitido en el login.

const MSG_PRP_UNAVAILABLE = 'No fue posible conectar con Wellezy Hub. Intenta nuevamente.'
const MSG_PRP_FORBIDDEN = 'No tienes permiso para realizar esta acción.'

export function parsePrpId(event: H3Event): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id <= 0) throw authError(404, 'El micrositio no existe.')
  return id
}

// Solo los campos que Hub acepta; nunca se reenvía nada más del cuerpo recibido.
export function pickPrpBody(body: any): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!body || typeof body !== 'object') return out
  for (const key of ['name', 'external_code', 'slug', 'title', 'is_active']) {
    if (key in body) out[key] = body[key]
  }
  return out
}

export function pickPrpQuery(query: Record<string, any>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of ['search', 'is_active', 'page', 'per_page']) {
    if (query[key] !== undefined && query[key] !== '') out[key] = query[key]
  }
  return out
}

export async function hubPrp<T = any>(
  event: H3Event,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  options: { body?: Record<string, unknown>, query?: Record<string, unknown> } = {}
): Promise<T> {
  assertSameOrigin(event)
  setHeader(event, 'Cache-Control', 'no-store')

  const session = await useAdminSession(event)
  const token = session.data.token
  if (!token || !session.data.user) throw authError(401, 'No autenticado')

  const res = await wellezyRequest<any>(event, token, method, `/prp-referrers${path}`, options)

  switch (res.status) {
    case 200:
    case 201:
      return res.data as T
    case 401:
      // Token vencido o revocado en Hub.
      await session.clear()
      throw authError(401, 'No autenticado')
    case 403:
      throw authError(403, MSG_PRP_FORBIDDEN)
    case 404:
      throw authError(404, 'El micrositio no existe.')
    case 422: {
      const message = typeof res.data?.message === 'string' ? res.data.message : 'Revisa los datos ingresados.'
      throw createError({ statusCode: 422, message, data: { message, errors: res.data?.errors ?? {} } })
    }
    case 429:
      throw authError(429, 'Demasiadas solicitudes. Espera unos segundos e intenta nuevamente.')
    default:
      throw authError(503, MSG_PRP_UNAVAILABLE)
  }
}
