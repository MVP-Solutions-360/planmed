export interface ProcedureFichaTecnica {
  tipo_anestesia?: string;
  tiempo_quirurgico?: string;
  tiempo_recuperacion?: string;
  cicatrizacion_minima?: boolean;
}

export interface ProcedurePerfilPaciente {
  edad_minima?: number | null;
  edad_maxima?: number | null;
  imc_maximo?: number | null;
  condiciones_medicas_compatibles?: string;
}

export interface ProcedureSEO {
  meta_title?: string;
  meta_description?: string;
}

export interface ProcedureImage {
  url: string;
}

export interface ProcedureAntesDespues {
  imagenes: {
    antes?: string;
    despues?: string;
  };
}

export interface Procedure {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  whatIsIt: string;
  image: string;
  secondaryImage?: string;
  galeria?: Array<string | ProcedureImage>;
  destacado?: boolean;
  ficha_tecnica?: ProcedureFichaTecnica;
  perfil_paciente?: ProcedurePerfilPaciente;
  recomendaciones_post?: string;
  recomendaciones_revision?: string;
  galeria_antes_despues?: ProcedureAntesDespues[];
  seo?: ProcedureSEO;
  // Solo administración (Wellezy Hub es la fuente de verdad; el público solo ve los activos).
  /** Procedimiento activo y visible en la web (propio: su estado; maestro: habilitado en la línea). */
  activo?: boolean;
  /** Maestro del Hub: contenido global, no editable desde Planmed (solo habilitar/deshabilitar/destacar). */
  isMaster?: boolean;
  editable?: boolean;
  galeriaAssets?: Array<{ id: number; url: string }>;
  /** Nuevas imágenes de galería (data URL) y ids de imágenes a eliminar; solo se envían al guardar. */
  galleryUploads?: string[];
  galleryRemovals?: number[];
}
