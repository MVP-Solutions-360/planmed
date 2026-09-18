export interface ProcedureFichaTecnica {
  tipo_anestesia?: string;
  tiempo_quirurgico?: string;
  tiempo_recuperacion?: string;
  cicatrizacion_minima?: boolean;
}

export interface ProcedurePerfilPaciente {
  edad_minima?: number;
  edad_maxima?: number;
  imc_maximo?: number;
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
  galeria_antes_despues?: ProcedureAntesDespues[];
  seo?: ProcedureSEO;
}
