// Dónde aparece la página en el menú: suelta en "Recomendaciones" o dentro del submenú de cuidados / revisión.
export type RecommendationGroup = 'general' | 'cuidados' | 'revision';

export interface RecommendationPage {
  slug: string;
  group: RecommendationGroup;
  // true = creada desde el panel (se puede eliminar); false = páginas base.
  custom: boolean;
  menuLabel: string;
  title: string;
  videoUrl: string;
  image: string;
  content: string;
  published: boolean;
  // Slug del procedimiento al que sustituye (el Hub lo informa solo si ese procedimiento sigue activo y habilitado en la línea).
  // null = página independiente. No se lista aparte en el menú: la representa la entrada del procedimiento.
  procedureSlug?: string | null;
  // Enlace corto (solo lectura, lo genera el Hub al publicar). Ausente si aún no existe o el Hub no tiene dominio de enlaces cortos.
  shortUrl?: string;
}

// Páginas fijas del menú "Recomendaciones"; el panel solo edita su contenido.
// Cuidados de cirugías y cita de revisión salen de los procedimientos (ver Procedure.recomendaciones_*).
export const RECOMMENDATION_SLUGS = [
  { slug: 'cita-preanestesia', menuLabel: 'Recomendaciones para asistir a la cita de preanestesia' },
  { slug: 'prequirurgicas', menuLabel: 'Recomendaciones prequirúrgicas' }
] as const;

// Slugs que no se pueden usar porque son rutas propias (portadas de cuidados y revisión).
export const RESERVED_RECOMMENDATION_SLUGS = ['cuidados', 'revision'];
