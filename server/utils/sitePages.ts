import type { H3Event } from 'h3'
import { mkdir, readFile, rename, writeFile, copyFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
// Ruta relativa con extensión: las pruebas de Node (sin alias de Nuxt) la resuelven; el bundler de Nitro también.
// @ts-expect-error TS5097: la extensión .ts solo se permite con allowImportingTsExtensions.
import { sanitizeRichHtml } from '../../utils/richText.ts'

// Persistencia LOCAL de las páginas informativas simples (Clínicas aliadas, Estudio de créditos): un JSON por página en
// `<NUXT_PLANMED_CONTENT_DIR>/pages/<slug>.json`, junto al contenido de «Nosotros». No usa Wellezy Hub.
// Helpers de Nitro (createError, aboutContentDir, requireAboutEditor, normalizeSitePage, …) son auto-imports.

const dirOf = (event: H3Event) => join(aboutContentDir(event), 'pages')

export function resolveSitePageSlug(raw: unknown): SitePageSlug {
  if (typeof raw !== 'string' || !Object.prototype.hasOwnProperty.call(SITE_PAGES, raw)) throw createError({ statusCode: 404, message: 'Página no encontrada.' })
  return raw as SitePageSlug
}

export async function readSitePage(event: H3Event, slug: SitePageSlug): Promise<SitePageContent> {
  const fallback = sitePageDefault(slug)
  let raw: string
  try {
    raw = await readFile(join(dirOf(event), `${slug}.json`), 'utf8')
  } catch (error: any) {
    if (error?.code === 'ENOENT') return fallback
    console.error('[pages] No se pudo leer la página:', slug, error?.code ?? 'error')
    throw createError({ statusCode: 500, message: 'No fue posible leer el contenido guardado.' })
  }
  try {
    return normalizeSitePage(JSON.parse(raw), fallback)
  } catch {
    console.error('[pages] JSON inválido en la página:', slug)
    throw createError({ statusCode: 500, message: 'El contenido guardado está dañado. Revisa el archivo de respaldo antes de guardar.' })
  }
}

export async function writeSitePage(event: H3Event, slug: SitePageSlug, content: SitePageContent): Promise<void> {
  const dir = dirOf(event)
  try {
    await mkdir(dir, { recursive: true })
    const target = join(dir, `${slug}.json`)
    await copyFile(target, join(dir, `${slug}.prev.json`)).catch((e: any) => { if (e?.code !== 'ENOENT') throw e })
    const tmp = join(dir, `${slug}.json.${randomBytes(6).toString('hex')}.tmp`)
    await writeFile(tmp, JSON.stringify(content, null, 2), 'utf8')
    await rename(tmp, target)
  } catch (error: any) {
    console.error('[pages] No se pudo guardar la página:', slug, error?.code ?? 'error')
    throw createError({ statusCode: 500, message: 'No fue posible guardar los cambios en el servidor. Intenta nuevamente.' })
  }
}

export function parseSitePageBody(body: any, current: SitePageContent): SitePageContent {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 422, message: 'Revisa los datos ingresados.', data: { message: 'Revisa los datos ingresados.', errors: {} } })
  }
  const next = normalizeSitePage(body, current)
  next.body = sanitizeRichHtml(next.body)
  const errors = validateSitePage(next)
  const keys = Object.keys(errors)
  if (keys.length) {
    const message = errors[keys[0]!]!
    throw createError({ statusCode: 422, message, data: { message, errors } })
  }
  return next
}
