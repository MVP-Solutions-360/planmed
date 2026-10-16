// Tasa de interés mensual del simulador, a través de las rutas internas de Nitro. La lectura pública (simulador y formulario de
// solicitud) sale de /api/public/financing-rate; la administración, de /api/admin/config/financing-rate. La tasa vive en el servidor
// de Planmed (no en Wellezy Hub ni en el navegador: no se usa localStorage). No existe ningún valor de respaldo: si no se puede leer,
// se lanza FinancingRateUnavailableError y quien consulta debe mostrar «simulación no disponible».

export type Fetcher = <T>(url: string, options?: Record<string, unknown>) => Promise<T>

export interface PublicFinancingRate { rate: string, updatedAt: string }
export interface FinancingRateActor { id: number | null, name: string }
export interface FinancingRateHistoryEntry { rate: string, updatedAt: string, updatedBy: FinancingRateActor, source: 'initial' | 'admin' }
export interface AdminFinancingRate extends FinancingRateHistoryEntry { history: FinancingRateHistoryEntry[] }

export class FinancingRateUnavailableError extends Error {
  constructor(message = 'La simulación no está disponible en este momento.') {
    super(message)
    this.name = 'FinancingRateUnavailableError'
  }
}

export type FinancingRateSaveError = Error & { statusCode?: number, field?: string }

// Funciones de petición POR DEFECTO. Ambas se resuelven al LLAMAR (nunca al importar el módulo).
//
// - Pública (simulador y formulario de solicitud): no necesita cookies ni credenciales, así que usa el `$fetch` GLOBAL de Nuxt/Nitro y NO
//   depende del contexto de Nuxt: funciona igual en eventos del navegador, temporizadores (debounce) y SSR. No se importa `ofetch`: no es una
//   dependencia declarada del proyecto y su `$fetch` suelto no es el de Nuxt (sin baseURL ni llamadas locales de Nitro para rutas relativas en
//   SSR). Nuxt define `globalThis.$fetch` al arrancar el cliente y el servidor; si faltara, se falla con un error claro.
// - Administración (por defecto): `useRequestFetch()`. En el navegador es `$fetch` (las cookies httpOnly viajan solas, same-origin); en el
//   servidor reenvía las cookies de la petición entrante y SOLO es válido dentro del contexto de Nuxt (setup, plugin, middleware y antes de
//   cualquier `await`). Por eso el panel NO usa este valor por defecto: crea su servicio con `createAdminFinancingRateService()` en el setup,
//   donde el contexto es válido, y reutiliza esa función en onMounted y eventos sin perder el reenvío de cookies en SSR.
const adminFetch: Fetcher = (url, options) => (useRequestFetch() as any)(url, options)
const publicFetch: Fetcher = (url, options) => {
  const nuxtFetch = (globalThis as any).$fetch
  if (typeof nuxtFetch !== 'function') throw new Error('$fetch de Nuxt no está disponible.')
  return nuxtFetch(url, options)
}

/** Vigencia máxima de la tasa en memoria. Pasado este tiempo se vuelve a consultar; nunca se usa un valor vencido si la consulta falla. */
export const PUBLIC_RATE_TTL_MS = 30_000

export function toSaveError(e: any): FinancingRateSaveError {
  const data = e?.data?.data ?? e?.data
  const message = typeof data?.message === 'string' && data.message ? data.message : 'No fue posible conectar con el servidor. Intenta nuevamente.'
  const error = new Error(message) as FinancingRateSaveError
  error.statusCode = e?.statusCode ?? e?.response?.status
  if (typeof data?.errors?.rate === 'string') error.field = data.errors.rate
  return error
}

export class FinancingRateService {
  private cache: { value: PublicFinancingRate, at: number } | null = null
  private inflight: Promise<PublicFinancingRate> | null = null

  private readonly request: Fetcher
  private readonly publicRequest: Fetcher
  private readonly now: () => number

  /** `request` y `publicRequest` se inyectan en las pruebas; si solo se inyecta `request`, también atiende la lectura pública. */
  constructor(request?: Fetcher, now: () => number = Date.now, publicRequest?: Fetcher) {
    this.request = request ?? adminFetch
    this.publicRequest = publicRequest ?? request ?? publicFetch
    this.now = now
  }

  /** Tasa vigente para cotizar. Memoria de corta vida + una sola petición en vuelo; ante cualquier fallo lanza (sin respaldo). */
  async getPublicRate(): Promise<PublicFinancingRate> {
    if (this.cache && this.now() - this.cache.at < PUBLIC_RATE_TTL_MS) return this.cache.value
    if (!this.inflight) {
      // Promise.resolve().then(...): un fallo SÍNCRONO de la función de petición (p. ej. `$fetch` ausente) también se vuelve error controlado.
      this.inflight = Promise.resolve().then(() => this.publicRequest<PublicFinancingRate>('/api/public/financing-rate'))
        .then((value) => {
          if (!value || typeof value.rate !== 'string' || !value.rate) throw new Error('invalid')
          this.cache = { value, at: this.now() }
          return value
        })
        .catch(() => {
          this.cache = null
          throw new FinancingRateUnavailableError()
        })
        .finally(() => { this.inflight = null })
    }
    return this.inflight
  }

  /** Descarta la tasa en memoria (p. ej. tras guardar desde el panel). */
  invalidate() { this.cache = null }

  async getAdminRate(): Promise<AdminFinancingRate> {
    try { return await this.request<AdminFinancingRate>('/api/admin/config/financing-rate') } catch (e) { throw toSaveError(e) }
  }

  async saveRate(rate: string, expectedUpdatedAt: string): Promise<AdminFinancingRate> {
    try {
      const saved = await this.request<AdminFinancingRate>('/api/admin/config/financing-rate', { method: 'PUT', body: { rate, expectedUpdatedAt } })
      this.invalidate()
      return saved
    } catch (e) { throw toSaveError(e) }
  }
}

export const financingRateService = new FinancingRateService()

/**
 * Servicio para el panel de administración. Llamar en el SETUP del componente (contexto de Nuxt válido): resuelve `useRequestFetch()` en ese
 * momento y reutiliza la función obtenida en onMounted y eventos. En SSR conserva el reenvío de cookies de sesión; en el navegador es `$fetch`.
 * Fuera del contexto de Nuxt (solo posible en el servidor) lanza al crearse: nunca cae a una petición sin credenciales.
 */
export function createAdminFinancingRateService(): FinancingRateService {
  return new FinancingRateService((useRequestFetch() as any) as Fetcher)
}
