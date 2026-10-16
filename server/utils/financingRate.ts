import type { H3Event } from 'h3'
import { mkdir, readFile, rename, writeFile, copyFile, link, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { parseFinancingRate } from '#shared/utils/financing'

// Tasa de interés mensual del simulador. Persistencia LOCAL (no usa Wellezy Hub): `<NUXT_PLANMED_CONTENT_DIR>/financing-rate.json`, el mismo
// directorio persistente y fuera de `.output/` que usan «Nosotros» y «Clínicas aliadas». Helpers de Nitro (createError, authError,
// aboutContentDir, adminSession, wellezyMe, isAuthorizedUser, …) son auto-imports.
//
// - Valor de ARRANQUE explícito: si el archivo NO existe (primer despliegue) se crea una sola vez con 2.0000 % y una entrada de historial
//   «Valor inicial del sistema». Nunca se sobrescribe un archivo existente. No es un respaldo del cálculo: el cálculo siempre lee el archivo.
// - Archivo ilegible, dañado o con un valor inválido => error explícito (503 `rate_unavailable`); NO se reemplaza por el 2 %.
// - Escritura atómica (temporal + rename) con respaldo `.prev`, exclusión mutua dentro del proceso y control de edición concurrente por `updatedAt`.

const FILE = 'financing-rate.json'
const BACKUP = 'financing-rate.prev.json'
export const FINANCING_RATE_INITIAL = '2.0000'
export const FINANCING_RATE_HISTORY_MAX = 500
export const MSG_RATE_UNAVAILABLE = 'La tasa de financiación no está disponible en este momento. Intenta nuevamente más tarde.'
export const MSG_RATE_FORBIDDEN = 'No tienes permiso para consultar o modificar la tasa de financiación.'

export interface FinancingRateActor { id: number | null, name: string }
export interface FinancingRateEntry { rate: string, updatedAt: string, updatedBy: FinancingRateActor, source: 'initial' | 'admin' }
export interface FinancingRateRecord extends FinancingRateEntry { version: 1, history: FinancingRateEntry[] }

function unavailable(): never {
  throw createError({ statusCode: 503, message: MSG_RATE_UNAVAILABLE, data: { message: MSG_RATE_UNAVAILABLE, code: 'rate_unavailable' } })
}

function rateFile(event: H3Event) { return join(aboutContentDir(event), FILE) }

// Comprobación pura (no es un type guard): un guard sobre el documento completo lo estrecharía a FinancingRateEntry y ocultaría `history`.
function isEntry(e: any): boolean {
  if (!e || typeof e !== 'object' || typeof e.updatedAt !== 'string' || Number.isNaN(Date.parse(e.updatedAt))) return false
  if (e.source !== 'initial' && e.source !== 'admin') return false
  if (!e.updatedBy || typeof e.updatedBy.name !== 'string' || !(e.updatedBy.id === null || Number.isSafeInteger(e.updatedBy.id))) return false
  const p = parseFinancingRate(e.rate)
  return typeof e.rate === 'string' && p.ok && p.text === e.rate
}

/** Valida el JSON guardado. Cualquier incoherencia => null (el llamador responde con error explícito). */
export function parseStoredFinancingRate(raw: string): FinancingRateRecord | null {
  let data: any
  try { data = JSON.parse(raw) } catch { return null }
  if (!data || data.version !== 1 || !isEntry(data) || !Array.isArray(data.history) || !data.history.every(isEntry)) return null
  return data as FinancingRateRecord
}

function initialRecord(): FinancingRateRecord {
  const entry: FinancingRateEntry = { rate: FINANCING_RATE_INITIAL, updatedAt: new Date().toISOString(), updatedBy: { id: null, name: 'Valor inicial del sistema' }, source: 'initial' }
  return { version: 1, ...entry, history: [entry] }
}

/** Crea el archivo inicial SOLO si no existe (enlace exclusivo: nunca pisa un archivo de otro proceso). */
async function seed(event: H3Event): Promise<FinancingRateRecord> {
  const dir = aboutContentDir(event)
  const target = rateFile(event)
  const record = initialRecord()
  const tmp = join(dir, `${FILE}.${randomBytes(6).toString('hex')}.tmp`)
  try {
    await mkdir(dir, { recursive: true })
    await writeFile(tmp, JSON.stringify(record, null, 2), 'utf8')
    try {
      await link(tmp, target)
    } catch (e: any) {
      if (e?.code !== 'EEXIST') throw e
      return await readExisting(event)
    }
    console.info(`[financing-rate] No existía ${FILE}: se cargó el valor de arranque ${FINANCING_RATE_INITIAL} % mensual.`)
    return record
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('[financing-rate] No se pudo crear la configuración inicial:', error?.code ?? 'error')
    return unavailable()
  } finally {
    await unlink(tmp).catch(() => {})
  }
}

async function readExisting(event: H3Event): Promise<FinancingRateRecord> {
  let raw: string
  try {
    raw = await readFile(rateFile(event), 'utf8')
  } catch (error: any) {
    if (error?.code === 'ENOENT') return await seed(event)
    console.error('[financing-rate] No se pudo leer la tasa:', error?.code ?? 'error')
    return unavailable()
  }
  const record = parseStoredFinancingRate(raw)
  if (!record) {
    console.error(`[financing-rate] ${FILE} está dañado o contiene un valor inválido. Revisa ${BACKUP} antes de guardar.`)
    return unavailable()
  }
  return record
}

/** Tasa vigente persistida (crea el valor de arranque la primera vez). */
export function readFinancingRate(event: H3Event): Promise<FinancingRateRecord> {
  return readExisting(event)
}

// Exclusión mutua dentro del proceso: comprobar `updatedAt` y escribir es una sola sección crítica.
let queue: Promise<unknown> = Promise.resolve()
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn)
  queue = run.catch(() => {})
  return run
}

/** Guarda una tasa nueva. `expectedUpdatedAt` es la versión que la persona vio al abrir el formulario; si cambió => 409. */
export function saveFinancingRate(event: H3Event, rate: string, expectedUpdatedAt: unknown, actor: FinancingRateActor): Promise<FinancingRateRecord> {
  return exclusive(async () => {
    const current = await readExisting(event)
    if (typeof expectedUpdatedAt !== 'string' || expectedUpdatedAt !== current.updatedAt) {
      const message = 'Otra persona modificó la tasa mientras editabas. Recarga la página para ver el valor vigente antes de guardar.'
      throw createError({ statusCode: 409, message, data: { message, errors: {} } })
    }
    if (current.rate === rate) return current // sin cambios: no se agrega una entrada de historial
    // `updatedAt` es la versión que detecta ediciones concurrentes: debe ser ESTRICTAMENTE creciente (dos guardados en el mismo milisegundo,
    // o un reloj que retrocede, darían la misma versión y una edición con datos viejos pasaría sin conflicto).
    const updatedAt = new Date(Math.max(Date.now(), Date.parse(current.updatedAt) + 1)).toISOString()
    const entry: FinancingRateEntry = { rate, updatedAt, updatedBy: actor, source: 'admin' }
    const next: FinancingRateRecord = { version: 1, ...entry, history: [entry, ...current.history].slice(0, FINANCING_RATE_HISTORY_MAX) }
    const dir = aboutContentDir(event)
    const tmp = join(dir, `${FILE}.${randomBytes(6).toString('hex')}.tmp`)
    try {
      const target = rateFile(event)
      await copyFile(target, join(dir, BACKUP)).catch((e: any) => { if (e?.code !== 'ENOENT') throw e })
      await writeFile(tmp, JSON.stringify(next, null, 2), 'utf8')
      await rename(tmp, target)
    } catch (error: any) {
      console.error('[financing-rate] No se pudo guardar la tasa:', error?.code ?? 'error')
      throw createError({ statusCode: 500, message: 'No fue posible guardar la tasa en el servidor. Intenta nuevamente.' })
    } finally {
      // Tras un rename correcto el temporal ya no existe (ENOENT ignorado); tras cualquier fallo no queda un .tmp huérfano.
      await unlink(tmp).catch(() => {})
    }
    return next
  })
}

/** Cuerpo del formulario de administración. Lanza 422 con el error por campo; nunca corrige la entrada. */
export function parseFinancingRateBody(body: any): { rate: string, expectedUpdatedAt: unknown } {
  const fail = (message: string): never => {
    throw createError({ statusCode: 422, message, data: { message, errors: { rate: message } } })
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Revisa los datos ingresados.')
  const parsed = parseFinancingRate(body.rate)
  if (!parsed.ok) return fail(parsed.message)
  return { rate: parsed.text, expectedUpdatedAt: body.expectedUpdatedAt }
}

/** Vista pública: solo la tasa y la versión. Nunca quién la modificó. */
export function financingRatePublicView(record: FinancingRateRecord) {
  return { rate: record.rate, updatedAt: record.updatedAt }
}

/** Vista de administración: tasa vigente, responsable y los últimos cambios. */
export function financingRateAdminView(record: FinancingRateRecord) {
  return { rate: record.rate, updatedAt: record.updatedAt, updatedBy: record.updatedBy, source: record.source, history: record.history.slice(0, 20) }
}

// ── Autorización ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Pueden consultar y modificar la tasa: el líder de la línea y los roles listados en NUXT_PLANMED_RATE_EDITOR_ROLE_IDS (la diseñadora).
// En ambos casos el usuario debe seguir autorizado para el CMS (rol en NUXT_PLANMED_ADMIN_ROLE_IDS). No se concede nada a otros roles ni
// se modifican los permisos de las demás secciones de Configuración (colaboradores: solo el líder).
export function rateEditorRoleIds(event: H3Event): number[] {
  return String(useRuntimeConfig(event).planmedRateEditorRoleIds ?? '')
    .split(',')
    .map(s => Number(s.trim()))
    .filter(n => Number.isSafeInteger(n) && n > 0)
}

export function canManageFinancingRate(event: H3Event, user: { role?: { id: number | string } | null, is_area_leader?: boolean }): boolean {
  if (!isAuthorizedUser(event, user as any)) return false
  if (user.is_area_leader === true) return true
  return !!user.role && rateEditorRoleIds(event).includes(Number(user.role.id))
}

/** Origen + sesión + usuario vigente en Hub con permiso sobre la tasa. 401 sin sesión · 403 sin permiso · 503 si Hub no responde. */
export async function requireRateEditor(event: H3Event) {
  const { session, token } = await adminSession(event)
  const res = await wellezyMe(event, token)
  if (res.status === 401) {
    await session.clear()
    throw authError(401, 'No autenticado')
  }
  if (res.status === 403) throw authError(403, MSG_RATE_FORBIDDEN)
  if (res.status !== 200 || !res.data) throw authError(503, MSG_UNAVAILABLE)
  const user = res.data.user
  if (!canManageFinancingRate(event, user)) throw authError(403, MSG_RATE_FORBIDDEN)
  return user
}
