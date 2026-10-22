export interface NewsSEO {
  metaTitle?: string;
  metaDescription?: string;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  content: string;
  publishedAt: string | null;
  author?: string;
  seo?: NewsSEO;
  youtubeUrl?: string;
  instagramUrl?: string;
  /** Secciones de contenido (solo detalle público; [] o ausente en noticias antiguas). */
  sections?: NewsSection[];
}
/** Sección de contenido de una noticia (contrato público de Hub). Solo trae el contenido de su distribución activa. */
export interface NewsSection {
  orden: number;
  title: string | null;
  layout: 'one_column' | 'two_columns';
  /** Una columna. */
  content: string;
  /** Dos columnas. */
  contentLeft: string;
  contentRight: string;
}

/** Sección tal como la administra el editor (trae los tres contenidos aunque solo se publique el de la distribución activa). */
export interface NewsSectionAdmin {
  id: number;
  post_id: number;
  title: string | null;
  layout: 'one_column' | 'two_columns';
  content: string | null;
  content_left: string | null;
  content_right: string | null;
  orden: number;
  visible: boolean;
}

export interface NewsSectionInput {
  title: string | null;
  layout: 'one_column' | 'two_columns';
  content: string | null;
  content_left: string | null;
  content_right: string | null;
  visible: boolean;
}
