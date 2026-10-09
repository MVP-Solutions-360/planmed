export interface TestimonialVideo {
  /** Id del registro en Wellezy Hub (numérico, como texto). Los elementos nuevos del formulario llevan un id temporal no numérico. */
  id: string;
  title: string;
  url: string;
  /** false = oculto al público (el registro se conserva). Si no viene, se trata como visible. */
  active?: boolean;
}

export interface BeforeAfterCase {
  id: string;
  title: string;
  description: string;
  /** URL pública de la imagen, o data URL si se acaba de elegir una nueva en el formulario. */
  beforeImage: string;
  afterImage: string;
  /** false = oculto al público (el registro se conserva). Si no viene, se trata como publicado. */
  published?: boolean;
}

export interface ReferralProgram {
  title: string;
  content: string;
}

export interface InstagramPost {
  id: string;
  url: string;
  title?: string;
  active?: boolean;
}

// Activa/desactiva la publicación de cada vista pública.
export interface TestimonialsVisibility {
  videos: boolean;
  beforeAfter: boolean;
}

export interface TestimonialsContent {
  visibility: TestimonialsVisibility;
  videos: TestimonialVideo[];
  beforeAfter: BeforeAfterCase[];
  instagram: InstagramPost[];
  referral: ReferralProgram;
}
