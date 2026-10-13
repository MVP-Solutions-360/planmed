import type { H3Event } from 'h3'
import { mkdir, readFile, rename, writeFile, copyFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
// Ruta relativa con extensión: las pruebas de Node (sin alias de Nuxt) la resuelven; el bundler de Nitro también.
// @ts-expect-error TS5097: la extensión .ts solo se permite con allowImportingTsExtensions.
import { sanitizeRichHtml } from '../../utils/richText.ts'
// Importación explícita (no auto-import): el auto-import de Nitro omite algunas constantes de shared/utils (p. ej. la que sigue a un `as const`)
// y el fallo solo aparece en ejecución («CLINIC_MEDIA_PREFIX is not defined»).
// @ts-expect-error TS5097: la extensión .ts solo se permite con allowImportingTsExtensions.
import { CLINIC_MEDIA_PREFIX, CLINIC_MEDIA_NAME_RE, clinicMediaUrls, clinicsDefault, normalizeClinics, validateClinics, type ClinicsContent } from '../../shared/utils/clinics.ts'

// Persistencia LOCAL de «Clínicas aliadas» (no usa Wellezy Hub): `<NUXT_PLANMED_CONTENT_DIR>/clinics.json` y los archivos subidos en
// `<dir>/clinics-media/`. Helpers de Nitro (createError, aboutContentDir, requireAboutEditor, normalizeClinics, …) son auto-imports.

const FILE = 'clinics.json'
const MEDIA_DIR = 'clinics-media'
const MAX_IMAGE = 5 * 1024 * 1024
const MAX_DOC = 10 * 1024 * 1024

const MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }
export const CLINIC_MEDIA_TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf' }

export async function readClinics(event: H3Event): Promise<ClinicsContent> {
  let raw: string
  try {
    raw = await readFile(join(aboutContentDir(event), FILE), 'utf8')
  } catch (error: any) {
    if (error?.code === 'ENOENT') return clinicsDefault()
    console.error('[clinics] No se pudo leer el contenido:', error?.code ?? 'error')
    throw createError({ statusCode: 500, message: 'No fue posible leer el contenido guardado.' })
  }
  try {
    return normalizeClinics(JSON.parse(raw))
  } catch {
    console.error('[clinics] El archivo de contenido no es JSON válido.')
    throw createError({ statusCode: 500, message: 'El contenido guardado está dañado. Revisa el archivo de respaldo antes de guardar.' })
  }
}

export async function writeClinics(event: H3Event, content: ClinicsContent): Promise<void> {
  const dir = aboutContentDir(event)
  try {
    await mkdir(dir, { recursive: true })
    const target = join(dir, FILE)
    await copyFile(target, join(dir, 'clinics.prev.json')).catch((e: any) => { if (e?.code !== 'ENOENT') throw e })
    const tmp = join(dir, `${FILE}.${randomBytes(6).toString('hex')}.tmp`)
    await writeFile(tmp, JSON.stringify(content, null, 2), 'utf8')
    await rename(tmp, target)
  } catch (error: any) {
    console.error('[clinics] No se pudo guardar el contenido:', error?.code ?? 'error')
    throw createError({ statusCode: 500, message: 'No fue posible guardar los cambios en el servidor. Intenta nuevamente.' })
  }
}

/** Valida y sanea el cuerpo del formulario sobre el contenido actual. Lanza 422 con los errores por campo. */
export function parseClinicsBody(body: any, current: ClinicsContent): ClinicsContent {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 422, message: 'Revisa los datos ingresados.', data: { message: 'Revisa los datos ingresados.', errors: {} } })
  }
  const next = normalizeClinics(body, current)
  next.clinics.forEach((c) => { c.description = sanitizeRichHtml(c.description) })
  const errors = validateClinics(next)
  const keys = Object.keys(errors)
  if (keys.length) {
    const message = errors[keys[0]!]!
    throw createError({ statusCode: 422, message, data: { message, errors } })
  }
  return next
}

/** Archivos propios que estaban referenciados y ya no lo están: se borran (sin fallar). */
export async function removeUnusedClinicMedia(event: H3Event, before: ClinicsContent, after: ClinicsContent): Promise<void> {
  const keep = new Set(clinicMediaUrls(after))
  for (const url of new Set(clinicMediaUrls(before))) {
    if (keep.has(url)) continue
    const name = url.slice(CLINIC_MEDIA_PREFIX.length)
    if (CLINIC_MEDIA_NAME_RE.test(name)) await unlink(join(aboutContentDir(event), MEDIA_DIR, name)).catch(() => {})
  }
}

/** Sube una imagen (JPG/PNG/WebP ≤ 5 MB) o un documento (además PDF ≤ 10 MB) desde un data URL y devuelve su URL pública. */
export async function saveClinicFile(event: H3Event, dataUrl: unknown, kind: unknown): Promise<string> {
  const fail = (message: string, field = 'file') => createError({ statusCode: 422, message, data: { message, errors: { [field]: message } } })
  if (kind !== 'image' && kind !== 'document') throw fail('Tipo de archivo no válido.')
  const m = typeof dataUrl === 'string' ? /^data:((?:image\/(?:jpeg|png|webp))|application\/pdf);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl) : null
  if (!m) throw fail(kind === 'image' ? 'La imagen debe ser JPG, PNG o WebP de máximo 5 MB.' : 'El archivo debe ser PDF, JPG, PNG o WebP de máximo 10 MB.')
  const mime = m[1]!
  if (kind === 'image' && mime === 'application/pdf') throw fail('La imagen debe ser JPG, PNG o WebP de máximo 5 MB.')
  const bytes = Buffer.from(m[2]!, 'base64')
  if (!bytes.length || bytes.length > (kind === 'image' ? MAX_IMAGE : MAX_DOC)) {
    throw fail(kind === 'image' ? 'La imagen debe ser JPG, PNG o WebP de máximo 5 MB.' : 'El archivo debe ser PDF, JPG, PNG o WebP de máximo 10 MB.')
  }
  const prefix = mime === 'application/pdf' || kind === 'document' ? 'doc' : 'img'
  const name = `${prefix}-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}.${MIME_EXT[mime]}`
  const dir = join(aboutContentDir(event), MEDIA_DIR)
  try {
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, name), bytes)
  } catch (error: any) {
    console.error('[clinics] No se pudo guardar el archivo:', error?.code ?? 'error')
    throw createError({ statusCode: 500, message: 'No fue posible guardar el archivo. Intenta nuevamente.' })
  }
  return `${CLINIC_MEDIA_PREFIX}${name}`
}

export async function readClinicFile(event: H3Event, name: string): Promise<Buffer | null> {
  if (!CLINIC_MEDIA_NAME_RE.test(name)) return null
  try { return await readFile(join(aboutContentDir(event), MEDIA_DIR, name)) } catch { return null }
}
