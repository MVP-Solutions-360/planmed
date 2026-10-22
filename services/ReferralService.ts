import type { EnrollmentErrors, EnrollmentInput } from '#shared/utils/prpEnrollment'

// Envío de la inscripción al PRP a la ruta de servidor de Planmed (POST /api/forms/prp-enrollment), que valida y reenvía a Wellezy Hub.
// Sin reintentos automáticos. «completed» = confirmado por el CRM médico; «received» = guardada, pendiente (NO es éxito definitivo).

export type ReferralErrorKind = 'validation' | 'rate_limited' | 'unavailable' | 'server'

export class ReferralError extends Error {
  kind: ReferralErrorKind
  fields: EnrollmentErrors
  /** true = reintentar con los mismos datos es seguro (la clave de idempotencia evita duplicados). */
  retryable: boolean
  status: number | null
  constructor(kind: ReferralErrorKind, message: string, opts: { fields?: EnrollmentErrors, retryable?: boolean, status?: number | null } = {}) {
    super(message)
    this.name = 'ReferralError'
    this.kind = kind
    this.fields = opts.fields ?? {}
    this.retryable = opts.retryable === true
    this.status = opts.status ?? null
  }
}

export type Fetcher = <T>(url: string, options?: Record<string, unknown>) => Promise<T>
const browserFetch: Fetcher = (url, options) => (globalThis as any).$fetch(url, options)

export const REFERRAL_ENDPOINT = '/api/forms/prp-enrollment'

export class ReferralService {
  private readonly request: Fetcher

  constructor(request: Fetcher = browserFetch) {
    this.request = request
  }

  async submit(value: EnrollmentInput): Promise<'completed' | 'received'> {
    let res: any
    try {
      res = await this.request(REFERRAL_ENDPOINT, { method: 'POST', body: value })
    } catch (e: any) {
      throw ReferralService.toError(e)
    }
    if (res?.ok === true && (res.status === 'completed' || res.status === 'received')) return res.status
    throw new ReferralError('server', 'No recibimos la confirmación de tu inscripción. Inténtalo de nuevo: no se duplicará.', { retryable: true })
  }

  static toError(e: any): ReferralError {
    const status = Number.isSafeInteger(e?.statusCode) ? e.statusCode as number : Number.isSafeInteger(e?.response?.status) ? e.response.status as number : null
    const data = e?.data?.data ?? e?.data ?? {}
    const message = typeof data?.message === 'string' && data.message ? data.message : ''
    const retryable = data?.retryable === true
    const fields: EnrollmentErrors = {}
    if (data?.errors && typeof data.errors === 'object') {
      for (const [k, v] of Object.entries(data.errors)) if (typeof v === 'string') (fields as Record<string, string>)[k] = v
    }
    if (status === 422) return new ReferralError('validation', message || 'Revisa los datos ingresados.', { fields, status })
    if (status === 429) return new ReferralError('rate_limited', message || 'Demasiados intentos. Espera unos minutos.', { status })
    if (status === null || status === 0 || status === 503 || status === 504) {
      return new ReferralError('unavailable', message || 'No pudimos conectar para enviar tus datos. Revisa tu conexión e inténtalo de nuevo.', { retryable: true, status })
    }
    return new ReferralError('server', message || 'No pudimos registrar tu inscripción. Inténtalo de nuevo en unos minutos.', { retryable, status })
  }
}

export const referralService = new ReferralService()
