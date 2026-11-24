// Formulario «Estudio de créditos» (Formulario de crédito paciente). Módulo PURO (sin imports): lo usan el formulario (validación en el navegador),
// la ruta de Nitro (validación OBLIGATORIA en el servidor) y las pruebas. Es la ÚNICA definición de pasos, campos, etiquetas y reglas.
//
// Los `id` son identificadores internos del formulario web; NO son los nombres de campo del CRM histórico (ver documentacion/CREDIT_STUDY_FORM_INTEGRATION.md).
// Las listas de opciones siguen siendo PROVISIONALES (por confirmar con la marca).

export type CreditFieldType = 'text' | 'number' | 'date' | 'tel' | 'email' | 'select' | 'file' | 'checkbox'
export interface Cond { field: string, in: string[] }

export interface CreditField {
  id: string
  label: string
  hint?: string
  type?: CreditFieldType
  /** Obligatorio siempre que el campo esté visible y habilitado. */
  required?: boolean
  /** Obligatorio solo si se cumple la condición. */
  requiredIf?: Cond
  /** Obligatorio solo si algún OTRO campo con este prefijo de `id` tiene valor (bloques opcionales: inmueble, vehículo). */
  requiredIfPrefix?: string
  options?: string[]
  inputmode?: 'text' | 'numeric' | 'decimal' | 'tel'
  span?: number
  start4?: boolean
  showIf?: Cond
  enabledIf?: Cond
  /** Campo calculado (total): no se envía, se recalcula. */
  sum?: string[]
  /** Las fechas son pasadas salvo que se indique `any`. */
  date?: 'past' | 'any'
}
export interface CreditBlock { title?: string, note?: string, grid: 'lg' | 'sm', fields: CreditField[], full?: boolean }
export interface CreditStep { key: string, label: string, split?: boolean, blocks: CreditBlock[] }

const f = (id: string, label: string, extra: Partial<CreditField> = {}): CreditField => ({ id, label, ...extra })
const r = (id: string, label: string, extra: Partial<CreditField> = {}): CreditField => ({ id, label, required: true, ...extra })

export const TIPOS_DOC = ['Cédula de ciudadanía', 'Cédula de extranjería', 'Pasaporte', 'Permiso por protección temporal']
export const TIPOS_ACTIVIDAD = ['Empleado', 'Independiente', 'Otro']
const SI_NO = ['Sí', 'No']
const CONYUGE_ON: Cond = { field: 'estado-civil', in: ['Casado(a)', 'Unión libre'] }
const ARRENDADA: Cond = { field: 'tipo-vivienda', in: ['Arrendada'] }

// Archivos que se piden según el tipo de actividad económica (paso 3), alineados a la 4.ª columna como en la referencia.
const archivo = (cond: string[], id: string, label: string): CreditField => ({ id, label, type: 'file', required: true, start4: true, span: 3, showIf: { field: 'tipo-actividad', in: cond } })

const referencia = (p: string, n: number): CreditField[] => [
  f(`${p}-${n}-nombre`, 'Nombres y apellidos', { span: 12 }),
  f(`${p}-${n}-parentesco`, 'Parentesco', { span: 6 }),
  f(`${p}-${n}-tel-residencia`, 'Teléfono de residencia', { type: 'tel', inputmode: 'tel', span: 6 }),
  f(`${p}-${n}-tel-oficina`, 'Teléfono de oficina', { type: 'tel', inputmode: 'tel', span: 6 }),
  f(`${p}-${n}-celular`, 'Celular', { type: 'tel', inputmode: 'tel', span: 6 })
]

const beneficiarios: CreditField[] = [1, 2, 3, 4].flatMap(n => [
  f(`ben-${n}-tipo`, `${n} - Tipo de documento`, { type: 'select', options: TIPOS_DOC, span: 3 }),
  f(`ben-${n}-doc`, 'Documento', { span: 3 }),
  f(`ben-${n}-nombre`, 'Nombre y apellido', { span: 3 }),
  f(`ben-${n}-pct`, '%', { type: 'number', inputmode: 'decimal', span: 1 }),
  f(`ben-${n}-parentesco`, 'Parentesco', { span: 2 })
])

export const PROCEDIMIENTOS = ['Mamoplastia de aumento', 'Mastopexia', 'Mentoplastia', 'Ritidoplastia', 'Mamoplastia de reducción', 'Lipomoldeamiento', 'Blefaroplastia', 'Rinoplastia', 'Implantes glúteos', 'Abdominoplastia', 'Otoplastia', 'Otro']

export const ING = ['ing-salario', 'ing-comisiones', 'ing-arrendamientos', 'ing-otros']
export const EGR = ['egr-vivienda', 'egr-vehiculo', 'egr-tarjeta', 'egr-arriendo', 'egr-gastos']
const money = (id: string, label: string): CreditField => ({ id, label, type: 'number', inputmode: 'numeric', span: 6 })

export const CREDIT_STEPS: CreditStep[] = [
  {
    key: 'personal',
    label: 'Información personal',
    blocks: [{
      grid: 'lg',
      fields: [
        r('primer-nombre', 'Primer nombre'),
        f('segundo-nombre', 'Segundo nombre'),
        r('primer-apellido', 'Primer apellido'),
        f('segundo-apellido', 'Segundo apellido'),
        r('tipo-documento', 'Tipo de documento', { type: 'select', options: TIPOS_DOC }),
        r('numero-documento', 'N° documento de identidad', { inputmode: 'numeric' }),
        r('lugar-expedicion', 'Lugar de expedición'),
        r('fecha-expedicion', 'Fecha de expedición', { type: 'date' }),
        r('fecha-nacimiento', 'Fecha de nacimiento', { type: 'date' }),
        r('lugar-nacimiento', 'Lugar de nacimiento'),
        r('sexo', 'Sexo', { type: 'select', options: ['Femenino', 'Masculino'] }),
        r('estado-civil', 'Estado civil', { type: 'select', options: ['Soltero(a)', 'Casado(a)', 'Unión libre', 'Separado(a)', 'Divorciado(a)', 'Viudo(a)'] }),
        r('nivel-educativo', 'Nivel educativo', { type: 'select', options: ['Primaria', 'Bachillerato', 'Técnico', 'Tecnólogo', 'Profesional', 'Posgrado'] }),
        r('profesion', 'Profesión / ocupación'),
        r('personas-a-cargo', 'N° de personas a cargo', { type: 'number', inputmode: 'numeric' }),
        r('numero-hijos', 'N° de hijos', { type: 'number', inputmode: 'numeric' }),
        r('tipo-vivienda', 'Tipo de vivienda', { type: 'select', options: ['Propia', 'Arrendada', 'Familiar'] }),
        // El arrendador solo existe si la vivienda es arrendada (antes se exigía siempre, incluso con vivienda propia).
        f('nombre-arrendador', 'Nombre del arrendador', { requiredIf: ARRENDADA }),
        f('telefono-arrendador', 'Teléfono del arrendador', { type: 'tel', inputmode: 'tel', requiredIf: ARRENDADA }),
        r('peso', 'Peso (kg)', { type: 'number', inputmode: 'decimal', span: 2 }),
        r('estatura', 'Estatura (cm)', { type: 'number', inputmode: 'decimal', span: 1 })
      ]
    }]
  },
  {
    key: 'conyuge',
    label: 'Información del cónyuge',
    blocks: [{
      grid: 'lg',
      fields: [
        r('cy-primer-nombre', 'Primer nombre', { enabledIf: CONYUGE_ON }),
        r('cy-segundo-nombre', 'Segundo nombre', { enabledIf: CONYUGE_ON }),
        r('cy-primer-apellido', 'Primer apellido', { enabledIf: CONYUGE_ON }),
        r('cy-segundo-apellido', 'Segundo apellido', { enabledIf: CONYUGE_ON }),
        r('cy-tipo-documento', 'Tipo de documento', { type: 'select', options: TIPOS_DOC, enabledIf: CONYUGE_ON }),
        r('cy-numero-documento', 'N° documento de identidad', { inputmode: 'numeric', enabledIf: CONYUGE_ON }),
        r('cy-tipo-actividad', 'Tipo de actividad', { type: 'select', options: TIPOS_ACTIVIDAD, enabledIf: CONYUGE_ON }),
        r('cy-celular', 'Celular', { type: 'tel', inputmode: 'tel', enabledIf: CONYUGE_ON }),
        r('cy-empresa', 'Empresa donde labora', { enabledIf: CONYUGE_ON }),
        r('cy-cargo', 'Cargo', { enabledIf: CONYUGE_ON }),
        r('cy-ingresos', 'Ingresos mensuales', { type: 'number', inputmode: 'numeric', enabledIf: CONYUGE_ON })
      ]
    }]
  },
  {
    key: 'actividad',
    label: 'Actividad económica y localización cliente',
    blocks: [{
      grid: 'lg',
      fields: [
        r('dir-residencia', 'Dirección de residencia', { hint: 'especifique N° casa o apartamento', span: 6 }),
        r('barrio-residencia', 'Barrio / ciudad', { span: 6 }),
        r('tel-residencia', 'Teléfono residencia', { type: 'tel', inputmode: 'tel' }),
        r('celular', 'Celular', { type: 'tel', inputmode: 'tel' }),
        r('email', 'E-mail', { type: 'email' }),
        r('envio-correspondencia', 'Envío de correspondencia', { type: 'select', options: ['Residencia', 'Trabajo', 'Correo electrónico'] }),
        r('dir-correspondencia', 'Dirección', { hint: 'correspondencia' }),
        r('barrio-correspondencia', 'Barrio / ciudad', { hint: 'correspondencia' }),
        f('tel-correspondencia', 'Teléfono', { hint: 'correspondencia', type: 'tel', inputmode: 'tel' }),
        r('tipo-actividad', 'Tipo de actividad económica', { type: 'select', options: TIPOS_ACTIVIDAD }),
        archivo(['Empleado'], 'archivo-carta-laboral', 'Carta laboral'),
        archivo(['Empleado'], 'archivo-colillas', 'Colillas de pago'),
        archivo(['Independiente'], 'archivo-rut', 'RUT'),
        archivo(['', 'Empleado', 'Independiente', 'Otro'], 'archivo-extractos', 'Extractos bancarios'),
        f('otra-actividad', '¿Cuál?', { hint: 'otra actividad económica' }),
        f('empresa', 'Nombre de la empresa'),
        f('dir-trabajo', 'Dirección trabajo'),
        r('barrio-trabajo', 'Barrio / ciudad'),
        f('tel-trabajo', 'Teléfono', { hint: 'trabajo', type: 'tel', inputmode: 'tel', span: 2 }),
        f('ext-trabajo', 'Ext', { span: 2 }),
        f('fax-trabajo', 'Fax', { span: 2 }),
        f('dependencia', 'Dependencia / área'),
        f('cargo', 'Cargo'),
        r('tipo-contrato', 'Tipo de contrato', { type: 'select', options: ['Indefinido', 'Fijo', 'Prestación de servicios', 'Otro'] }),
        f('fecha-vinculacion', 'Fecha de vinculación', { type: 'date' })
      ]
    }]
  },
  {
    key: 'referencias',
    label: 'Referencias',
    split: true,
    blocks: [
      { title: 'Familiar (que no viva con usted)', grid: 'sm', fields: [...referencia('fam', 1), ...referencia('fam', 2)] },
      { title: 'Personal (que no viva con usted)', grid: 'sm', fields: [...referencia('per', 1), ...referencia('per', 2)] },
      { grid: 'lg', full: true, fields: [f('reportado', '¿Está reportado?', { type: 'select', options: SI_NO })] },
      { title: 'Beneficiarios voluntarios (póliza Sura)', grid: 'lg', full: true, fields: beneficiarios }
    ]
  },
  {
    key: 'ingresos',
    label: 'Relación de ingresos y egresos',
    split: true,
    blocks: [
      {
        title: 'Ingresos mensuales',
        grid: 'sm',
        fields: [
          money('ing-salario', '1. Salario básico y/o honorarios'), money('ing-comisiones', '2. Comisiones'),
          money('ing-arrendamientos', '3. Arrendamientos'), money('ing-otros', '4. Otros'),
          f('ing-cuales', '¿Cuáles?', { span: 12 }),
          { id: 'ing-total', label: 'Total ingresos', span: 12, sum: ING }
        ]
      },
      {
        title: 'Egresos mensuales',
        grid: 'sm',
        fields: [
          money('egr-vivienda', '1. Préstamo vivienda'), money('egr-vehiculo', '2. Préstamo vehículo u otros'),
          money('egr-tarjeta', '3. Tarjeta de crédito'), money('egr-arriendo', '4. Arriendo'),
          money('egr-gastos', '5. Gastos familiares y/o otros'),
          { id: 'egr-total', label: 'Total', span: 12, sum: EGR }
        ]
      },
      {
        title: 'Información del crédito solicitado',
        note: 'Procedimiento que se realiza (puede seleccionar más de uno)',
        grid: 'lg',
        full: true,
        fields: [
          ...PROCEDIMIENTOS.map((p): CreditField => ({ id: `proc-${p}`, label: p, type: 'checkbox' })),
          f('valor-cotizado', 'Valor cotizado', { type: 'number', inputmode: 'numeric' }),
          f('numero-cuotas', 'N° de cuotas', { type: 'number', inputmode: 'numeric' }),
          f('valor-financiar', 'Valor a financiar', { type: 'number', inputmode: 'numeric' }),
          f('fecha-cirugia', 'Fecha cirugía', { type: 'date', date: 'any' })
        ]
      }
    ]
  },
  {
    key: 'activos',
    label: 'Relación de activos',
    split: true,
    blocks: [
      {
        title: 'Bienes raíces',
        grid: 'sm',
        // Inmueble y vehículo son opcionales como bloque: si se diligencia algún dato del bloque, el tipo (y la afectación) pasan a ser obligatorios.
        fields: [
          f('br-tipo', 'Tipo de inmueble', { type: 'select', options: ['Apartamento', 'Casa', 'Lote', 'Local', 'Otro'], span: 6, requiredIfPrefix: 'br-' }),
          f('br-direccion', 'Dirección del bien', { span: 6 }),
          f('br-barrio', 'Barrio', { span: 6 }),
          f('br-ciudad', 'Ciudad', { span: 6 }),
          f('br-valor', 'Valor comercial', { type: 'number', inputmode: 'numeric', span: 6 }),
          f('br-hipoteca', 'Hipoteca a favor de', { span: 6 }),
          f('br-afectacion', 'Afectación familiar', { type: 'select', options: SI_NO, span: 6, requiredIfPrefix: 'br-' })
        ]
      },
      {
        title: 'Vehículo',
        grid: 'sm',
        fields: [
          f('ve-tipo', 'Tipo', { type: 'select', options: ['Automóvil', 'Camioneta', 'Motocicleta', 'Otro'], span: 6, requiredIfPrefix: 've-' }),
          f('ve-placa', 'Placa', { span: 6 }),
          f('ve-transito', 'Tránsito de', { span: 6 }),
          f('ve-marca', 'Marca', { span: 6 }),
          f('ve-modelo', 'Modelo', { span: 4 }),
          f('ve-valor', 'Valor comercial', { type: 'number', inputmode: 'numeric', span: 4 }),
          f('ve-prenda', 'Prenda a valor de', { type: 'number', inputmode: 'numeric', span: 4 }),
          f('ve-otro', 'Otro: ¿cuáles?', { span: 12 })
        ]
      }
    ]
  }
]

export const CREDIT_FIELDS: CreditField[] = CREDIT_STEPS.flatMap(s => s.blocks.flatMap(b => b.fields))
export const CREDIT_FILE_IDS: string[] = CREDIT_FIELDS.filter(x => x.type === 'file').map(x => x.id)
/** Campos que llegan como texto o casilla (no archivos ni totales calculados). */
export const CREDIT_INPUT_IDS: string[] = CREDIT_FIELDS.filter(x => x.type !== 'file' && !x.sum).map(x => x.id)

/** Límites de los documentos. Son por documento y por solicitud (el total protege el tope de ~25 MB de los buzones, que cuentan el tamaño codificado). */
export const CREDIT_LIMITS = {
  maxFileBytes: 5 * 1024 * 1024,
  maxTotalFileBytes: 15 * 1024 * 1024,
  /** Tope de la petición completa (documentos + campos de texto). */
  maxRequestBytes: 16 * 1024 * 1024,
  maxTextLength: 200,
  maxTextPartBytes: 2000,
  maxParts: 300
} as const

export type CreditFileKind = 'pdf' | 'png' | 'jpeg'
export const CREDIT_FILE_KINDS: Record<CreditFileKind, { mime: string, ext: string }> = {
  pdf: { mime: 'application/pdf', ext: 'pdf' },
  png: { mime: 'image/png', ext: 'png' },
  jpeg: { mime: 'image/jpeg', ext: 'jpg' }
}
export const CREDIT_ACCEPT = '.pdf,image/png,image/jpeg'

/** Tipo REAL del archivo por sus primeros bytes (firma), no por el nombre ni por el tipo que declara el navegador. `null` = no permitido. */
export function detectFileKind(bytes: Uint8Array): CreditFileKind | null {
  const at = (i: number) => bytes[i]
  if (bytes.length >= 5 && at(0) === 0x25 && at(1) === 0x50 && at(2) === 0x44 && at(3) === 0x46 && at(4) === 0x2d) return 'pdf'
  if (bytes.length >= 8 && at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4e && at(3) === 0x47 && at(4) === 0x0d && at(5) === 0x0a && at(6) === 0x1a && at(7) === 0x0a) return 'png'
  if (bytes.length >= 3 && at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return 'jpeg'
  return null
}

export type CreditValues = Record<string, string | boolean>
export interface CreditFileMeta { size: number }

const meets = (c: Cond | undefined, v: CreditValues) => !c || c.in.includes(String(v[c.field] ?? ''))
export const isVisible = (fd: CreditField, v: CreditValues) => meets(fd.showIf, v)
export const isEnabled = (fd: CreditField, v: CreditValues) => !fd.enabledIf || meets(fd.enabledIf, v)
const filled = (x: unknown) => typeof x === 'string' ? x.trim() !== '' : x === true

/** ¿Debe diligenciarse ahora este campo? (visible, habilitado y obligatorio por regla fija o condicional). */
export function isRequired(fd: CreditField, v: CreditValues): boolean {
  if (fd.sum || fd.type === 'checkbox' || !isVisible(fd, v) || !isEnabled(fd, v)) return false
  if (fd.requiredIf) return meets(fd.requiredIf, v)
  if (fd.requiredIfPrefix) return CREDIT_FIELDS.some(o => o.id !== fd.id && o.id.startsWith(fd.requiredIfPrefix!) && o.type !== 'file' && filled(v[o.id]))
  return fd.required === true
}

/** Suma de campos numéricos (totales de ingresos y egresos). */
export const sumFields = (v: CreditValues, ids: string[]) => ids.reduce((s, id) => s + (Number(v[id]) || 0), 0)

// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u001f\u007f]/g

/**
 * Normaliza lo recibido: solo los campos conocidos, texto sin caracteres de control y recortado, casillas como booleano.
 * Los campos ocultos o deshabilitados por las condiciones del formulario se vacían (no se envían ni se aceptan).
 */
export function normalizeCreditValues(raw: unknown): CreditValues {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const values: CreditValues = {}
  for (const fd of CREDIT_FIELDS) {
    if (fd.type === 'file' || fd.sum) continue
    const x = src[fd.id]
    if (fd.type === 'checkbox') values[fd.id] = x === true || x === 'true' || x === 'on' || x === '1'
    else values[fd.id] = typeof x === 'string' ? x.replace(CONTROL_RE, ' ').trim() : typeof x === 'number' && Number.isFinite(x) ? String(x) : ''
  }
  for (const fd of CREDIT_FIELDS) {
    if (fd.type === 'file' || fd.sum) continue
    if (!isVisible(fd, values) || !isEnabled(fd, values)) values[fd.id] = fd.type === 'checkbox' ? false : ''
  }
  return values
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const NUMBER_RE = /^\d{1,15}(\.\d{1,4})?$/
const REQUIRED = 'Este campo es obligatorio.'

function dateProblem(value: string, rule: 'past' | 'any', today: Date): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const d = m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null
  const real = !!m && !!d && d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3])
  if (!real || Number(m![1]) < 1900) return 'Ingresa una fecha válida.'
  if (rule === 'past' && d!.getTime() > Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) return 'La fecha no puede ser futura.'
  if (rule === 'any' && Number(m![1]) > today.getUTCFullYear() + 5) return 'Ingresa una fecha válida.'
  return null
}

/**
 * Valida valores ya normalizados y metadatos de los documentos (`files[id]` = tamaño, o ausente). Devuelve un mensaje por `id` inválido
 * (vacío = válido). La clave especial `archivos` agrupa el error del tamaño total. `today` se inyecta para poder probarlo.
 */
export function validateCreditStudy(values: CreditValues, files: Record<string, CreditFileMeta | null | undefined>, today: Date = new Date()): Record<string, string> {
  const e: Record<string, string> = {}
  let total = 0

  for (const fd of CREDIT_FIELDS) {
    if (fd.sum || !isVisible(fd, values) || !isEnabled(fd, values)) continue

    if (fd.type === 'file') {
      const meta = files[fd.id]
      if (!meta) { if (isRequired(fd, values)) e[fd.id] = `Adjunta ${fd.label.toLowerCase()}.`; continue }
      if (!(meta.size > 0)) e[fd.id] = 'El archivo está vacío.'
      else if (meta.size > CREDIT_LIMITS.maxFileBytes) e[fd.id] = `El archivo supera ${CREDIT_LIMITS.maxFileBytes / 1024 / 1024} MB.`
      else total += meta.size
      continue
    }
    if (fd.type === 'checkbox') continue

    const v = String(values[fd.id] ?? '')
    if (!v) { if (isRequired(fd, values)) e[fd.id] = REQUIRED; continue }
    if (v.length > CREDIT_LIMITS.maxTextLength) { e[fd.id] = `Máximo ${CREDIT_LIMITS.maxTextLength} caracteres.`; continue }

    if (fd.type === 'select') { if (!fd.options?.includes(v)) e[fd.id] = 'Selecciona una opción de la lista.' }
    else if (fd.type === 'email') { if (!EMAIL_RE.test(v)) e[fd.id] = 'Ingresa un correo válido.' }
    else if (fd.type === 'tel') {
      const digits = v.replace(/\D/g, '')
      if (digits.length < 7 || digits.length > 15 || !/^[+\d\s()-]+$/.test(v)) e[fd.id] = 'Ingresa un número de teléfono válido.'
    } else if (fd.type === 'number') { if (!NUMBER_RE.test(v)) e[fd.id] = 'Ingresa un número válido (sin signos ni separadores).' }
    else if (fd.type === 'date') { const p = dateProblem(v, fd.date ?? 'past', today); if (p) e[fd.id] = p }
  }

  if (total > CREDIT_LIMITS.maxTotalFileBytes) e.archivos = `Los documentos superan ${CREDIT_LIMITS.maxTotalFileBytes / 1024 / 1024} MB en total.`
  return e
}
