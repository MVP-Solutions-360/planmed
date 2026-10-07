// Micrositio de un PRP (referidor). La fuente de persistencia es Wellezy Hub; el código externo
// (`externalCode`) es el del CRM médico y se envía como `code_prp` al formulario público.
export interface Prp {
  id: number;
  name: string;
  externalCode: string;
  slug: string;
  title: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

// No incluye empresa ni línea: Hub las deriva del contexto del token.
export interface PrpInput {
  name: string;
  externalCode: string;
  // Si se omite al crear, Hub genera el slug a partir del nombre.
  slug?: string;
  title?: string | null;
  isActive?: boolean;
}

export interface PrpListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  perPage?: number;
}

export interface PrpPage {
  items: Prp[];
  currentPage: number;
  lastPage: number;
  total: number;
}

// Errores de validación por campo, con los nombres de campo de PrpInput.
export type PrpFieldErrors = Partial<Record<keyof PrpInput, string>>;

export class PrpError extends Error {
  statusCode?: number;
  fieldErrors: PrpFieldErrors;

  constructor(message: string, statusCode?: number, fieldErrors: PrpFieldErrors = {}) {
    super(message);
    this.name = 'PrpError';
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}
