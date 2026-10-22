// Bloques de contenido apilables por columna (texto, imagen, video de YouTube, post de Instagram) de las secciones de noticias y de procedimientos.
// Módulo PURO: lo usan los mapeos de Nitro, los componentes y las pruebas. Planmed NO confía en la respuesta remota: re-valida cada bloque público.
// Ruta relativa con extensión: las pruebas de Node (sin alias de Nuxt) la resuelven; el bundler también.
// @ts-expect-error TS5097: la extensión .ts solo se permite con allowImportingTsExtensions.
import { parseEmbedUrl } from './embedUrl.ts'

export type BlockType = 'text' | 'image' | 'youtube' | 'instagram'
export type BlockSlot = 'main' | 'left' | 'right'
export type ColumnLayout = 'one_column' | 'two_columns'

export const BLOCK_TYPES: readonly BlockType[] = ['text', 'image', 'youtube', 'instagram']
/** Orden en que Hub devuelve los bloques (por columna, alfabético): el de envío debe coincidir para emparejar los ids nuevos. */
export const SLOT_ORDER: readonly BlockSlot[] = ['left', 'main', 'right']

/** Columnas de la distribución activa, en orden de lectura (izquierda → derecha). */
export function activeSlots(layout: ColumnLayout): BlockSlot[] {
  return layout === 'two_columns' ? ['left', 'right'] : ['main']
}

// ───────────── Público ─────────────

export type PublicBlock =
  | { type: 'text', html: string }
  | { type: 'image', url: string, alt: string }
  | { type: 'youtube', url: string }
  | { type: 'instagram', url: string }

export interface PublicBlocks { main: PublicBlock[], left: PublicBlock[], right: PublicBlock[] }

const textOf = (html: string) => html.replace(/<[^>]*>/g, '').trim()

/**
 * Un bloque del contrato público de Hub → bloque validado. El texto se sanitiza al renderizar, la imagen solo se acepta con URL absoluta http(s) y los
 * videos/posts se re-validan (host en lista blanca + identificador) y se reconstruyen en su forma canónica; un bloque inválido se descarta.
 */
export function fromPublicBlock(raw: any): PublicBlock | null {
  if (!raw || typeof raw !== 'object') return null
  switch (raw.type) {
    case 'text':
      return typeof raw.html === 'string' && textOf(raw.html) !== '' ? { type: 'text', html: raw.html } : null
    case 'image':
      return typeof raw.url === 'string' && /^https?:\/\//i.test(raw.url) ? { type: 'image', url: raw.url, alt: typeof raw.alt === 'string' ? raw.alt : '' } : null
    case 'youtube':
    case 'instagram': {
      const parsed = parseEmbedUrl(raw.url)
      return parsed && parsed.platform === raw.type ? { type: raw.type, url: parsed.url } : null
    }
    default:
      return null
  }
}

/**
 * `blocks` público de una sección → bloques validados de la distribución activa (las otras columnas quedan vacías). Si Hub no trae `blocks` (versión
 * anterior), se usa `fallback` (derivado de los campos antiguos de la sección).
 */
export function publicBlocksOf(raw: any, layout: ColumnLayout, fallback: () => PublicBlocks): PublicBlocks {
  if (!raw || typeof raw !== 'object') return fallback()
  const out: PublicBlocks = { main: [], left: [], right: [] }
  for (const slot of activeSlots(layout)) {
    out[slot] = (Array.isArray(raw[slot]) ? raw[slot] : []).map(fromPublicBlock).filter((b: PublicBlock | null): b is PublicBlock => b !== null)
  }
  return out
}

export function countBlocks(blocks: PublicBlocks, layout: ColumnLayout): number {
  return activeSlots(layout).reduce((n, slot) => n + (blocks?.[slot]?.length ?? 0), 0)
}

// ───────────── Administración (borradores del editor) ─────────────

/** Bloque tal como lo devuelve la API CMS de Hub. */
export interface AdminBlock {
  id: number
  slot: BlockSlot
  type: BlockType
  content: string | null
  url: string | null
  alt: string | null
  image_url: string | null
  orden: number
}

/** Bloque en edición. `imageUrl` = imagen ya guardada; `newImage` = data URL aún no enviada; `fromSectionImage` = copiar la imagen del formato anterior. */
export interface DraftBlock {
  key: number
  id?: number
  slot: BlockSlot
  type: BlockType
  content: string
  url: string
  alt: string
  imageUrl: string
  newImage: string
  fromSectionImage?: boolean
}

export interface BlockInput {
  id?: number
  slot: BlockSlot
  type: BlockType
  content?: string | null
  url?: string | null
  alt?: string | null
  from_section_image?: boolean
}

let uid = 0

export function newDraftBlock(slot: BlockSlot, type: BlockType, init: Partial<DraftBlock> = {}): DraftBlock {
  return { key: ++uid, slot, type, content: '', url: '', alt: '', imageUrl: '', newImage: '', ...init }
}

export function draftFromAdmin(blocks: readonly AdminBlock[]): DraftBlock[] {
  return blocks.map(b => newDraftBlock(b.slot, b.type, { id: b.id, content: b.content ?? '', url: b.url ?? '', alt: b.alt ?? '', imageUrl: b.image_url ?? '' }))
}

export const urlOk = (b: Pick<DraftBlock, 'type' | 'url'>) => parseEmbedUrl(b.url)?.platform === b.type

export function blockHasData(b: DraftBlock): boolean {
  if (b.type === 'text') return textOf(b.content) !== ''
  if (b.type === 'image') return !!(b.newImage || b.imageUrl)
  return urlOk(b)
}

const LABEL: Record<BlockType, string> = { text: 'texto', image: 'imagen', youtube: 'video de YouTube', instagram: 'post de Instagram' }

/**
 * Bloques a guardar, en el orden de Hub (por columna) para poder emparejar después los ids de los nuevos. Un bloque vacío o inválido de una columna
 * ACTIVA es un error; en una inactiva se descarta (no hay nada que conservar). Se envían los bloques de TODAS las columnas: cambiar de distribución
 * nunca borra contenido.
 */
export function buildBlockInputs(blocks: readonly DraftBlock[], active: readonly BlockSlot[]): { ordered: DraftBlock[], inputs: BlockInput[], error: string | null } {
  const ordered: DraftBlock[] = []
  let error: string | null = null
  for (const slot of SLOT_ORDER) {
    for (const b of blocks.filter(x => x.slot === slot)) {
      if (blockHasData(b)) { ordered.push(b); continue }
      if (!active.includes(slot)) continue
      error = b.type === 'text' ? 'Hay un bloque de texto vacío: escríbelo o quítalo.'
        : b.type === 'image' ? 'Hay un bloque de imagen sin imagen: súbela o quita el bloque.'
          : `Hay un bloque de ${LABEL[b.type]} con un enlace no válido: corrígelo o quítalo.`
    }
  }
  const inputs = ordered.map<BlockInput>(b => ({
    ...(b.id ? { id: b.id } : {}),
    slot: b.slot,
    type: b.type,
    content: b.type === 'text' ? b.content : null,
    url: b.type === 'youtube' || b.type === 'instagram' ? b.url.trim() : null,
    alt: b.type === 'image' ? (b.alt.trim() || null) : null,
    ...(b.type === 'image' && b.fromSectionImage && !b.id ? { from_section_image: true } : {})
  }))
  return { ordered, inputs, error }
}
