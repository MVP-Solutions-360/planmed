// Páginas informativas simples administradas en la web de Planmed (no en Wellezy Hub): título, subtítulo y un cuerpo con texto enriquecido.
// Módulo PURO (solo importa embedUrl, también puro), compartido por el navegador, el servidor Nitro y las pruebas. El HTML del cuerpo lo sanea el servidor
// (server/utils/sitePages.ts) y lo vuelve a sanear CommonRichContent al mostrarlo. No hay contenido inicial inventado: cuerpo vacío.

// Único import del módulo: la validación de enlaces de YouTube se reutiliza (misma regla que noticias y recomendaciones).
// Ruta relativa con extensión: las pruebas de Node (sin alias de Nuxt) la resuelven; el bundler también.
// @ts-expect-error TS5097: la extensión .ts solo se permite con allowImportingTsExtensions.
import { parseEmbedUrl } from './embedUrl.ts'

/** `videoUrl`: enlace de YouTube opcional (vacío = sin video). Se guarda en su forma canónica https://www.youtube.com/watch?v=ID. */
export interface SitePageContent { title: string, subtitle: string, body: string, videoUrl: string, updatedAt: string }
export type SitePageErrors = Record<string, string>

export const SITE_PAGES = {
  'clinicas-aliadas': { title: 'Clínicas aliadas', route: '/clinicas-aliadas' }
} as const
export type SitePageSlug = keyof typeof SITE_PAGES

export const SITE_PAGE_LIMITS = { title: 200, subtitle: 300, body: 20000 } as const
export function isSitePageSlug(v: unknown): v is SitePageSlug {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(SITE_PAGES, v)
}

export const sitePageDefault = (slug: SitePageSlug): SitePageContent => ({ title: SITE_PAGES[slug].title, subtitle: '', body: '', videoUrl: '', updatedAt: '' })

// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const text = (v: unknown, fb: string) => (typeof v === 'string' ? v.replace(CONTROL_RE, '').replace(/\r\n?/g, '\n').trim() : fb)

/** Lo que falta en `raw` se toma de `fallback`: un cuerpo incompleto nunca borra datos existentes. */
export function normalizeSitePage(raw: any, fallback: SitePageContent): SitePageContent {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  return {
    title: text(r.title, fallback.title),
    subtitle: text(r.subtitle, fallback.subtitle),
    body: text(r.body, fallback.body),
    videoUrl: text(r.videoUrl, fallback.videoUrl ?? ''),
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : fallback.updatedAt
  }
}

export function validateSitePage(c: SitePageContent): SitePageErrors {
  const e: SitePageErrors = {}
  if (!c.title) e.title = 'El título es obligatorio.'
  else if (c.title.length > SITE_PAGE_LIMITS.title) e.title = `El título admite máximo ${SITE_PAGE_LIMITS.title} caracteres.`
  if (c.subtitle.length > SITE_PAGE_LIMITS.subtitle) e.subtitle = `El subtítulo admite máximo ${SITE_PAGE_LIMITS.subtitle} caracteres.`
  if (c.body.length > SITE_PAGE_LIMITS.body) e.body = `El contenido admite máximo ${SITE_PAGE_LIMITS.body} caracteres.`
  if (c.videoUrl && parseEmbedUrl(c.videoUrl)?.platform !== 'youtube') e.videoUrl = 'El enlace debe ser un video de YouTube (youtube.com o youtu.be).'
  return e
}

/** Identificador de un video de YouTube válido (el que devuelve parseEmbedUrl), o '' si no hay video o no es válido. */
export function sitePageVideoId(value: unknown): string {
  const p = parseEmbedUrl(value)
  return p?.platform === 'youtube' ? p.id : ''
}

/** Enlace de YouTube en su forma canónica, o '' si no hay video o no es válido. */
export function sitePageVideoUrl(value: unknown): string {
  const p = parseEmbedUrl(value)
  return p?.platform === 'youtube' ? p.url : ''
}
