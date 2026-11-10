// Paginación de listados públicos (puro, sin imports: lo usan las páginas, el servidor y las pruebas).

/** Número de página válido (entero >= 1) a partir de un valor de la URL; cualquier otro valor da 1. */
export function parsePage(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value
  const n = Number.parseInt(String(raw ?? ''), 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

/**
 * Páginas a mostrar en el paginador: siempre la primera, la última y las vecinas de la actual; los huecos se marcan con 'gap'.
 * Ej.: current 6 de 12 -> [1, 'gap', 5, 6, 7, 'gap', 12]
 */
export function pageWindow(current: number, last: number, siblings = 1): Array<number | 'gap'> {
  if (last <= 1) return [1]
  const keep = new Set<number>([1, last])
  for (let p = current - siblings; p <= current + siblings; p++) if (p >= 1 && p <= last) keep.add(p)
  const sorted = [...keep].sort((a, b) => a - b)
  const out: Array<number | 'gap'> = []
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1]
    if (i > 0 && prev !== undefined) {
      if (p - prev === 2) out.push(prev + 1)
      else if (p - prev > 2) out.push('gap')
    }
    out.push(p)
  })
  return out
}
