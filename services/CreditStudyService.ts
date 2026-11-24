import { CREDIT_FIELDS, isEnabled, isVisible, type CreditValues } from '#shared/utils/creditStudy'

// Envío del formulario «Estudio de créditos» a la ruta de servidor (POST /api/forms/credit-study), que valida de nuevo y lo reenvía por correo. El navegador
// nunca conoce el SMTP, las credenciales ni los destinatarios. Sin reintentos automáticos (podrían duplicar el correo).

export type CreditStudyErrorKind = 'validation' | 'duplicate' | 'rate_limited' | 'too_large' | 'unavailable' | 'server'

export class CreditStudyError extends Error {
  kind: CreditStudyErrorKind
  fields: Record<string, string>
  status: number | null
  constructor(kind: CreditStudyErrorKind, message: string, opts: { fields?: Record<string, string>, status?: number | null } = {}) {
    super(message)
    this.name = 'CreditStudyError'
    this.kind = kind
    this.fields = opts.fields ?? {}
    this.status = opts.status ?? null
  }
}

export type Fetcher = <T>(url: string, options?: Record<string, unknown>) => Promise<T>
const browserFetch: Fetcher = (url, options) => (globalThis as any).$fetch(url, options)

export const CREDIT_STUDY_ENDPOINT = '/api/forms/credit-study'

/** multipart/form-data con los campos visibles y habilitados y solo los documentos que corresponden. */
export function buildCreditStudyFormData(values: CreditValues, files: Record<string, Blob | null | undefined>): FormData {
  const form = new FormData()
  for (const fd of CREDIT_FIELDS) {
    if (fd.sum || !isVisible(fd, values) || !isEnabled(fd, values)) continue
    if (fd.type === 'file') {
      const file = files[fd.id]
      if (file) form.append(fd.id, file, (file as File).name || fd.id)
    } else if (fd.type === 'checkbox') {
      if (values[fd.id] === true) form.append(fd.id, 'true')
    } else {
      const v = String(values[fd.id] ?? '')
      if (v) form.append(fd.id, v)
    }
  }
  return form
}

export class CreditStudyService {
  private readonly request: Fetcher

  constructor(request: Fetcher = browserFetch) {
    this.request = request
  }

  async submit(values: CreditValues, files: Record<string, Blob | null | undefined>): Promise<void> {
    let res: any
    try {
      res = await this.request(CREDIT_STUDY_ENDPOINT, { method: 'POST', body: buildCreditStudyFormData(values, files) })
    } catch (e: any) {
      throw CreditStudyService.toError(e)
    }
    // Éxito SOLO si el servidor confirma que el correo fue aceptado por el proveedor SMTP.
    if (!res || res.ok !== true) throw new CreditStudyError('server', 'No recibimos la confirmación del envío. Inténtalo de nuevo en unos minutos.')
  }

  static toError(e: any): CreditStudyError {
    const status = Number.isSafeInteger(e?.statusCode) ? e.statusCode as number : Number.isSafeInteger(e?.response?.status) ? e.response.status as number : null
    const data = e?.data?.data ?? e?.data ?? {}
    const message = typeof data?.message === 'string' && data.message ? data.message : ''
    const fields: Record<string, string> = {}
    if (data?.errors && typeof data.errors === 'object') {
      for (const [k, v] of Object.entries(data.errors)) if (typeof v === 'string') fields[k] = v
    }
    if (status === 422) return new CreditStudyError('validation', message || 'Revisa los datos ingresados.', { fields, status })
    if (status === 409) return new CreditStudyError('duplicate', message || 'Ya recibimos esta solicitud.', { status })
    if (status === 429) return new CreditStudyError('rate_limited', message || 'Demasiados intentos. Espera unos minutos.', { status })
    if (status === 413) return new CreditStudyError('too_large', message || 'Los documentos son demasiado grandes.', { status })
    if (status === null || status === 0 || status === 503 || status === 504) {
      return new CreditStudyError('unavailable', message || 'No pudimos conectar para enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.', { status })
    }
    return new CreditStudyError('server', message || 'No pudimos enviar tu solicitud. Inténtalo de nuevo en unos minutos.', { status })
  }
}

export const creditStudyService = new CreditStudyService()
