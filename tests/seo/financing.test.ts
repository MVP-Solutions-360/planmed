// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// SEO de «Financiación de cirugías plásticas»: metadatos, datos estructurados (solo lo visible), canonical, sitemap y robots.txt.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from '../recommendations/harness.ts'
import { FINANCING_DESCRIPTION, FINANCING_SEO_TITLE, FINANCING_SUBTITLE, FINANCING_TITLE, financingStructuredData } from '../../shared/utils/financingSeo.ts'

const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const FAQS = [{ question: '¿Debo dar cuota inicial?', answer: 'Todo depende del porcentaje final que se te apruebe.' }, { question: '', answer: 'sin pregunta' }, { question: '<b>¿Pregunta?</b>', answer: '<p>Respuesta</p></script><script>alert(1)</script>' }]

describe('metadatos', () => {
  test('la frase objetivo aparece de forma natural en título SEO, H1, descripción y subtítulo, sin repeticiones artificiales', () => {
    assert.equal(FINANCING_TITLE, 'Financiación de cirugías plásticas')
    assert.equal(FINANCING_SEO_TITLE, 'Financiación de cirugías plásticas | Planmed')
    assert.ok(FINANCING_DESCRIPTION.toLowerCase().includes('financiación de cirugías plásticas'))
    assert.ok(FINANCING_DESCRIPTION.length <= 170, `descripción de ${FINANCING_DESCRIPTION.length} caracteres`)
    assert.ok(FINANCING_SEO_TITLE.length <= 60)
    for (const text of [FINANCING_DESCRIPTION, FINANCING_SUBTITLE]) assert.ok((text.toLowerCase().match(/cirugías? plásticas?/g) || []).length <= 1)
  })

  test('no promete ni afirma lo que el contenido no respalda (tasas, plazos, aprobación garantizada, contacto, Google Maps)', () => {
    const all = [FINANCING_DESCRIPTION, FINANCING_SUBTITLE, FINANCING_TITLE].join(' ')
    assert.equal(/\d+\s?%|tasa|interés|sin intereses|garantiz|aprobaci[oó]n (segura|inmediata)|el mejor|#1|maps|\+57|tel[eé]fono/i.test(all), false)
  })

  test('la página usa los metadatos, canonical con el origen del sitio, og:url y los datos estructurados', () => {
    const page = read('pages/financiacion.vue')
    assert.match(page, /:title="FINANCING_TITLE"/)
    assert.match(page, /title: FINANCING_SEO_TITLE/)
    assert.match(page, /description: FINANCING_DESCRIPTION/)
    assert.match(page, /rel: 'canonical', href: canonical/)
    assert.match(page, /useSiteConfig\(\)\.url/)
    assert.match(page, /ogUrl: canonical/)
    assert.match(page, /application\/ld\+json/)
    assert.equal(/robots/.test(page), false, 'la página es indexable')
    assert.equal(/v-html/.test(page), false)
  })
})

describe('datos estructurados', () => {
  test('WebPage + FAQPage solo con las preguntas visibles (sin HTML) y con la URL canónica', () => {
    const json = JSON.parse(financingStructuredData('https://planmed.com.co/', FAQS))
    const [web, faq] = json['@graph']
    assert.equal(json['@context'], 'https://schema.org')
    assert.equal(web['@type'], 'WebPage')
    assert.equal(web.url, 'https://planmed.com.co/financiacion')
    assert.equal(faq['@type'], 'FAQPage')
    assert.deepEqual(faq.mainEntity.map(q => q.name), ['¿Debo dar cuota inicial?', '¿Pregunta?'])
    assert.equal(faq.mainEntity[1].acceptedAnswer.text.includes('<'), false)
  })

  test('sin preguntas no hay FAQPage; ningún texto puede cerrar la etiqueta <script>', () => {
    assert.equal(JSON.parse(financingStructuredData('https://planmed.com.co', []))['@graph'].length, 1)
    assert.equal(financingStructuredData('https://planmed.com.co', FAQS).includes('</script'), false)
  })

  test('no incluye datos de contacto, tasas, valoraciones ni ficha de empresa', () => {
    const raw = financingStructuredData('https://planmed.com.co', FAQS)
    assert.equal(/telephone|address|aggregateRating|priceRange|LocalBusiness|geo|sameAs/i.test(raw), false)
  })
})

describe('indexabilidad: sitemap y robots.txt', () => {
  test('robots.txt permite el sitio público, bloquea solo la API y apunta al sitemap sin chocar con el noindex del panel', () => {
    assert.ok(existsSync(join(ROOT, 'public/robots.txt')))
    const robots = read('public/robots.txt')
    assert.match(robots, /User-agent: \*/)
    // El panel NO se bloquea aquí: se excluye del sitemap y responde noindex (un Disallow impediría que el buscador vea ese encabezado).
    assert.equal(/Disallow:\s*\/admin/.test(robots), false)
    assert.match(robots, /Disallow: \/api\//)
    assert.match(robots, /^Sitemap: https:\/\/planmed\.com\.co\/sitemap\.xml$/m)
    assert.equal(/Disallow:\s*\/\s*$/m.test(robots), false, 'no bloquea todo el sitio')
    assert.equal(/Disallow:.*financiacion/.test(robots), false)
  })

  test('el sitemap excluye el panel y el panel responde noindex; /financiacion no está excluida ni redirigida', () => {
    const cfg = read('nuxt.config.ts')
    assert.match(cfg, /exclude: \['\/admin', '\/admin\/\*\*'\]/)
    assert.match(cfg, /'\/admin\/\*\*': \{ headers: \{ 'X-Robots-Tag': 'noindex, nofollow' \} \}/)
    assert.equal(/'\/financiacion'\s*:\s*\{[^}]*(redirect|robots)/.test(cfg), false)
  })

  test('la ruta antigua /simulador sigue redirigiendo con 301 a /financiacion', () => {
    assert.match(read('nuxt.config.ts'), /'\/simulador': \{ redirect: \{ to: '\/financiacion', statusCode: 301 \} \}/)
  })
})

describe('dominio canónico único (https://planmed.com.co)', () => {
  const DOMAIN = 'https://planmed.com.co'

  test('site.url de la configuración es el dominio confirmado y robots.txt apunta a su sitemap', () => {
    assert.match(read('nuxt.config.ts'), /site: \{[^}]*url: 'https:\/\/planmed\.com\.co'/s)
    assert.match(read('nuxt.config.ts'), /localDomain: 'planmed\.com\.co'/)
    assert.ok(read('public/robots.txt').includes(`Sitemap: ${DOMAIN}/sitemap.xml`))
  })

  test('ninguna página ni componente fija otro host en su canonical: todas parten de la configuración del sitio', () => {
    for (const f of ['pages/financiacion.vue', 'pages/nosotros.vue', 'pages/servicios.vue', 'pages/quienes-somos.vue', 'pages/estudio-de-creditos.vue', 'pages/procedimientos/index.vue', 'components/site/ManagedPage.vue', 'pages/recomendaciones/[topic]/[subtopic].vue']) {
      const src = read(f)
      assert.equal(/rel: 'canonical', href: ['`]https?:\/\//.test(src), false, `${f} fija el host del canonical`)
      assert.match(src, /useSiteConfig\(\)\.url/, f)
    }
  })

  test('el dominio antiguo «planmed.com» (sin .co) no aparece en código ni metadatos públicos', () => {
    for (const f of ['nuxt.config.ts', 'public/robots.txt', 'shared/utils/financingSeo.ts', 'shared/utils/share.ts', 'pages/financiacion.vue']) {
      assert.equal(/planmed\.com(?!\.co)/.test(read(f)), false, f)
    }
  })
})
