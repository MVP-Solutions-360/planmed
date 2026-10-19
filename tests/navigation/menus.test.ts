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

const both = { videos: true, beforeAfter: true }
const topicOf = (slug, label, subs) => ({ slug, menuLabel: label, subtopics: subs.map(([s, l]) => ({ slug: s, menuLabel: l })) })
const build = (over = {}) => buildMenus({ visibility: both, topics: [], ...over })
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

describe('Recomendaciones: una sola fuente (el árbol vigente de Hub)', () => {
  test('sin temas publicados el menú RECOMENDACIONES no se muestra', () => {
    const menus = build()
    assert.equal(byLabel(menus, 'RECOMENDACIONES'), undefined)
    assert.equal(menus.length, 1)
  })

  test('páginas históricas, procedimientos con texto y sus grupos «cuidados»/«revisión» NO construyen el menú (causa de los duplicados)', () => {
    // Aunque el llamador (o un valor heredado) los pase, buildMenus ignora cualquier fuente que no sea el árbol.
    const menus = buildMenus({
      visibility: both,
      topics: [topicOf('cuidados-de-cirugias', 'Recomendaciones cuidados de cirugías', [['abdomen', 'Cuidado de abdominoplastia']])],
      pages: [{ slug: 'cuidado-de-abdominoplastia', group: 'cuidados', menuLabel: 'Cuidado de abdominoplastia' }, { slug: 'x', group: 'general', menuLabel: 'X' }],
      procedures: [{ slug: 'lipo', name: 'Lipo', tiene_recomendaciones_post: true, tiene_recomendaciones_revision: true }]
    })
    const m = byLabel(menus, 'RECOMENDACIONES')
    assert.deepEqual(m.items.map(i => i.label), ['Recomendaciones cuidados de cirugías'])
    const all = JSON.stringify(m)
    for (const legacy of ['/recomendaciones/cuidados"', '/recomendaciones/revision"', '/recomendaciones/cuidados/lipo', '/recomendaciones/x']) assert.equal(all.includes(legacy), false, legacy)
  })

  test('cada texto del menú sale una sola vez aunque el tema y su subtema se llamen igual (no se filtra por nombre)', () => {
    const m = byLabel(build({ topics: [topicOf('t', 'Mismo nombre', [['s', 'Mismo nombre']])] }), 'RECOMENDACIONES')
    assert.deepEqual(m.items.map(i => i.to), ['/recomendaciones/t'])
    assert.deepEqual(m.items[0].children.map(c => c.to), ['/recomendaciones/t/s'])
  })
})

describe('errores del Hub (listas vacías por defecto)', () => {
  test('si Hub no responde, Pacientes sale completo y Recomendaciones no se muestra (nunca un menú roto)', () => {
    const menus = buildMenus({ visibility: { videos: true, beforeAfter: true }, topics: [] })
    assert.deepEqual(menus.map(m => m.label), ['NUESTROS PACIENTES'])
    assert.equal(menus[0].items.length, 3)
  })

  test('todos los enlaces generados son rutas internas válidas', () => {
    const menus = build({ topics: [topicOf('uno', 'Uno', [['a', 'A'], ['b', 'B']]), topicOf('dos', 'Dos', [['c', 'C']])] })
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
    assert.match(navbar, /publicRecommendationsService\.getTopics\(\)/)
    assert.equal(/getPages\(\)/.test(navbar), false, 'el menú ya no consulta el contrato histórico')
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

// ── Árbol de recomendaciones (temas principales → subtemas) ───────────────────────────────────────────────────────────────────

describe('Recomendaciones: temas principales con sus subtemas', () => {
  test('varios temas con varios subtemas: cada tema es una entrada y sus subtemas cuelgan de él, en el orden del Hub', () => {
    const m = byLabel(build({ topics: [
      topicOf('preanestesia', 'Cita de preanestesia', [['importancia', 'La importancia']]),
      topicOf('cuidados', 'Cuidados de cirugías', [['abdomen', 'Abdominoplastia'], ['mama', 'Mamoplastia']])
    ] }), 'RECOMENDACIONES')
    assert.deepEqual(m.items.map(i => [i.to, i.label]), [['/recomendaciones/preanestesia', 'Cita de preanestesia'], ['/recomendaciones/cuidados', 'Cuidados de cirugías']])
    assert.deepEqual(m.items[1].children.map(c => [c.to, c.label]), [['/recomendaciones/cuidados/abdomen', 'Abdominoplastia'], ['/recomendaciones/cuidados/mama', 'Mamoplastia']])
  })

  test('un subtema nunca aparece como entrada principal independiente', () => {
    const m = byLabel(build({ topics: [topicOf('cuidados', 'Cuidados', [['abdomen', 'Abdominoplastia']])] }), 'RECOMENDACIONES')
    assert.equal(m.items.some(i => i.to === '/recomendaciones/abdomen'), false)
    assert.equal(m.items.every(i => i.children?.length), true)
  })

  test('temas sin subtemas utilizables no generan entrada; sin ningún tema el menú no aparece', () => {
    const m = byLabel(build({ topics: [topicOf('vacio', 'Vacío', []), topicOf('bien', 'Bien', [['a', 'A']])] }), 'RECOMENDACIONES')
    assert.deepEqual(m.items.map(i => i.to), ['/recomendaciones/bien'])
    assert.equal(byLabel(build({ topics: [topicOf('vacio', 'Vacío', [])] }), 'RECOMENDACIONES'), undefined)
  })

  test('sin enlaces vacíos ni duplicados', () => {
    const m = byLabel(build({ topics: [
      topicOf('uno', 'Uno', [['a', 'A'], ['a', 'A otra vez'], ['', 'Sin slug'], ['b', '  ']]),
      topicOf('', 'Sin slug', [['c', 'C']]),
      topicOf('dos', 'Dos', [['a', 'A en otro tema']])
    ] }), 'RECOMENDACIONES')
    assert.deepEqual(m.items.map(i => i.to), ['/recomendaciones/uno'])
    assert.deepEqual(m.items[0].children.map(c => c.to), ['/recomendaciones/uno/a'])
    const links = JSON.stringify(m)
    assert.equal(links.includes('"to":""'), false)
  })

  test('el enlace del menú principal lleva al primer tema; sin árbol cae en el índice de recomendaciones', () => {
    assert.equal(byLabel(build({ topics: [topicOf('uno', 'Uno', [['a', 'A']])] }), 'RECOMENDACIONES').to, '/recomendaciones/uno')
  })

  test('el menú de Nuestros Pacientes no cambia con el árbol', () => {
    const base = byLabel(build(), 'NUESTROS PACIENTES')
    const withTree = byLabel(build({ topics: [topicOf('uno', 'Uno', [['a', 'A']])] }), 'NUESTROS PACIENTES')
    assert.deepEqual(withTree, base)
  })
})

describe('Navbar.vue alimenta el menú con el árbol y es responsive', () => {
  const nav = readFileSync(join(ROOT, 'components/layout/Navbar.vue'), 'utf8')

  test('pide el árbol al servicio público y lo pasa a buildMenus sin romper el resto si falla', () => {
    assert.match(nav, /publicRecommendationsService\.getTopics\(\)/)
    assert.match(nav, /Promise\.allSettled\(\[publicProcedureService\.getProcedures\(\), publicRecommendationsService\.getTopics\(\)\]\)/)
    assert.match(nav, /topics: hubMenu\.value\?\.topics \?\? \[\]/)
  })

  test('escritorio: desplegable con submenú; móvil: <details> anidados con «Ver todo» y salto de línea en etiquetas largas', () => {
    assert.match(nav, /group\/sub/)
    assert.match(nav, /<details v-if="item\.children" class="group\/sub">/)
    assert.match(nav, /Ver todo/)
    assert.equal((nav.match(/break-words/g) ?? []).length >= 4, true)
    assert.match(nav, /min-\[1360px\]:hidden/)
  })
})
