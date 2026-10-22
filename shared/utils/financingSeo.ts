// SEO de la página «Financiación de cirugías plásticas». Módulo PURO (sin imports): lo usan la página y las pruebas.
//
// Solo se declara lo que la página YA muestra: su título, su descripción y sus preguntas frecuentes visibles. No se incluyen tasas, plazos,
// condiciones, teléfonos, direcciones ni valoraciones: nada que no esté respaldado por el contenido existente.

export const FINANCING_TITLE = 'Financiación de cirugías plásticas'
export const FINANCING_SEO_TITLE = `${FINANCING_TITLE} | Planmed`
export const FINANCING_DESCRIPTION = 'Así funciona la financiación de cirugías plásticas con Planmed: asesoría, estudio, pre aprobación y desembolso, documentos requeridos y simulador de cuota.'
export const FINANCING_SUBTITLE = 'Conoce cómo financiar tu cirugía plástica con Planmed y encuentra el plan que se adapta a ti.'
export const FINANCING_PATH = '/financiacion'

const plain = (v: unknown) => (typeof v === 'string' ? v.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '')

/** Datos estructurados (WebPage + FAQPage con las preguntas visibles) serializados de forma segura para un <script type="application/ld+json">. */
export function financingStructuredData(origin: string, faqs: Array<{ question: string, answer: string }>): string {
  const base = origin.replace(/\/+$/, '')
  const url = `${base}${FINANCING_PATH}`
  const questions = faqs
    .map(f => ({ q: plain(f.question), a: plain(f.answer) }))
    .filter(f => f.q && f.a)
    .map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))

  const graph: Record<string, unknown>[] = [
    { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: FINANCING_SEO_TITLE, description: FINANCING_DESCRIPTION, inLanguage: 'es-CO', isPartOf: { '@type': 'WebSite', url: `${base}/`, name: 'Planmed' } }
  ]
  if (questions.length) graph.push({ '@type': 'FAQPage', '@id': `${url}#faq`, url, mainEntity: questions })

  // `<` se escapa para que ningún texto pueda cerrar la etiqueta <script>.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')
}
