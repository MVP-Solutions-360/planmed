import type { H3Event } from 'h3'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// Orientación de la imagen de portada de cada procedimiento («vertical» 1080 × 1920 u «horizontal» 1920 × 1080).
// Wellezy Hub no tiene ese dato, así que se guarda LOCALMENTE en Planmed (`<NUXT_PLANMED_CONTENT_DIR>/procedure-image-orientation.json`,
// mapa slug → orientación), igual que «Nosotros» y «Clínicas aliadas». Sin dato, la portada es vertical.
// Helpers de Nitro (aboutContentDir, createError) son auto-imports.

export type ProcedureImageOrientation = 'vertical' | 'horizontal'
export const DEFAULT_IMAGE_ORIENTATION: ProcedureImageOrientation = 'vertical'

const FILE = 'procedure-image-orientation.json'
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function normalizeOrientation(v: unknown): ProcedureImageOrientation {
  return v === 'horizontal' ? 'horizontal' : DEFAULT_IMAGE_ORIENTATION
}

export async function readOrientations(event: H3Event): Promise<Record<string, ProcedureImageOrientation>> {
  try {
    const parsed = JSON.parse(await readFile(join(aboutContentDir(event), FILE), 'utf8'))
    const out: Record<string, ProcedureImageOrientation> = {}
    if (parsed && typeof parsed === 'object') for (const [k, v] of Object.entries(parsed)) if (SLUG_RE.test(k)) out[k] = normalizeOrientation(v)
    return out
  } catch (error: any) {
    // Sin archivo (o ilegible) la web sigue funcionando con la orientación por defecto; no se bloquea la carga de procedimientos.
    if (error?.code !== 'ENOENT') console.error('[procedures] No se pudo leer la orientación de imágenes:', error?.code ?? 'error')
    return {}
  }
}

export async function saveOrientation(event: H3Event, slug: string, value: unknown): Promise<void> {
  if (value !== 'vertical' && value !== 'horizontal') return
  if (!SLUG_RE.test(slug)) return
  const dir = aboutContentDir(event)
  const all = await readOrientations(event)
  if (all[slug] === value) return
  all[slug] = value
  try {
    await mkdir(dir, { recursive: true })
    const target = join(dir, FILE)
    const tmp = `${target}.${process.pid}.tmp`
    await writeFile(tmp, JSON.stringify(all, null, 2), 'utf8')
    await rename(tmp, target)
  } catch (error: any) {
    console.error('[procedures] No se pudo guardar la orientación de imágenes:', error?.code ?? 'error')
    throw createError({ statusCode: 500, message: 'El procedimiento se guardó, pero no fue posible guardar la orientación de la imagen.' })
  }
}

/** Añade `imageOrientation` a cada procedimiento (por slug). */
export async function withOrientation<T extends { slug: string }>(event: H3Event, rows: T[]): Promise<Array<T & { imageOrientation: ProcedureImageOrientation }>> {
  const all = await readOrientations(event)
  return rows.map(r => ({ ...r, imageOrientation: all[r.slug] ?? DEFAULT_IMAGE_ORIENTATION }))
}
