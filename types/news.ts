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
/** Bloque de contenido dentro de una columna de una sección (contrato público de Hub, ya validado por Planmed). */
export type NewsBlock =
  | { type: 'text'; html: string }
  | { type: 'image'; url: string; alt: string }
  | { type: 'youtube'; url: string }
  | { type: 'instagram'; url: string };

export interface NewsSectionBlocks {
  main: NewsBlock[];
  left: NewsBlock[];
  right: NewsBlock[];
}

/** Sección de contenido de una noticia (contrato público de Hub). Solo trae los bloques de su distribución activa. */
export interface NewsSection {
  orden: number;
  title: string | null;
  layout: 'one_column' | 'two_columns';
  blocks: NewsSectionBlocks;
}

export type NewsBlockType = 'text' | 'image' | 'youtube' | 'instagram';
export type NewsBlockSlot = 'main' | 'left' | 'right';

/** Bloque tal como lo administra el editor. */
export interface NewsBlockAdmin {
  id: number;
  slot: NewsBlockSlot;
  type: NewsBlockType;
  content: string | null;
  url: string | null;
  alt: string | null;
  image_url: string | null;
  orden: number;
}

export interface NewsBlockInput {
  id?: number;
  slot: NewsBlockSlot;
  type: NewsBlockType;
  content?: string | null;
  url?: string | null;
  alt?: string | null;
}

/** Sección tal como la administra el editor. `blocks_mode` false = formato anterior (contenidos content / content_left / content_right). */
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
  blocks_mode: boolean;
  blocks: NewsBlockAdmin[];
}

export interface NewsSectionInput {
  title: string | null;
  layout: 'one_column' | 'two_columns';
  visible: boolean;
  blocks: NewsBlockInput[];
}
