// Tipos de documento admitidos al crear un colaborador. Mismos valores que el formulario de Recursos Humanos de Wellezy Hub
// (human-resource/personnel/create-personnel): CC, CE y PP. Lo usan la lista del formulario y la validación del servidor.
export const LINE_USER_DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PP', label: 'Pasaporte' }
] as const

export const LINE_USER_DOCUMENT_TYPE_VALUES: string[] = LINE_USER_DOCUMENT_TYPES.map(t => t.value)
