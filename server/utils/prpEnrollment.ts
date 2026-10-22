import type { H3Event } from 'h3'
import { createHmac } from 'node:crypto'
import { resolveClientIp } from '#shared/utils/clientIp'
import { buildHubPayload, normalizeEnrollment, validateEnrollment } from '#shared/utils/prpEnrollment'

// Inscripción al PRP → Wellezy Hub (POST /v1/web/prp-enrollments). Solo servidor.
//  · Valida TODO antes de llamar a Hub; la empresa y la línea las resuelve Hub por el tenant de la configuración del servidor.
//  · Clave de idempotencia = HMAC (secreto del servidor) del payload COMPLETO: el mismo envío reintentado (también tras timeout) produce la misma
//    clave y nunca duplica; nadie sin el secreto puede predecirla ni ocupar la inscripción de otra persona. Hub además compara el contenido (409).
//  · Límite de peticiones por IP del cliente: X-Forwarded-For solo se usa con `trustedProxyHops` > 0 (ver shared/utils/clientIp.ts).
//  · Éxito definitivo SOLO si Hub informa `completed` (CRM médico confirmado); `received` significa «guardada, pendiente».
//  · Sin logs de datos personales ni bancarios (solo el estado HTTP de Hub).

const RATE = { max: 6, windowMs: 10 * 60_000 }
const MAX_TRACKED = 5000
const hits = new Map<string, number[]>()

/** Solo pruebas. */
export function resetEnrollmentGuards() { hits.clear() }

function fail(statusCode: number, message: string, data: Record<string, unknown> = {}): never {
  throw createError({ statusCode, message, data: { message, ...data } })
}

function rateLimited(key: string, now: number): boolean {
  if (hits.size >= MAX_TRACKED) {
    for (const [k, times] of hits) if (times.every(t => now - t >= RATE.windowMs)) hits.delete(k)
    if (hits.size >= MAX_TRACKED && !hits.has(key)) return true // saturado: falla cerrado en vez de crecer sin límite
  }
  const recent = (hits.get(key) ?? []).filter(t => now - t < RATE.windowMs)
  if (recent.length >= RATE.max) { hits.set(key, recent); return true }
  recent.push(now)
  hits.set(key, recent)
  return false
}

/** Campos de Hub → campos del formulario (para mostrar el error junto al campo correcto). */
const HUB_TO_FORM: Record<string, string> = { accepted_contract: 'accepted_contract' }

export async function handlePrpEnrollment(event: H3Event) {
  assertSameOrigin(event)
  setHeader(event, 'Cache-Control', 'no-store')

  const config = useRuntimeConfig(event)
  const ip = resolveClientIp(getRequestIP(event), getRequestHeader(event, 'x-forwarded-for'), Number(config.trustedProxyHops) || 0)
  if (rateLimited(ip, Date.now())) fail(429, 'Recibimos demasiados intentos. Espera unos minutos e inténtalo de nuevo.', { reason: 'rate_limited' })

  const value = normalizeEnrollment(await readBody(event).catch(() => null))
  const errors = validateEnrollment(value)
  if (Object.keys(errors).length) fail(422, 'Revisa los datos ingresados.', { reason: 'validation', errors })

  const payload = buildHubPayload(value)
  const secret = String(config.sessionPassword || '')
  if (secret.length < 32) {
    console.error('[prp-enrollment] NUXT_SESSION_PASSWORD no está configurada: no se puede generar la clave de idempotencia.')
    fail(503, 'No pudimos registrar tu inscripción en este momento. Inténtalo de nuevo en unos minutos.', { reason: 'hub_unavailable', retryable: true })
  }
  const key = createHmac('sha256', secret).update(`prp-enrollment-v1|${JSON.stringify(payload)}`).digest('hex').slice(0, 48)

  const res = await wellezyPublicPost<any>(event, '/v1/web/prp-enrollments', payload, { 'Idempotency-Key': key })

  if (res.status === 201 || res.status === 200) {
    const status = res.data?.data?.status
    if (status === 'completed' || status === 'received') return { ok: true, status }
    console.error('[prp-enrollment] respuesta de Hub sin estado válido')
    fail(502, 'No recibimos la confirmación de tu inscripción. Inténtalo de nuevo: no se duplicará.', { reason: 'unconfirmed', retryable: true })
  }

  if (res.status === 422) {
    const known: Record<string, string> = {}
    const src = res.data?.errors && typeof res.data.errors === 'object' ? res.data.errors : {}
    for (const [k, v] of Object.entries(src)) {
      const msg = Array.isArray(v) ? v[0] : v
      if (typeof msg === 'string' && msg.length < 200) known[HUB_TO_FORM[k] ?? k] = msg
    }
    console.error('[prp-enrollment] Hub respondió 422')
    fail(422, 'Revisa los datos ingresados.', { reason: 'hub_validation', errors: known })
  }
  if (res.status === 409) fail(409, 'Esta inscripción entra en conflicto con otra recibida antes. Recarga la página e inténtalo de nuevo.', { reason: 'conflict' })
  if (res.status === 429) fail(429, 'Recibimos demasiados intentos. Espera unos minutos e inténtalo de nuevo.', { reason: 'rate_limited' })

  console.error(`[prp-enrollment] Hub respondió ${res.status || 'sin conexión'}`)
  // Hub caído o con error: el resultado puede ser incierto; reintentar con la misma clave es seguro (no duplica).
  fail(503, 'No pudimos registrar tu inscripción en este momento. Inténtalo de nuevo en unos minutos: no se duplicará.', { reason: 'hub_unavailable', retryable: true })
}
