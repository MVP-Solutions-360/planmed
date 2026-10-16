// Reglas de la tasa de interés mensual y de la cuota del simulador. Funciones PURAS (sin Nuxt ni red): las usan el servidor (validación),
// el administrador (formulario) y el simulador público, y se prueban con Node.
//
// La tasa se expresa como PORCENTAJE MENSUAL con hasta 4 decimales y PUNTO decimal ("2", "2.12", "2.0126"). Se guarda como texto
// canónico de 4 decimales ("2.1200") y se convierte a decimal desde enteros (diezmilésimas de punto porcentual), de modo que 2.12 es
// exactamente 0.0212 y 2.0126 es exactamente 0.020126, sin deriva de coma flotante ni redondeos intermedios.

/** Plazos ofrecidos por el simulador (meses). */
export const FINANCING_TERMS = [12, 18, 24, 36, 48, 60, 72] as const

/** Decimales admitidos en la tasa y factor entre «unidades» (diezmilésimas de %) y el porcentaje. */
export const FINANCING_RATE_DECIMALS = 4
const UNITS_PER_PERCENT = 10 ** FINANCING_RATE_DECIMALS

/**
 * Límites TÉCNICOS de la tasa mensual (%), definidos en un solo lugar: mayor que cero y hasta 5 %. Son una guarda contra errores de
 * digitación, no el tope legal de la usura (la tasa de usura la fija la autoridad y la persona administradora debe digitarla).
 */
export const FINANCING_RATE_MIN_PERCENT = 0.0001
export const FINANCING_RATE_MAX_PERCENT = 5
const MIN_UNITS = Math.round(FINANCING_RATE_MIN_PERCENT * UNITS_PER_PERCENT)
const MAX_UNITS = Math.round(FINANCING_RATE_MAX_PERCENT * UNITS_PER_PERCENT)

export const FINANCING_RATE_PLACEHOLDER = 'Ej. 2.0126 (usa punto decimal)'

export type FinancingRateParse =
  | { ok: true, text: string, units: number }
  | { ok: false, message: string }

const RATE_RE = /^(\d{1,2})(?:\.(\d{1,4}))?$/

/**
 * Valida una tasa digitada (texto o número). NO corrige ni reinterpreta: coma decimal, exponentes, signos, separadores de miles o más de
 * cuatro decimales se rechazan con un mensaje claro. Devuelve el texto canónico (siempre 4 decimales) y las unidades enteras.
 */
export function parseFinancingRate(input: unknown): FinancingRateParse {
  if (input === null || input === undefined) return { ok: false, message: 'La tasa es obligatoria.' }
  if (typeof input !== 'string' && typeof input !== 'number') return { ok: false, message: 'La tasa debe ser un número, por ejemplo 2.0126.' }
  if (typeof input === 'number' && !Number.isFinite(input)) return { ok: false, message: 'La tasa debe ser un número, por ejemplo 2.0126.' }
  const raw = String(input).trim()
  if (!raw) return { ok: false, message: 'La tasa es obligatoria.' }
  if (raw.includes(',')) return { ok: false, message: 'Usa punto como separador decimal, no coma (por ejemplo 2.0126).' }
  const m = RATE_RE.exec(raw)
  if (!m) {
    if (/^\d{1,2}\.\d{5,}$/.test(raw)) return { ok: false, message: 'La tasa admite máximo cuatro decimales (por ejemplo 2.0126).' }
    return { ok: false, message: 'Formato inválido. Escribe solo números con punto decimal, por ejemplo 2.0126.' }
  }
  const units = Number(m[1]) * UNITS_PER_PERCENT + Number((m[2] ?? '').padEnd(FINANCING_RATE_DECIMALS, '0'))
  if (units < MIN_UNITS || units > MAX_UNITS) {
    return { ok: false, message: `La tasa mensual debe ser mayor que 0 y no superar ${FINANCING_RATE_MAX_PERCENT} %.` }
  }
  return { ok: true, text: unitsToText(units), units }
}

function unitsToText(units: number): string {
  const int = Math.floor(units / UNITS_PER_PERCENT)
  const frac = String(units % UNITS_PER_PERCENT).padStart(FINANCING_RATE_DECIMALS, '0')
  return `${int}.${frac}`
}

/** Porcentaje mensual canónico ("2.0126") → decimal de la fórmula (0.020126). Lanza si el texto no es una tasa válida. */
export function financingRateToDecimal(text: string): number {
  const parsed = parseFinancingRate(text)
  if (!parsed.ok) throw new RangeError(`Tasa inválida: ${parsed.message}`)
  return parsed.units / (UNITS_PER_PERCENT * 100)
}

/**
 * Cuota fija amortizada: PMT = P·r·(1+r)^n / ((1+r)^n − 1), con r decimal mensual. Devuelve el valor exacto de la fórmula: NO se
 * redondea (el formato de pesos es solo de presentación). Con r = 0 la cuota es P/n.
 */
export function calculateMonthlyPayment(principal: number, months: number, monthlyRate: number): number {
  if (!Number.isFinite(principal) || principal <= 0) throw new RangeError('El monto a financiar debe ser mayor que cero.')
  if (!Number.isInteger(months) || months <= 0) throw new RangeError('El plazo debe ser un número entero de meses mayor que cero.')
  if (!Number.isFinite(monthlyRate) || monthlyRate < 0) throw new RangeError('La tasa mensual debe ser un decimal mayor o igual a cero.')
  if (monthlyRate === 0) return principal / months
  // (1+r)^n − 1 se calcula con expm1/log1p para no perder precisión con tasas muy pequeñas (el resultado equivale a la fórmula directa).
  const growth = months * Math.log1p(monthlyRate)
  return (principal * monthlyRate * Math.exp(growth)) / Math.expm1(growth)
}

export interface FinancingQuote {
  monthlyPayment: number
  /** Cuota × plazo, sin ningún incremento por redondeo. */
  totalAmount: number
  /** Tasa aplicada (% mensual, texto canónico de 4 decimales). */
  ratePercent: string
}

export function buildFinancingQuote(principal: number, months: number, ratePercent: string): FinancingQuote {
  const parsed = parseFinancingRate(ratePercent)
  if (!parsed.ok) throw new RangeError(`Tasa inválida: ${parsed.message}`)
  const monthlyPayment = calculateMonthlyPayment(principal, months, parsed.units / (UNITS_PER_PERCENT * 100))
  return { monthlyPayment, totalAmount: monthlyPayment * months, ratePercent: parsed.text }
}

/** Pesos colombianos para mostrar (solo presentación; no altera el valor numérico). Redondeo al peso más cercano, sin sesgo hacia arriba. */
export function formatPesos(value: number): string {
  if (!Number.isFinite(value)) return '$ 0'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}
