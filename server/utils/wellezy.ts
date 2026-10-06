import type { H3Event } from 'h3'

// Cliente mínimo de la API de autenticación de Wellezy Hub. Solo servidor: el Bearer nunca sale de aquí
// hacia el navegador y no se escribe en logs.

const TIMEOUT_MS = 10_000

export interface WellezyUser {
  id: number
  name: string
  email: string
  role: { id: number, name: string } | null
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

async function call<T>(event: H3Event, path: string, options: { method: 'GET' | 'POST', body?: Record<string, unknown>, token?: string }): Promise<WellezyResult<T>> {
  const base = baseUrl(event)
  if (!base) return { status: 0 }

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  try {
    const res = await $fetch.raw<T>(`${base}${path}`, {
      method: options.method,
      body: options.body,
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
