import type { H3Event } from 'h3'

// Cliente mínimo de la API de autenticación de Wellezy Hub. Solo servidor: el Bearer nunca sale de aquí
// hacia el navegador y no se escribe en logs.

const TIMEOUT_MS = 10_000

export interface WellezyUser {
  id: number
  name: string
  email: string
  role: { id: number, name: string } | null
  /** personnels.is_area_leader del Hub (líder de la línea). */
  is_area_leader?: boolean
}

export interface WellezyResult<T = unknown> {
  /** Código HTTP del Hub, o 0 si no respondió o respondió algo inesperado. */
  status: number
  data?: T
}

function baseUrl(event: H3Event): string {
  const base = String(useRuntimeConfig(event).wellezyApiBaseUrl || '').replace(/\/+$/, '')
  if (!base) console.error('[auth] NUXT_WELLEZY_API_BASE_URL no está configurada.')
  return base
}

async function call<T>(event: H3Event, path: string, options: { method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: Record<string, unknown>, query?: Record<string, unknown>, token?: string, headers?: Record<string, string> }): Promise<WellezyResult<T>> {
  const base = baseUrl(event)
  if (!base) return { status: 0 }

  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers }
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  try {
    const res = await $fetch.raw<T>(`${base}${path}`, {
      method: options.method,
      body: options.body,
      query: options.query,
      headers,
      timeout: TIMEOUT_MS,
      retry: 0,
      ignoreResponseError: true
    })
    return { status: res.status, data: res._data as T }
  } catch {
    // Red caída, timeout, DNS... Sin detalles en logs (podrían incluir la URL interna).
    return { status: 0 }
  }
}

function isWellezyUser(value: any): value is WellezyUser {
  return !!value
    && Number.isSafeInteger(Number(value.id))
    && typeof value.name === 'string'
    && typeof value.email === 'string'
    && (value.role === null || (value.role && Number.isSafeInteger(Number(value.role.id)) && typeof value.role.name === 'string'))
}

export async function wellezyLogin(event: H3Event, email: string, password: string): Promise<WellezyResult<{ token: string, user: WellezyUser }>> {
  const config = useRuntimeConfig(event)
  const res = await call<any>(event, '/auth/login', {
    method: 'POST',
    body: { email, password, company: config.wellezyCompanySlug, line: config.wellezyLineSlug }
  })
  if (res.status !== 200) return { status: res.status }
  if (typeof res.data?.token !== 'string' || !res.data.token || !isWellezyUser(res.data.user)) return { status: 0 }
  return { status: 200, data: { token: res.data.token, user: res.data.user } }
}

export async function wellezyMe(event: H3Event, token: string): Promise<WellezyResult<{ user: WellezyUser }>> {
  const res = await call<any>(event, '/auth/me', { method: 'GET', token })
  if (res.status !== 200) return { status: res.status }
  if (!isWellezyUser(res.data?.user)) return { status: 0 }
  return { status: 200, data: { user: res.data.user } }
}

export async function wellezyLogout(event: H3Event, token: string): Promise<number> {
  return (await call(event, '/auth/logout', { method: 'POST', token })).status
}

// Llamada autenticada genérica (Bearer de la sesión del servidor) para los módulos del CMS.
export function wellezyRequest<T>(
  event: H3Event,
  token: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  options: { body?: Record<string, unknown>, query?: Record<string, unknown> } = {}
): Promise<WellezyResult<T>> {
  return call<T>(event, path, { method, token, ...options })
}

// Subida multipart (p. ej. portada de una noticia) con el Bearer de la sesión del servidor.
export async function wellezyUpload<T>(event: H3Event, token: string, path: string, form: FormData): Promise<WellezyResult<T>> {
  const base = baseUrl(event)
  if (!base) return { status: 0 }
  try {
    const res = await $fetch.raw<T>(`${base}${path}`, {
      method: 'POST',
      body: form,
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      timeout: 30_000,
      retry: 0,
      ignoreResponseError: true
    })
    return { status: res.status, data: res._data as T }
  } catch {
    return { status: 0 }
  }
}

// Lectura pública (sin Bearer) de la API web de Hub. El tenant lo resuelve Hub con el header
// X-Tenant-Linea, cuyo valor sale de la configuración de Planmed (wellezyLineSlug), nunca del navegador.
export function wellezyPublicGet<T>(event: H3Event, path: string): Promise<WellezyResult<T>> {
  const lineSlug = String(useRuntimeConfig(event).wellezyLineSlug || '')
  if (!lineSlug) console.error('[prp] NUXT_WELLEZY_LINE_SLUG no está configurada.')
  return call<T>(event, path, { method: 'GET', headers: { 'X-Tenant-Linea': lineSlug } })
}

// Escritura pública (sin Bearer) en la API web de Hub (p. ej. inscripción al PRP). El tenant sale de la configuración del servidor;
// `headers` admite la clave de idempotencia. Sin reintentos: el llamador decide (una escritura repetida solo es segura con la misma clave).
export function wellezyPublicPost<T>(event: H3Event, path: string, body: Record<string, unknown>, headers: Record<string, string> = {}): Promise<WellezyResult<T>> {
  const lineSlug = String(useRuntimeConfig(event).wellezyLineSlug || '')
  if (!lineSlug) console.error('[prp] NUXT_WELLEZY_LINE_SLUG no está configurada.')
  return call<T>(event, path, { method: 'POST', body, headers: { 'X-Tenant-Linea': lineSlug, ...headers } })
}
