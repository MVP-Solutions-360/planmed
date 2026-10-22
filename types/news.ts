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
import type { AdminBlock, BlockInput, BlockSlot, BlockType, ColumnLayout, PublicBlock, PublicBlocks } from '../shared/utils/contentBlocks';

/** Bloques de contenido apilables por columna (ver shared/utils/contentBlocks.ts). */
export type NewsBlock = PublicBlock;
export type NewsSectionBlocks = PublicBlocks;

/** Sección de contenido de una noticia (contrato público de Hub). Solo trae los bloques de su distribución activa. */
export interface NewsSection {
  orden: number;
  title: string | null;
  layout: ColumnLayout;
  blocks: NewsSectionBlocks;
}

export type NewsBlockType = BlockType;
export type NewsBlockSlot = BlockSlot;
export type NewsBlockAdmin = AdminBlock;
export type NewsBlockInput = BlockInput;

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
