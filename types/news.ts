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
}