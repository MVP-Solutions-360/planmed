import type { PrpLeadProvider } from './PrpLeadProvider'
import { PrpLeadError, type PrpLeadInput } from '~/types/prpPublic'
import { useRuntimeConfig } from '#imports'

// Envío DIRECTO navegador -> CRM médico externo (sin Wellezy Hub ni proxy), con el contrato ya validado:
// multipart/form-data, sin _token. La URL sale de runtimeConfig.public.crmPrpFormUrl.

const TIMEOUT_MS = 20_000

// Valores fijos del formulario web de PRP.
const STATE = 'No Contactada'
const ORIGIN = 'Formulario Web'

export function buildPrpLeadFormData(lead: PrpLeadInput): FormData {
  const form = new FormData()
  form.append('nombres', lead.fullName.trim())
  form.append('telefono', lead.phone.trim())
  form.append('direccion', lead.city.trim())
  form.append('name_surgery', lead.surgery.trim())
  form.append('state', STATE)
  form.append('origen', ORIGIN)
  form.append('code_prp', lead.codePrp)
  form.append('accept', '1')
  return form
}

export class CrmPrpLeadProvider implements PrpLeadProvider {
  async submit(lead: PrpLeadInput): Promise<void> {
    const url = String(useRuntimeConfig().public.crmPrpFormUrl || '')
    if (!url) throw new PrpLeadError('unexpected', 'El envío no está configurado.')

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    let res: Response
    try {
      // Sin Content-Type manual: el navegador agrega el boundary del multipart.
      res = await fetch(url, {
        method: 'POST',
        body: buildPrpLeadFormData(lead),
        headers: { Accept: 'application/json' },
        signal: controller.signal
      })
    } catch {
      throw new PrpLeadError('network', 'No pudimos conectar para enviar tus datos.')
    } finally {
      clearTimeout(timer)
    }

    if (res.status === 422) throw new PrpLeadError('validation', 'Revisa los datos ingresados.', 422)
    if (!res.ok) throw new PrpLeadError('server', 'No pudimos registrar tus datos.', res.status)

    // 2xx no basta: el CRM confirma con un JSON de éxito ("mensagge", como lo devuelve hoy).
    const body: any = await res.json().catch(() => null)
    const confirmation = body && typeof body === 'object' ? (body.mensagge ?? body.message) : null
    if (typeof confirmation !== 'string' || !confirmation) {
      throw new PrpLeadError('unexpected', 'No recibimos la confirmación del registro.', res.status)
    }
  }
}
