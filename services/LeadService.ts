import type { LeadPayload } from '#shared/utils/leadForm'

// Envío de la solicitud de financiación (LeadForm) a la ruta de servidor POST /api/forms/lead, que valida y la envía por CORREO. El destino lo define solo
// el servidor. Éxito = el servidor SMTP aceptó el mensaje (no implica lectura ni entrega en bandeja). Sin reintentos automáticos.

export type LeadErrorKind = 'validation' | 'duplicate' | 'rate_limited' | 'unavailable' | 'server'

export class LeadError extends Error {
  kind: LeadErrorKind
  constructor(kind: LeadErrorKind, message: string) {
    super(message)
    this.name = 'LeadError'
    this.kind = kind
  }
}

export type Fetcher = <T>(url: string, options?: Record<string, unknown>) => Promise<T>
const browserFetch: Fetcher = (url, options) => (globalThis as any).$fetch(url, options)

export const LEAD_ENDPOINT = '/api/forms/lead'

export class LeadService {
  private readonly request: Fetcher

  constructor(request: Fetcher = browserFetch) {
    this.request = request
  }

  async submitLead(lead: LeadPayload): Promise<boolean> {
    let res: any
    try {
      res = await this.request(LEAD_ENDPOINT, { method: 'POST', body: lead })
    } catch (e: any) {
      throw LeadService.toError(e)
    }
    if (res?.ok === true) return true
    throw new LeadError('server', 'No recibimos la confirmación de tu solicitud. Inténtalo de nuevo en unos minutos.')
  }

  static toError(e: any): LeadError {
    const status = Number.isSafeInteger(e?.statusCode) ? e.statusCode as number : Number.isSafeInteger(e?.response?.status) ? e.response.status as number : null
    const data = e?.data?.data ?? e?.data ?? {}
    const message = typeof data?.message === 'string' && data.message ? data.message : ''
    if (status === 422) return new LeadError('validation', message || 'Revisa los datos ingresados.')
    if (status === 409) return new LeadError('duplicate', message || 'Ya recibimos esta solicitud. No es necesario enviarla de nuevo.')
    if (status === 429) return new LeadError('rate_limited', message || 'Demasiados intentos. Espera unos minutos.')
    if (status === null || status === 0 || status === 503 || status === 504) {
      return new LeadError('unavailable', message || 'No pudimos enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo en unos minutos.')
    }
    return new LeadError('server', message || 'No pudimos enviar tu solicitud. Inténtalo de nuevo en unos minutos.')
  }
}

export const leadService = new LeadService()
