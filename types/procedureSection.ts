// Secciones de contenido de un procedimiento PARA LA LÍNEA del usuario (Wellezy Hub: /cms/procedures/{id}/sections).
// @ts-expect-error TS5097: la extensión .ts solo se permite con allowImportingTsExtensions.
import type { AdminBlock, BlockInput, ColumnLayout, PublicBlocks } from '../shared/utils/contentBlocks.ts'

export const PROCEDURE_SECTION_LAYOUTS = ['media_left', 'media_right'] as const
export type ProcedureSectionLayout = typeof PROCEDURE_SECTION_LAYOUTS[number]

export interface ProcedureSectionAdmin {
  id: number
  cirugia_id: number
  title: string | null
  content: string | null
  /** Posición de la imagen del formato anterior (solo secciones sin bloques). */
  layout: ProcedureSectionLayout
  /** Distribución de los bloques (solo con `blocks_mode`). */
  column_layout: ColumnLayout
  /** true = la sección se administra con bloques apilables por columna; false = formato anterior (título + texto + imagen + posición). */
  blocks_mode: boolean
  blocks: AdminBlock[]
  /** Imagen del formato anterior. */
  image_url: string | null
  orden: number
  visible: boolean
}

export type ProcedureSectionInput = Partial<{
  title: string | null
  content: string | null
  layout: ProcedureSectionLayout
  column_layout: ColumnLayout
  blocks: BlockInput[]
  orden: number
  visible: boolean
}>

/** Sección tal como la entrega la API pública del detalle (`secciones`), ya filtrada por la línea de Planmed. Un único formato de bloques por columna. */
export interface ProcedureSectionPublic {
  orden: number
  title: string | null
  /** Formato anterior: se conserva por compatibilidad; la representación usa `blocks`. */
  content: string
  layout: ProcedureSectionLayout
  image: { url: string } | null
  columnLayout: ColumnLayout
  blocks: PublicBlocks
}
