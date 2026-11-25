// Registro del paciente desde la valoración en el CRM Médico, igual que el formulario público de Planmed (…/crm-public/forms/{usuario}/{línea}). SOLO servidor.
//
// Por cada envío: 1) GET de ese formulario, que entrega las cookies de sesión (Laravel) y el campo oculto `_token`; 2) POST multipart/form-data a
// …/crm-public/api/clients/forms con esas cookies y ese token. Éxito: JSON con `mensagge` (así, con la errata).
//
//  · Cookies y token viven solo en memoria durante el envío: no se guardan, no se reutilizan entre pacientes, no se registran ni llegan al navegador.
//  · Sin reintentos y sin seguir redirecciones (reenviarían datos personales o la sesión a otro destino).
//  · Si falla el paso 1 no se envió ningún dato del paciente.
//  · No se registra ningún dato personal, ni el formulario ni el cuerpo de las respuestas.
//  · TRAZA: una sola línea por envío (identificador, clasificación, motivo, código HTTP, duración y NOMBRES de las claves de primer nivel de la respuesta;
//    nunca sus valores, cabeceras, cookies ni la URL). Se queda en el servidor: nada de esto llega al navegador.
//  · El destino es configuración (NUXT_CRM_FORM_URL), vacío por defecto: sin él no sale ninguna petición.

import { PAYMENT_OPTIONS, type ValuationInput } from '#shared/utils/valuation'
import { randomUUID } from 'node:crypto'

import { cleanLine } from './formMail'

export const CRM_FORM_STATE = 'No Contactada'
export const CRM_FORM_ORIGIN = 'Formulario Web'
/** Frase de `mensagge` con la que el CRM confirma el registro. */
export const CRM_SUCCESS_TEXT = 'los datos fueron registrados satisfactoriamente'
export const CRM_CLIENT_TIMEOUT_MS = 15_000

/** Destino, formulario público (derivado del destino y los identificadores) e identificadores del CRM. Salen de la configuración del servidor. */
export interface CrmClientConfig { url: string, formUrl: string, userId: number, lineId: number, advisorId: number }

const CRM_SUBMIT_PATH = '/api/clients/forms'

const oneLine = (s: string) => cleanLine(s).replace(/\s+/g, ' ')

/** Campos EXACTOS (nombre → valor), en el orden observado, a partir del formulario ya validado. */
export function buildCrmFields(v: ValuationInput, cfg: Pick<CrmClientConfig, 'userId' | 'lineId' | 'advisorId'>, token: string): Array<[string, string]> {
  const pago = PAYMENT_OPTIONS.find(o => o.label === v.forma_pago)
  if (!v.accept || !pago || !token) throw new Error('Formulario no validado o sin token.')
  return [
    ['_token', token],
    ['_method', 'post'],
    ['nombres', oneLine(v.nombres)],
    ['apellidos', oneLine(v.apellidos)],
    ['identificacion', v.identificacion],
    ['fecha_nacimiento', v.fecha_nacimiento], // AAAA-MM-DD, tal como la entrega y valida el formulario
    ['direccion', oneLine(v.direccion)],
    ['telefono', v.telefono.replace(/\D/g, '')], // el formulario original usa un campo numérico: solo dígitos
    ['email', v.email],
    ['name_surgery', oneLine(v.name_surgery)],
    ['forma_pago', pago.value],
    ['state', CRM_FORM_STATE],
    ['origen', CRM_FORM_ORIGIN],
    ['id_user', String(cfg.userId)],
    ['id_line', String(cfg.lineId)],
    ['id_user_asesora', String(cfg.advisorId)],
    ['accept', '1']
  ]
}

/** Solo https (o http en la propia máquina, para pruebas) y sin usuario ni contraseña en la URL. */
function validDestination(url: string): boolean {
  let u: URL
  try { u = new URL(url) } catch { return false }
  if (u.username || u.password) return false
  const host = u.hostname.toLowerCase()
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(host) || host.endsWith('.localhost') || host.endsWith('.test')
  if (!u.pathname.endsWith(CRM_SUBMIT_PATH) || u.search || u.hash) return false
  return u.protocol === 'https:' || (u.protocol === 'http:' && local)
}

/** Configuración del servidor. `invalid` lista las variables que impiden enviar (nunca sus valores). */
export function resolveCrmClientConfig(runtime: Record<string, unknown>): { ok: true, config: CrmClientConfig } | { ok: false, invalid: string[] } {
  const text = (k: string) => String(runtime[k] ?? '').trim()
  const id = (k: string) => (/^[1-9]\d{0,9}$/.test(text(k)) ? Number(text(k)) : 0)
  const config: CrmClientConfig = { url: text('crmFormUrl'), formUrl: '', userId: id('crmFormUserId'), lineId: id('crmFormLineId'), advisorId: id('crmFormAdvisorId') }
  const invalid: string[] = []
  if (!validDestination(config.url)) invalid.push('NUXT_CRM_FORM_URL')
  if (!config.userId) invalid.push('NUXT_CRM_FORM_USER_ID')
  if (!config.lineId) invalid.push('NUXT_CRM_FORM_LINE_ID')
  if (!config.advisorId) invalid.push('NUXT_CRM_FORM_ADVISOR_ID')
  if (invalid.length) return { ok: false, invalid }
  // …/crm-public/api/clients/forms → …/crm-public/forms/{usuario}/{línea}, siempre en el mismo origen que el destino.
  const form = new URL(config.url)
  form.pathname = `${form.pathname.slice(0, -CRM_SUBMIT_PATH.length)}/forms/${config.userId}/${config.lineId}`
  return { ok: true, config: { ...config, formUrl: form.href } }
}

/**
 * Confirmación del CRM: un 2xx NO basta. Solo vale un objeto JSON cuyo `mensagge` contenga la frase de registro satisfactorio (sin distinguir
 * mayúsculas ni espacios repetidos). Cualquier otra respuesta es ambigua.
 */
export function crmConfirmed(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  const text = (data as Record<string, unknown>).mensagge
  return typeof text === 'string' && text.toLowerCase().replace(/\s+/g, ' ').trim().startsWith(CRM_SUCCESS_TEXT)
}

/** Códigos de red que demuestran que NO se llegó a conectar (la petición no salió). */
const CRM_NO_CONNECTION_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'])

/** `failed` solo si TODOS los códigos de la cadena de causas demuestran que no hubo conexión; cualquier otra duda es `unknown`. */
export function classifyCrmError(error: unknown): 'failed' | 'unknown' {
  const codes: string[] = []
  const seen = new Set<unknown>()
  let abort = false
  const walk = (e: any, depth: number) => {
    if (!e || typeof e !== 'object' || seen.has(e) || depth > 8) return
    seen.add(e)
    if (e.name === 'TimeoutError' || e.name === 'AbortError') abort = true
    if (typeof e.code === 'string') codes.push(e.code)
    if (e.cause) walk(e.cause, depth + 1)
    if (Array.isArray(e.errors)) for (const x of e.errors) walk(x, depth + 1)
  }
  walk(error, 0)
  return !abort && codes.length > 0 && codes.every(c => CRM_NO_CONNECTION_CODES.has(c)) ? 'failed' : 'unknown'
}

/** 4xx transitorios: el resto de 4xx es un rechazo que no se resuelve repitiendo la misma petición. */
const CRM_RETRYABLE_HTTP = new Set([408, 429])

export type CrmClientReason =
  | 'confirmed' | 'unconfirmed_response' | 'http_rejected' | 'http_retryable' | 'http_server_error' | 'redirect_not_followed' | 'http_other'
  | 'no_connection' | 'timeout' | 'no_response' | 'internal_error'
  | 'session_unreachable' | 'session_rejected' | 'session_invalid'

export interface CrmClientResult {
  /** `sent` = confirmado · `failed` = respuesta de error o la petición nunca salió · `unknown` = no se sabe si quedó registrado. */
  state: 'sent' | 'failed' | 'unknown'
  reason: CrmClientReason
  status?: number
  /** Cuerpo del 422, solo para señalar campos al usuario. No se registra. */
  body?: unknown
}

/** Qué se pudo leer de la respuesta. `ilegible` = el cuerpo no terminó de llegar (corte o tiempo agotado). */
export type CrmResponseKind = 'json' | 'json_no_objeto' | 'no_json' | 'ilegible' | 'sin_respuesta'

const LOG_KEY_RE = /^[A-Za-z_][A-Za-z0-9_.-]{0,39}$/
const LOG_MAX_KEYS = 20
const HIDDEN_KEY = '[omitida]'
const PERSONAL_FIELDS: ReadonlyArray<keyof ValuationInput> = ['nombres', 'apellidos', 'identificacion', 'direccion', 'telefono', 'email', 'name_surgery']

/**
 * Nombres de las claves de primer nivel, NUNCA sus valores. Una respuesta podría usar datos como nombre de clave, así que se oculta la que no parezca un nombre
 * de campo (caracteres raros, más de 40, 4 o más cifras seguidas) o que repita una palabra de los datos personales enviados.
 */
export function crmResponseKeys(data: unknown, value: ValuationInput): string[] {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return []
  const words = (s: string) => s.toLowerCase().split(/[\s@_.-]+/).filter(Boolean)
  const personal = new Set(PERSONAL_FIELDS.flatMap(f => words(String(value[f]))))
  const keys = Object.keys(data)
  const shown = keys.slice(0, LOG_MAX_KEYS).map(k => (LOG_KEY_RE.test(k) && !/\d{4}/.test(k) && !words(k).some(w => personal.has(w)) ? k : HIDDEN_KEY))
  return keys.length > LOG_MAX_KEYS ? [...shown, `(+${keys.length - LOG_MAX_KEYS})`] : shown
}

const LOG_CLASS = { sent: 'confirmado', failed: 'rechazado', unknown: 'incierto' } as const

/** Línea de traza. Solo recibe datos ya saneados; un fallo al escribirla no puede alterar el resultado del registro. */
function logCrmCall(entry: { id: string, result: CrmClientResult, ms: number, kind: CrmResponseKind, keys: string[] }) {
  const { id, result, ms, kind, keys } = entry
  const line = `[valuation] crm-registro id=${id} clasificacion=${LOG_CLASS[result.state]} motivo=${result.reason} http=${result.status ?? '-'} duracion_ms=${ms} respuesta=${kind} claves=${keys.join(',') || '-'}`
  try {
    if (result.state === 'sent') console.info(line)
    else console.warn(line)
  } catch { /* la traza es accesoria */ }
}

/** Atributos de una etiqueta HTML (comillas simples o dobles). */
const attributes = (tag: string) =>
  Object.fromEntries([...tag.matchAll(/([a-zA-Z_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m => [m[1]!.toLowerCase(), m[2] ?? m[3] ?? '']))

/** Valor del campo oculto `_token` del formulario; cadena vacía si no está o no tiene forma de token. */
export function extractCsrfToken(html: string): string {
  for (const [tag] of html.matchAll(/<input\b[^>]*>/gi)) {
    const a = attributes(tag)
    if (a.name === '_token') return /^[A-Za-z0-9+/=_-]{16,256}$/.test(a.value ?? '') ? a.value! : ''
  }
  return ''
}

/** Cabecera `Cookie` a partir de las `Set-Cookie` recibidas (solo nombre=valor; las borradas se omiten). */
export function cookieHeader(setCookies: string[]): string {
  const jar = new Map<string, string>()
  for (const line of setCookies) {
    const pair = line.split(';', 1)[0]!.trim()
    const eq = pair.indexOf('=')
    if (eq < 1) continue
    const name = pair.slice(0, eq), value = pair.slice(eq + 1)
    if (value && value !== 'deleted') jar.set(name, value)
    else jar.delete(name)
  }
  return [...jar].map(([name, value]) => `${name}=${value}`).join('; ')
}

type CrmSession = { ok: true, token: string, cookie: string } | { ok: false, reason: 'session_unreachable' | 'session_rejected' | 'session_invalid', status?: number }

/** Paso 1: carga el formulario público y obtiene sesión y token. No envía ningún dato del paciente. Nunca lanza. */
async function openCrmSession(config: CrmClientConfig): Promise<CrmSession> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CRM_CLIENT_TIMEOUT_MS)
  let status: number | undefined
  try {
    const res = await fetch(config.formUrl, { method: 'GET', headers: { Accept: 'text/html' }, redirect: 'manual', signal: controller.signal })
    status = res.status
    if (status !== 200) {
      await res.body?.cancel().catch(() => {})
      return { ok: false, reason: 'session_rejected', status }
    }
    const cookie = cookieHeader(res.headers.getSetCookie())
    const token = extractCsrfToken(await res.text())
    return cookie && token ? { ok: true, token, cookie } : { ok: false, reason: 'session_invalid', status }
  } catch {
    return { ok: false, reason: 'session_unreachable', status }
  } finally {
    clearTimeout(timer)
  }
}

/** Abre sesión y envía el paciente UNA sola vez. Nunca lanza: devuelve la clasificación del resultado. */
export async function registerCrmClient(config: CrmClientConfig, value: ValuationInput): Promise<CrmClientResult> {
  const id = randomUUID()
  const started = performance.now()
  let kind: CrmResponseKind = 'sin_respuesta'
  let keys: string[] = []
  const done = (result: CrmClientResult): CrmClientResult => {
    logCrmCall({ id, result, ms: Math.round(performance.now() - started), kind, keys })
    return result
  }

  const session = await openCrmSession(config)
  if (!session.ok) return done({ state: 'failed', reason: session.reason, status: session.status })

  // Un fallo al preparar el envío ocurre ANTES de enviar los datos: es seguro afirmar que no se registró nada.
  let form: FormData
  try {
    form = new FormData()
    for (const [name, field] of buildCrmFields(value, config, session.token)) form.append(name, field)
  } catch {
    return done({ state: 'failed', reason: 'internal_error' })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CRM_CLIENT_TIMEOUT_MS)
  try {
    // Las mismas cabeceras relevantes que el envío AJAX del formulario original. Sin Content-Type manual: fetch genera el multipart con su boundary.
    const headers = {
      Accept: 'application/json',
      Cookie: session.cookie,
      'X-Requested-With': 'XMLHttpRequest',
      Origin: new URL(config.formUrl).origin,
      Referer: config.formUrl
    }
    const res = await fetch(config.url, { method: 'POST', headers, body: form, redirect: 'manual', signal: controller.signal })
    const status = res.status
    // El cuerpo se lee una vez para la traza; en los códigos que no son 2xx NO influye en la clasificación.
    let data: unknown = null
    try {
      data = await res.json()
      kind = data && typeof data === 'object' && !Array.isArray(data) ? 'json' : 'json_no_objeto'
      keys = crmResponseKeys(data, value)
    } catch (error) {
      kind = !controller.signal.aborted && (error as Error)?.name === 'SyntaxError' ? 'no_json' : 'ilegible'
    }
    if (status >= 200 && status < 300) {
      return done(crmConfirmed(data) ? { state: 'sent', reason: 'confirmed', status } : { state: 'unknown', reason: 'unconfirmed_response', status })
    }
    if (status >= 400 && status < 500) {
      const body = status === 422 ? data : undefined
      return done({ state: 'failed', reason: CRM_RETRYABLE_HTTP.has(status) ? 'http_retryable' : 'http_rejected', status, body })
    }
    if (status >= 500) return done({ state: 'failed', reason: 'http_server_error', status })
    if (status >= 300) return done({ state: 'unknown', reason: 'redirect_not_followed', status })
    return done({ state: 'unknown', reason: 'http_other', status })
  } catch (error) {
    if (classifyCrmError(error) === 'failed') return done({ state: 'failed', reason: 'no_connection' })
    return done({ state: 'unknown', reason: controller.signal.aborted ? 'timeout' : 'no_response' })
  } finally {
    clearTimeout(timer)
  }
}
