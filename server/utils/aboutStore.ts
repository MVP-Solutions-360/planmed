import type { H3Event } from 'h3'
import { mkdir, readFile, rename, writeFile, copyFile, unlink } from 'node:fs/promises'
import { join, isAbsolute, resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
// Ruta relativa con extensión: las pruebas de Node (sin alias de Nuxt) la resuelven; el bundler de Nitro también.
// @ts-expect-error TS5097: la extensión .ts solo se permite con allowImportingTsExtensions.
import { sanitizeRichHtml } from '../../utils/richText.ts'

// Persistencia LOCAL de la página «Nosotros» (no usa Wellezy Hub: esta página se administra solo en la web de Planmed).
// El contenido vive en un archivo JSON en el disco del servidor Nitro (preset node-server), dentro de un directorio configurable
// con NUXT_PLANMED_CONTENT_DIR (por defecto `<cwd>/.data/planmed-content`). Ese directorio debe ser persistente y quedar FUERA de
// `.output/`, para que un nuevo despliegue no lo reemplace. Las imágenes de portada subidas se guardan en `<dir>/media/`.
// Helpers de Nitro (createError, authError, adminSession, wellezyMe, dataUrlToBlob, normalizeAboutContent, …) son auto-imports.

const FILE = 'about.json'
const BACKUP = 'about.prev.json'

export function aboutContentDir(event: H3Event): string {
  const configured = String(useRuntimeConfig(event).planmedContentDir || '').trim()
  const dir = configured || join('.data', 'planmed-content')
  return isAbsolute(dir) ? dir : resolve(process.cwd(), dir)
}

/** Lee el contenido guardado. Sin archivo => contenido inicial. Archivo ilegible => error (no se sobrescribe a ciegas). */
export async function readAboutContent(event: H3Event): Promise<AboutContent> {
  let raw: string
  try {
    raw = await readFile(join(aboutContentDir(event), FILE), 'utf8')
  } catch (error: any) {
    if (error?.code === 'ENOENT') return aboutDefaultContent()
    console.error('[about] No se pudo leer el contenido de «Nosotros»:', error?.code ?? 'error')
    throw createError({ statusCode: 500, message: 'No fue posible leer el contenido guardado.' })
  }
  try {
    return normalizeAboutContent(JSON.parse(raw))
  } catch {
    console.error('[about] El archivo de contenido de «Nosotros» no es JSON válido.')
    throw createError({ statusCode: 500, message: 'El contenido guardado está dañado. Revisa el archivo de respaldo antes de guardar.' })
  }
}

/** Escritura atómica (archivo temporal + rename) conservando la versión anterior como respaldo. */
export async function writeAboutContent(event: H3Event, content: AboutContent): Promise<void> {
  const dir = aboutContentDir(event)
  try {
    await mkdir(dir, { recursive: true })
    const target = join(dir, FILE)
    await copyFile(target, join(dir, BACKUP)).catch((e: any) => { if (e?.code !== 'ENOENT') throw e })
    const tmp = join(dir, `${FILE}.${randomBytes(6).toString('hex')}.tmp`)
    await writeFile(tmp, JSON.stringify(content, null, 2), 'utf8')
    await rename(tmp, target)
  } catch (error: any) {
    console.error('[about] No se pudo guardar el contenido de «Nosotros»:', error?.code ?? 'error')
    throw createError({ statusCode: 500, message: 'No fue posible guardar los cambios en el servidor. Intenta nuevamente.' })
  }
}

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
export const ABOUT_MEDIA_TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

/** Guarda una imagen nueva (data URL JPG/PNG/WebP ≤ 5 MB) y devuelve su URL pública. */
export async function saveAboutImage(event: H3Event, dataUrl: string): Promise<string> {
  const blob = dataUrlToBlob(dataUrl)
  if (!blob) throw createError({ statusCode: 422, message: 'La imagen debe ser JPG, PNG o WebP de máximo 5 MB.', data: { message: 'La imagen debe ser JPG, PNG o WebP de máximo 5 MB.', errors: { 'hero.image': 'La imagen debe ser JPG, PNG o WebP de máximo 5 MB.' } } })
  const name = `hero-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}.${EXT[blob.type]}`
  const dir = join(aboutContentDir(event), 'media')
  try {
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, name), new Uint8Array(await blob.arrayBuffer()))
  } catch (error: any) {
    console.error('[about] No se pudo guardar la imagen de portada:', error?.code ?? 'error')
    throw createError({ statusCode: 500, message: 'No fue posible guardar la imagen. Intenta nuevamente.' })
  }
  return `${ABOUT_MEDIA_PREFIX}${name}`
}

/** Borra (sin fallar) una imagen subida que dejó de usarse. Solo nombres generados por saveAboutImage. */
export async function removeAboutImage(event: H3Event, url: string): Promise<void> {
  if (!url.startsWith(ABOUT_MEDIA_PREFIX)) return
  const name = url.slice(ABOUT_MEDIA_PREFIX.length)
  if (!ABOUT_MEDIA_NAME_RE.test(name)) return
  await unlink(join(aboutContentDir(event), 'media', name)).catch(() => {})
}

export async function readAboutImage(event: H3Event, name: string): Promise<Buffer | null> {
  if (!ABOUT_MEDIA_NAME_RE.test(name)) return null
  try { return await readFile(join(aboutContentDir(event), 'media', name)) } catch { return null }
}

/**
 * Autorización para ESCRIBIR: además de la sesión (y el control de origen) de adminSession, se revalida en cada guardado que el
 * usuario siga autorizado para el CMS (rol en NUXT_PLANMED_ADMIN_ROLE_IDS) consultando /auth/me de Hub, igual que /api/auth/me.
 * Es necesario porque esta escritura no pasa por Hub (que en los demás módulos revalida el token y los permisos).
 */
export async function requireAboutEditor(event: H3Event) {
  const { session, token } = await adminSession(event)
  const res = await wellezyMe(event, token)
  if (res.status === 401) {
    await session.clear()
    throw authError(401, 'No autenticado')
  }
  if (res.status === 403) throw authError(403, MSG_FORBIDDEN)
  if (res.status !== 200 || !res.data) throw authError(503, MSG_UNAVAILABLE)
  if (!isAuthorizedUser(event, res.data.user)) throw authError(403, MSG_FORBIDDEN)
  return res.data.user
}

/** Normaliza y valida el cuerpo del formulario sobre el contenido actual. Lanza 422 con los errores por campo. */
export function parseAboutBody(body: any, current: AboutContent): AboutContent {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 422, message: 'Revisa los datos ingresados.', data: { message: 'Revisa los datos ingresados.', errors: {} } })
  }
  const next = normalizeAboutContent(body, current)
  // Texto enriquecido: lista blanca de etiquetas (el texto plano heredado se convierte a párrafos). Antes de validar, para que un editor vacío cuente como vacío.
  next.institutional.legal = sanitizeRichHtml(next.institutional.legal)
  next.institutional.paragraphs = next.institutional.paragraphs.map(sanitizeRichHtml)
  next.faqs.forEach((f) => { f.answer = sanitizeRichHtml(f.answer) })
  next.contact.schedule = sanitizeRichHtml(next.contact.schedule)
  const errors = validateAboutContent(next)
  const keys = Object.keys(errors)
  if (keys.length) {
    const message = errors[keys[0]!]!
    throw createError({ statusCode: 422, message, data: { message, errors } })
  }
  const id = aboutYoutubeId(next.video.url)!
  next.video.url = aboutYoutubeWatchUrl(id)
  return next
}
