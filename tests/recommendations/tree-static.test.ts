// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Comprobaciones estáticas del código fuente del árbol de Recomendaciones: páginas SSR, 404/503, redirección de rutas antiguas, SEO,
// renderizado seguro de cada tipo de sección y comportamiento responsive. NO sustituyen una validación en navegador (ver informe).
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from './harness.ts'

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')
const code = (rel: string) => read(rel).replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1')

const PAGE = 'pages/recomendaciones/[topic]/[subtopic].vue'
const LEGACY = 'pages/recomendaciones/[slug].vue'
const SECTIONS = 'components/recommendations/RecommendationSections.vue'
const treeFiles = [
  PAGE, LEGACY, SECTIONS, 'components/recommendations/SectionCta.vue', 'components/recommendations/SectionMedia.vue',
  'components/recommendations/RecommendationTopicIndex.vue', 'shared/utils/recommendationTree.ts',
  'server/api/public/recommendation-topics/index.get.ts', 'server/api/public/recommendation-topics/[topic]/[subtopic].get.ts'
]

describe('página de un subtema: /recomendaciones/{tema}/{subtema}', () => {
  const page = code(PAGE)

  test('se resuelve en el servidor (SSR) y distingue 404 de 503', () => {
    assert.match(page, /await useAsyncData\(/)
    assert.match(page, /getSubtopic\(topic, slug\)/)
    assert.match(page, /statusCode: 503/)
    assert.match(page, /statusCode: 404/)
    // El fallo del Hub se comprueba ANTES que la ausencia de datos: un error nunca se presenta como «no existe».
    assert.equal(page.indexOf('error.value') < page.indexOf('!subtopic.value'), true)
  })

  test('valida los slugs de la URL antes de consultar', () => {
    assert.match(page, /isRecommendationSlug\(topic\)/)
    assert.match(page, /isRecommendationSlug\(slug\)/)
  })

  test('SEO: título, descripción, Open Graph y URL canónica jerárquica del subtema', () => {
    assert.match(page, /subtopicSeo\(subtopic\.value\)/)
    assert.match(page, /useSeoMeta\(\{[\s\S]*title: seo\.title[\s\S]*description: seo\.description/)
    assert.match(page, /ogImage/)
    assert.match(page, /rel: 'canonical'/)
    assert.match(page, /canonicalPath/)
  })

  test('muestra la introducción (texto, imagen y vídeo) y las secciones en el orden de la API', () => {
    const tpl = read(PAGE).split('<script')[0]
    assert.match(tpl, /:html="subtopic\.intro\.content"/)
    assert.match(tpl, /:video-url="subtopic\.intro\.video\?\.embedUrl"/)
    assert.match(tpl, /:image="subtopic\.intro\.image\?\.url"/)
    assert.match(tpl, /<RecommendationsRecommendationSections :sections="subtopic\.sections" \/>/)
    assert.match(tpl, /:eyebrow="subtopic\.topic\.title"/)
  })
})

describe('compatibilidad de /recomendaciones/{slug}', () => {
  const legacy = code(LEGACY)

  test('redirige con 301 los subtemas del árbol, muestra la portada de un tema y conserva el contrato histórico', () => {
    assert.match(legacy, /resolveLegacySlug\(tree\.value, slug\)/)
    assert.match(legacy, /resolution\.kind === 'redirect'/)
    assert.match(legacy, /navigateTo\(resolution\.to, \{ redirectCode: 301, replace: true \}\)/)
    assert.match(legacy, /RecommendationTopicIndex/)
    assert.match(legacy, /publicRecommendationsService\.getPage\(slug\)/)
  })

  test('un fallo del Hub sigue siendo 503 y, sin árbol, una página ausente no se declara 404 con certeza', () => {
    assert.match(legacy, /statusCode: 503/)
    assert.match(legacy, /if \(treeError\.value\) throw createError\(\{ statusCode: 503/)
    assert.match(legacy, /statusCode: 404/)
  })

  test('los listados históricos por procedimiento no repiten los subtemas que ya viven en su tema', () => {
    const index = code('components/recommendations/ProcedureRecommendationIndex.vue')
    assert.match(index, /treeSubtopicSlugs\(topics\)/)
    assert.match(index, /!inTree\.has\(p\.slug\)/)
    assert.match(index, /getTopics\(\)\.catch\(\(\) => \[\]\)/)
  })

  test('las rutas por procedimiento (cuidados / revisión) no cambian', () => {
    assert.match(read('pages/recomendaciones/cuidados/[slug].vue'), /kind="cuidados"/)
    assert.match(read('pages/recomendaciones/revision/[slug].vue'), /kind="revision"/)
  })
})

describe('renderizado de secciones', () => {
  const view = read(SECTIONS)
  const tpl = view.split('<script')[0]

  test('un bloque por tipo: callout, contacto, descripción/personalizada y lista de recomendaciones', () => {
    assert.match(tpl, /section\.type === 'callout'/)
    assert.match(tpl, /section\.type === 'contact' \? 'gold' : 'dark'/)
    assert.match(view, /if \(type === 'contact'\)/)
    assert.match(tpl, /<ul v-if="section\.items\.length"/)
    assert.match(tpl, /data-section-type="section\.type"|:data-section-type="section\.type"/)
  })

  test('el HTML solo se muestra a través de CommonRichContent (lista blanca); ningún v-html propio', () => {
    for (const file of [SECTIONS, 'components/recommendations/SectionCta.vue', 'components/recommendations/SectionMedia.vue', 'components/recommendations/RecommendationTopicIndex.vue', PAGE]) {
      assert.equal(/v-html/.test(read(file)), false, file)
    }
    assert.equal((tpl.match(/<CommonRichContent/g) ?? []).length >= 4, true)
  })

  test('el botón es opcional: nada se reserva sin CTA, e imagen/vídeo solo si existen', () => {
    assert.match(tpl, /<div v-if="section\.cta"/)
    assert.match(tpl, /v-if="section\.image \|\| section\.video"/)
    assert.match(tpl, /v-if="section\.title \|\| section\.subtitle"/)
  })

  test('la lista que vive en `content` no se duplica: los items solo salen si el Hub los entrega', () => {
    assert.match(tpl, /v-if="section\.items\.length"/)
    // El texto de la sección se renderiza en una sola rama por sección (con o sin medios).
    assert.equal((tpl.match(/v-else-if="has\(section\.content\)"/g) ?? []).length, 1)
  })

  test('una sección vacía no genera una tarjeta vacía', () => {
    assert.match(view, /filter\(s => !sectionParts\(s\)\.isEmpty\)/)
  })

  test('el botón usa NuxtLink para rutas internas y rel=noopener para enlaces externos', () => {
    const cta = read('components/recommendations/SectionCta.vue')
    assert.match(cta, /<NuxtLink v-if="internal"/)
    assert.match(cta, /rel="external \? 'noopener noreferrer' : undefined"|:rel="external \? 'noopener noreferrer' : undefined"/)
    assert.match(cta, /target="external \? '_blank' : undefined"|:target="external \? '_blank' : undefined"/)
  })

  test('el vídeo se incrusta con el componente existente y la URL de embed ya validada', () => {
    const media = read('components/recommendations/SectionMedia.vue')
    assert.match(media, /<NewsYouTubeEmbed :url="section\.video\.embedUrl"/)
    assert.match(media, /loading="lazy"/)
  })

  test('la tarjeta de introducción solo se muestra con contenido cuando hay secciones; las páginas antiguas la conservan', () => {
    const shell = read('components/recommendations/RecommendationShell.vue')
    assert.match(shell, /<article v-if="hasArticle"/)
    assert.match(shell, /!slots\.default \|\|/)
    assert.match(shell, /<slot \/>/)
  })
})

describe('diseño responsive (clases de Tailwind existentes, sin estilos nuevos del sitio)', () => {
  test('las secciones y la portada del tema se adaptan: columnas solo desde md/lg, texto con salto de línea y paleta de Planmed', () => {
    const view = read(SECTIONS)
    assert.match(view, /md:grid md:grid-cols-/)
    assert.match(view, /p-6 md:p-12/)
    assert.match(view, /break-words/)
    const index = read('components/recommendations/RecommendationTopicIndex.vue')
    assert.match(index, /grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/)
    for (const file of [SECTIONS, 'components/recommendations/RecommendationTopicIndex.vue']) {
      assert.equal(/#[0-9a-fA-F]{6}/.test(read(file)), true)
      assert.equal(/#(0C2619|D3A76A|fcf9f8|e5e2e1)/i.test(read(file)), true, `${file} usa la paleta de Planmed`)
    }
  })
})

describe('sin atajos', () => {
  test('el árbol no usa localStorage, mocks ni el campo `path` del Hub', () => {
    for (const file of treeFiles) {
      const src = code(file)
      assert.equal(/localStorage|sessionStorage|indexedDB|Mock[A-Z]/.test(src), false, file)
    }
    for (const file of [PAGE, LEGACY, SECTIONS, 'server/api/public/recommendation-topics/index.get.ts', 'server/api/public/recommendation-topics/[topic]/[subtopic].get.ts']) {
      assert.equal(/\.path\b/.test(code(file)), false, `${file} no usa \`path\` del Hub`)
    }
  })

  test('las rutas de Nitro no se cachean y usan la clasificación de fallos del Hub', () => {
    for (const file of ['server/api/public/recommendation-topics/index.get.ts', 'server/api/public/recommendation-topics/[topic]/[subtopic].get.ts']) {
      const src = read(file)
      assert.match(src, /setHeader\(event, 'Cache-Control', 'no-store'\)/)
      assert.match(src, /assertHubOk\(/)
      assert.match(src, /wellezyPublicGet/)
    }
  })

  test('el módulo compartido es puro (sin imports) para poder usarse en navegador, servidor y pruebas', () => {
    assert.equal(/^import\s/m.test(read('shared/utils/recommendationTree.ts')), false)
  })
})
