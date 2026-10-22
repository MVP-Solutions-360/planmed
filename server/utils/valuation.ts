import type { H3Event } from 'h3'
import { createHash } from 'node:crypto'
import { buildCrmFields, crmConfirmed, normalizeValuation, validateValuation, VALUATION_FIELDS } from '#shared/utils/valuation'

// Solicitud de valoración → CRM médico (POST multipart a /crm-public/api/clients/forms). Solo servidor.
//  · Valida TODO antes de llamar al CRM (una petición inválida nunca llega a él).
//  · Sin reintentos: un timeout o una respuesta ambigua puede haber creado el registro; repetirlo duplicaría.
//  · No se registra ningún dato personal ni el payload (solo el resultado: estado HTTP del CRM o el tipo de fallo).
//  · Límite por IP y bloqueo de doble envío (huella SHA-256 de cédula + teléfono + cirugía, sin guardar los datos).

const TIMEOUT_MS = 15_000
const RATE = { max: 8, windowMs: 10 * 60_000 }
const DUPLICATE_WINDOW_MS = 2 * 60_000

const hits = new Map<string, number[]>()
const inflight = new Set<string>()
const accepted = new Map<string, number>()

/** Solo pruebas: vacía el estado en memoria. */
export function resetValuationGuards() {
  hits.clear()
  inflight.clear()
  accepted.clear()
}

function fail(statusCode: number, message: string, data: Record<string, unknown> = {}): never {
  throw createError({ statusCode, message, data: { message, ...data } })
}

function rateLimited(key: string, now: number): boolean {
  const recent = (hits.get(key) ?? []).filter(t => now - t < RATE.windowMs)
  if (recent.length >= RATE.max) { hits.set(key, recent); return true }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every(t => now - t >= RATE.windowMs)) hits.delete(k)
  return false
}

const fingerprint = (v: { identificacion: string, telefono: string, name_surgery: string }) =>
  createHash('sha256').update(`${v.identificacion}|${v.telefono.replace(/\D/g, '')}|${v.name_surgery.toLowerCase()}`).digest('hex')

/** Manejador de POST /api/public/valuation. Devuelve { ok: true } solo si el CRM confirma el registro. */
export async function handleValuation(event: H3Event) {
  assertSameOrigin(event)
  setHeader(event, 'Cache-Control', 'no-store')

  const now = Date.now()
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (rateLimited(ip, now)) fail(429, 'Recibimos demasiados intentos. Espera unos minutos e inténtalo de nuevo.', { reason: 'rate_limited' })

  const value = normalizeValuation(await readBody(event).catch(() => null))
  const errors = validateValuation(value)
  if (Object.keys(errors).length) fail(422, 'Revisa los datos ingresados.', { reason: 'validation', errors })

  const print = fingerprint(value)
  const last = accepted.get(print)
  if (inflight.has(print) || (last && now - last < DUPLICATE_WINDOW_MS)) {
    fail(409, 'Ya recibimos tu solicitud. No es necesario enviarla de nuevo.', { reason: 'duplicate' })
  }

  const url = String(useRuntimeConfig(event).crmValuationUrl || '')
  if (!url) fail(503, 'El envío no está disponible en este momento.', { reason: 'not_configured' })

  const form = new FormData()
  for (const [name, val] of buildCrmFields(value)) form.append(name, val)

  inflight.add(print)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    let res: Response
    try {
      // Sin Content-Type manual: fetch genera el multipart con su boundary.
      res = await fetch(url, { method: 'POST', body: form, headers: { Accept: 'application/json' }, signal: controller.signal })
    } catch (e: any) {
      const timeout = e?.name === 'AbortError'
      console.error(`[valuation] ${timeout ? 'timeout' : 'sin conexión'} con el CRM`)
      // Resultado INCIERTO: puede haberse registrado. No se reintenta.
      fail(timeout ? 504 : 503, 'No pudimos confirmar el envío. Revisa tu conexión e inténtalo en unos minutos.', { reason: timeout ? 'timeout' : 'network', uncertain: true })
    }

    if (res.status === 422) {
      console.error('[valuation] el CRM respondió 422')
      const body: any = await res.json().catch(() => null)
      const known: Record<string, string> = {}
      const src = body && typeof body === 'object' ? (body.errors ?? {}) : {}
      for (const f of VALUATION_FIELDS) {
        const msg = Array.isArray(src?.[f]) ? src[f][0] : src?.[f]
        if (typeof msg === 'string' && msg.length < 200) known[f] = msg
      }
      fail(422, 'El registro no pudo validarse. Revisa los datos ingresados.', { reason: 'crm_validation', errors: known })
    }
    if (!res.ok) {
      console.error(`[valuation] el CRM respondió ${res.status}`)
      fail(502, 'No pudimos registrar tus datos. Inténtalo de nuevo en unos minutos.', { reason: 'crm_error' })
    }

    const body = await res.json().catch(() => null)
    if (!crmConfirmed(body)) {
      console.error('[valuation] respuesta del CRM sin confirmación')
      fail(502, 'No recibimos la confirmación del registro. Antes de reenviar, comunícate con nosotros para evitar duplicados.', { reason: 'unconfirmed', uncertain: true })
    }

    accepted.set(print, now)
    return { ok: true }
  } finally {
    clearTimeout(timer)
    inflight.delete(print)
  }
}
