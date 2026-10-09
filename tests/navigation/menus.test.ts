// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Menús de la barra de navegación (utils/navMenus.ts): Nuestros Pacientes y Recomendaciones, con listas vacías, contenido
// despublicado y errores del Hub. Más comprobaciones estáticas de cómo Navbar.vue los alimenta.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const { buildMenus } = await import(pathToFileURL(join(ROOT, 'utils/navMenus.ts')).href)
const { RECOMMENDATION_KINDS } = await import(pathToFileURL(join(ROOT, 'utils/recommendationKinds.ts')).href)

const both = { videos: true, beforeAfter: true }
const page = (slug, group, menuLabel = slug) => ({ slug, group, menuLabel })
const proc = (slug, name, over = {}) => ({ slug, name, tiene_recomendaciones_post: false, tiene_recomendaciones_revision: false, ...over })
const build = (over = {}) => buildMenus({ visibility: both, pages: [], procedures: [], ...over }, RECOMMENDATION_KINDS)
const byLabel = (menus, label) => menus.find(m => m.label === label)

describe('Nuestros Pacientes', () => {
  test('con todo visible: videos, antes y después y programa de referidos', () => {
    const m = byLabel(build(), 'NUESTROS PACIENTES')
    assert.deepEqual(m.items.map(i => i.to), ['/testimonios', '/testimonios/antes-y-despues', '/testimonios/programa-de-referidos'])
    assert.equal(m.to, '/testimonios')
  })

  test('la visibilidad de Hub oculta videos y/o antes y después; el programa de referidos siempre queda', () => {
    assert.deepEqual(byLabel(build({ visibility: { videos: false, beforeAfter: true } }), 'NUESTROS PACIENTES').items.map(i => i.label), ['Antes y después', 'Programa de referidos'])
    assert.deepEqual(byLabel(build({ visibility: { videos: true, beforeAfter: false } }), 'NUESTROS PACIENTES').items.map(i => i.label), ['Videos', 'Programa de referidos'])
    assert.deepEqual(byLabel(build({ visibility: { videos: false, beforeAfter: false } }), 'NUESTROS PACIENTES').items.map(i => i.label), ['Programa de referidos'])
  })
})

describe('Recomendaciones', () => {
  test('sin contenido publicado ni procedimientos con texto: el menú RECOMENDACIONES no se muestra', () => {
    const menus = build({ procedures: [proc('a', 'A'), proc('b', 'B')] })
    assert.equal(byLabel(menus, 'RECOMENDACIONES'), undefined)
    assert.equal(menus.length, 1)
  })

  test('páginas generales publicadas aparecen sueltas, en el orden que entrega el Hub', () => {
    const m = byLabel(build({ pages: [page('cita-preanestesia', 'general', 'Cita de preanestesia'), page('otra', 'general', 'Otra')] }), 'RECOMENDACIONES')
    assert.deepEqual(m.items.map(i => [i.to, i.label]), [['/recomendaciones/cita-preanestesia', 'Cita de preanestesia'], ['/recomendaciones/otra', 'Otra']])
    assert.equal(m.flip, true)
  })

  test('cuidados: una entrada por procedimiento con texto; los que no lo tienen no aparecen', () => {
    const m = byLabel(build({ procedures: [proc('mamoplastia', 'Mamoplastia', { tiene_recomendaciones_post: true }), proc('lipo', 'Lipo')] }), 'RECOMENDACIONES')
    const group = m.items[0]
    assert.equal(group.to, '/recomendaciones/cuidados')
    assert.equal(group.label, RECOMMENDATION_KINDS.cuidados.menuLabel)
    assert.deepEqual(group.children.map(c => [c.to, c.label]), [['/recomendaciones/cuidados/mamoplastia', 'Cuidado de Mamoplastia']])
  })

  test('revisión: usa su propio indicador y conserva la ruta de Revisión de mamoplastia', () => {
    const m = byLabel(build({ procedures: [proc('mamoplastia', 'Mamoplastia', { tiene_recomendaciones_revision: true }), proc('lipo', 'Lipo', { tiene_recomendaciones_post: true })] }), 'RECOMENDACIONES')
    const revision = m.items.find(i => i.to === '/recomendaciones/revision')
    assert.deepEqual(revision.children.map(c => [c.to, c.label]), [['/recomendaciones/revision/mamoplastia', 'Revisión Mamoplastia']])
    assert.deepEqual(m.items.find(i => i.to === '/recomendaciones/cuidados').children.map(c => c.to), ['/recomendaciones/cuidados/lipo'])
  })

  test('páginas independientes de los grupos cuidados y revisión van dentro de su submenú, tras los procedimientos', () => {
    const m = byLabel(build({
      pages: [page('prequirurgicas', 'revision', 'Prequirúrgicas'), page('dieta', 'cuidados', 'Dieta')],
      procedures: [proc('mamoplastia', 'Mamoplastia', { tiene_recomendaciones_revision: true })]
    }), 'RECOMENDACIONES')
    assert.deepEqual(m.items.find(i => i.to === '/recomendaciones/revision').children.map(c => c.to), ['/recomendaciones/revision/mamoplastia', '/recomendaciones/prequirurgicas'])
    assert.deepEqual(m.items.find(i => i.to === '/recomendaciones/cuidados').children.map(c => c.to), ['/recomendaciones/dieta'])
  })

  test('un grupo solo con páginas (sin procedimientos) igual muestra su submenú', () => {
    const m = byLabel(build({ pages: [page('prequirurgicas', 'revision', 'Prequirúrgicas')] }), 'RECOMENDACIONES')
    assert.equal(m.items.length, 1)
    assert.equal(m.items[0].to, '/recomendaciones/revision')
  })

  test('contenido despublicado: el Hub no lo entrega, así que no hay forma de que aparezca (la lista pública es la única fuente)', () => {
    // Antes de publicar: ni la página ni el indicador existen en la respuesta pública.
    const before = build({ pages: [], procedures: [proc('mamoplastia', 'Mamoplastia', { tiene_recomendaciones_post: false })] })
    assert.equal(byLabel(before, 'RECOMENDACIONES'), undefined)
    const after = build({ pages: [page('dieta', 'general', 'Dieta')] })
    assert.equal(byLabel(after, 'RECOMENDACIONES').items.length, 1)
  })

  test('solo se usan procedimientos de la lista pública (activos y habilitados para la línea): un indicador ausente o distinto de true no cuenta', () => {
    const m = build({ procedures: [proc('a', 'A', { tiene_recomendaciones_post: 'true' }), proc('b', 'B', { tiene_recomendaciones_post: 1 }), { slug: 'c', name: 'C' }] })
    assert.equal(byLabel(m, 'RECOMENDACIONES'), undefined)
  })
})

describe('errores del Hub (listas vacías por defecto)', () => {
  test('si Hub no responde, Pacientes sale completo y Recomendaciones no se muestra (nunca un menú roto)', () => {
    const menus = buildMenus({ visibility: { videos: true, beforeAfter: true }, pages: [], procedures: [] }, RECOMMENDATION_KINDS)
    assert.deepEqual(menus.map(m => m.label), ['NUESTROS PACIENTES'])
    assert.equal(menus[0].items.length, 3)
  })

  test('todos los enlaces generados son rutas internas válidas', () => {
    const menus = build({
      pages: [page('cita', 'general'), page('x', 'cuidados'), page('y', 'revision')],
      procedures: [proc('a', 'A', { tiene_recomendaciones_post: true, tiene_recomendaciones_revision: true })]
    })
    const links = menus.flatMap(m => [m.to, ...m.items.flatMap(i => [i.to, ...(i.children ?? []).map(c => c.to)])])
    for (const to of links) assert.match(to, /^\/[a-z0-9/-]*$/, to)
  })
})

describe('Navbar.vue', () => {
  const navbar = readFileSync(join(ROOT, 'components/layout/Navbar.vue'), 'utf8')

  test('los tres módulos consumen sus servicios públicos de Hub con SSR y no hay datos en onMounted', () => {
    assert.match(navbar, /useAsyncData\('patient-section'/)
    assert.match(navbar, /useAsyncData\('nav-recommendations'/)
    assert.match(navbar, /publicTestimonialsService\.getContent\(\)/)
    assert.match(navbar, /publicRecommendationsService\.getPages\(\)/)
    assert.match(navbar, /publicProcedureService\.getProcedures\(\)/)
    assert.equal(/onMounted\([^)]*(Service|load)/.test(navbar), false)
    assert.equal(/localStorage|MockTestimonials|MockRecommendations|[^c]testimonialsService|[^c]recommendationsService/.test(navbar), false)
  })

  test('la clave de useAsyncData de pacientes coincide con la de las páginas /testimonios* (una sola petición por navegación)', () => {
    for (const page of ['index', 'antes-y-despues', 'programa-de-referidos']) {
      assert.match(readFileSync(join(ROOT, `pages/testimonios/${page}.vue`), 'utf8'), /useAsyncData\('patient-section'/, page)
    }
    assert.match(readFileSync(join(ROOT, 'components/testimonials/TestimonialsNav.vue'), 'utf8'), /useAsyncData\('patient-section'/)
  })

  test('el submenú de segundo nivel de recomendaciones tiene altura máxima con scroll interno (escritorio) y el menú móvil scrollea', () => {
    assert.match(navbar, /max-h-\[70vh\] overflow-y-auto/)
    assert.match(navbar, /max-h-\[calc\(100dvh-88px\)\] overflow-y-auto/)
  })
})
