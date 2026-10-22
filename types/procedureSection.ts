// Secciones de contenido de un procedimiento PARA LA LÍNEA del usuario (Wellezy Hub: /cms/procedures/{id}/sections).
export const PROCEDURE_SECTION_LAYOUTS = ['media_left', 'media_right'] as const
export type ProcedureSectionLayout = typeof PROCEDURE_SECTION_LAYOUTS[number]

export interface ProcedureSectionAdmin {
  id: number
  cirugia_id: number
  title: string | null
  content: string | null
  layout: ProcedureSectionLayout
  image_url: string | null
  orden: number
  visible: boolean
}

export type ProcedureSectionInput = Partial<{ title: string | null, content: string | null, layout: ProcedureSectionLayout, orden: number, visible: boolean }>

/** Sección tal como la entrega la API pública del detalle (`secciones`), ya filtrada por la línea de Planmed. */
export interface ProcedureSectionPublic {
  orden: number
  title: string | null
  content: string
  layout: ProcedureSectionLayout
  image: { url: string } | null
}
