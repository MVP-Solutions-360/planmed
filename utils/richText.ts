import sanitizeHtml from 'sanitize-html'

// Subconjunto de HTML que produce el editor del CMS. Todo lo demás (script, iframe, style, eventos inline,
// javascript:, etc.) se elimina. Funciona igual en servidor (SSR) y navegador: no depende del DOM.
const RICH_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  // Párrafos vacíos (p. ej. nodo final del editor) no son formato legítimo.
  exclusiveFilter: frame => frame.tag === 'p' && !frame.text.trim(),
  transformTags: {
    b: 'strong',
    i: 'em',
    h1: 'h2',
    h4: 'h3',
    h5: 'h3',
    h6: 'h3',
    div: 'p',
    a: (tagName, attribs) => {
      const out: Record<string, string> = { rel: 'noopener noreferrer nofollow' }
      if (attribs.href) out.href = attribs.href
      if (attribs.target === '_blank') out.target = '_blank'
      return { tagName, attribs: out }
    }
  }
}

const HAS_TAGS = /<\/?[a-z][\s\S]*>/i

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Sanitiza HTML enriquecido. Si el valor es texto plano heredado (sin etiquetas), lo convierte a párrafos. */
export function sanitizeRichHtml(value: string | null | undefined): string {
  const raw = (value ?? '').trim()
  if (!raw) return ''
  if (!HAS_TAGS.test(raw)) {
    return raw
      .split(/\n{2,}/)
      .map(block => `<p>${escapeHtml(block.trim()).replace(/\n/g, '<br>')}</p>`)
      .join('')
  }
  return sanitizeHtml(raw, RICH_OPTIONS)
}

/** Texto plano (sin etiquetas) para listados y meta descriptions. */
export function richHtmlToText(value: string | null | undefined): string {
  const text = sanitizeHtml(value ?? '', { allowedTags: [], allowedAttributes: {} })
  return text
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

/** ¿El HTML del editor no tiene contenido real? (p. ej. "<p></p>") */
export function isRichHtmlEmpty(value: string | null | undefined): boolean {
  return richHtmlToText(value) === ''
}

/** Slug URL-safe a partir de un texto: "Mamoplastia de Aumento" -> "mamoplastia-de-aumento". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
