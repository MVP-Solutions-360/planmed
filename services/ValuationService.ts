import type { ValuationErrors, ValuationInput } from '#shared/utils/valuation'

// Envío de la solicitud de valoración a la ruta de servidor de Planmed (POST /api/forms/valuation), que valida de nuevo y reenvía al CRM
// médico. El navegador nunca llama al CRM ni conoce sus identificadores. Sin reintentos automáticos (podrían duplicar el registro).

export type ValuationErrorKind = 'validation' | 'duplicate' | 'rate_limited' | 'network' | 'server'

export class ValuationError extends Error {
  kind: ValuationErrorKind
  fields: ValuationErrors
  /** true = no se sabe si el CRM llegó a registrar la solicitud (timeout, sin confirmación): no se debe reenviar sin más. */
  uncertain: boolean
  status: number | null
  constructor(kind: ValuationErrorKind, message: string, opts: { fields?: ValuationErrors, uncertain?: boolean, status?: number | null } = {}) {
    super(message)
    this.name = 'ValuationError'
    this.kind = kind
    this.fields = opts.fields ?? {}
    this.uncertain = opts.uncertain === true
    this.status = opts.status ?? null
  }
}

export type Fetcher = <T>(url: string, options?: Record<string, unknown>) => Promise<T>

// En el navegador. Se resuelve al llamar (no al importar) para poder inyectar un fetcher en pruebas con Node.
const browserFetch: Fetcher = (url, options) => (globalThis as any).$fetch(url, options)

export const VALUATION_ENDPOINT = '/api/forms/valuation'

export class ValuationService {
  private readonly request: Fetcher

  constructor(request: Fetcher = browserFetch) {
    this.request = request
  }

  async submit(value: ValuationInput): Promise<void> {
    let res: any
    try {
      res = await this.request(VALUATION_ENDPOINT, { method: 'POST', body: value })
    } catch (e: any) {
      throw ValuationService.toError(e)
    }
    // Éxito SOLO si el servidor confirma el registro del CRM.
    if (!res || res.ok !== true) throw new ValuationError('server', 'No recibimos la confirmación del registro. Comunícate con nosotros antes de reenviar para evitar duplicados.', { uncertain: true })
  }

  static toError(e: any): ValuationError {
    const status = Number.isSafeInteger(e?.statusCode) ? e.statusCode as number : Number.isSafeInteger(e?.response?.status) ? e.response.status as number : null
    const data = e?.data?.data ?? e?.data ?? {}
    const message = typeof data?.message === 'string' && data.message ? data.message : ''
    const uncertain = data?.uncertain === true
    const fields: ValuationErrors = {}
    if (data?.errors && typeof data.errors === 'object') {
      for (const [k, v] of Object.entries(data.errors)) if (typeof v === 'string') (fields as Record<string, string>)[k] = v
    }
    if (status === 422) return new ValuationError('validation', message || 'Revisa los datos ingresados.', { fields, status })
    if (status === 409) return new ValuationError('duplicate', message || 'Ya recibimos tu solicitud.', { status })
    if (status === 429) return new ValuationError('rate_limited', message || 'Demasiados intentos. Espera unos minutos.', { status })
    if (status === null || status === 0 || status === 503 || status === 504) {
      return new ValuationError('network', message || 'No pudimos conectar para enviar tus datos. Revisa tu conexión e inténtalo de nuevo.', { uncertain, status })
    }
    return new ValuationError('server', message || 'No pudimos registrar tus datos. Inténtalo de nuevo en unos minutos.', { uncertain, status })
  }
}

export const valuationService = new ValuationService()
