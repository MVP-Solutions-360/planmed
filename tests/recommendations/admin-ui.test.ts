// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Administración de Recomendaciones (/admin/recomendaciones): clasificación, pestañas, fuente publicada, cambios sin guardar,
// guardado del elemento correcto y errores de API. Sin framework de componentes: se prueba la lógica pura y el controlador con servicios simulados.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from './harness.ts'
import { resolveRecommendation } from '../../utils/recommendationSource.ts'
import { HubRecommendationsProvider } from '../../providers/HubRecommendationsProvider.ts'
import {
  KIND_LABEL, classifyPages, createAdminController, createAdminState, deriveSource, describeError, hasUnassociated, isDraftDirty,
  pagePublicUrl, procedurePublicUrl, validatePageDraft
} from '../../utils/recommendationsAdmin.ts'

const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const isEmpty = html => !html || html.replace(/<[^>]*>/g, '').trim() === ''

const page = (over = {}) => ({ slug: 'p', group: 'general', custom: true, menuLabel: 'P', title: 'T', videoUrl: '', image: '', content: '<p>x</p>', published: false, procedureSlug: null, ...over })
const proc = (over = {}) => ({ slug: 'abdominoplastia', name: 'Abdominoplastia', activo: true, editable: true, recomendaciones_post: '', recomendaciones_revision: '', ...over })

const sourceDeps = { resolve: resolveRecommendation, isEmpty }

// ─────────────────────────── Clasificación ───────────────────────────
describe('clasificación de recomendaciones', () => {
  const procedures = [proc(), proc({ slug: 'mamoplastia', name: 'Mamoplastia' })]
  const pages = [
    page({ slug: 'g1' }),
    page({ slug: 'g2', title: 'G2' }),
    page({ slug: 'c-abdo', group: 'cuidados', procedureSlug: 'abdominoplastia' }),
    page({ slug: 'r-abdo', group: 'revision', procedureSlug: 'abdominoplastia' }),
    page({ slug: 'suelta', group: 'cuidados', procedureSlug: null }),
    page({ slug: 'huerfana', group: 'revision', procedureSlug: 'no-existe-en-la-lista' })
  ]

  test('generales, vinculadas por (procedimiento, tipo) y sin asociación se separan sin mezclarse', () => {
    const c = classifyPages(pages, procedures)
    assert.deepEqual(c.general.map(p => p.slug), ['g1', 'g2'])
    assert.deepEqual(Object.keys(c.linked).sort(), ['abdominoplastia::cuidados', 'abdominoplastia::revision'])
    assert.deepEqual(c.unassociated.map(p => p.slug).sort(), ['huerfana', 'suelta'])
  })

  test('una página vinculada nunca se cuenta como general y una general nunca se vincula', () => {
    const c = classifyPages(pages, procedures)
    assert.equal(c.general.some(p => p.group !== 'general'), false)
    assert.equal(Object.values(c.linked).some(p => p.group === 'general'), false)
  })

  test('«Sin asociación» solo existe si hay páginas en ese caso', () => {
    assert.equal(hasUnassociated(classifyPages(pages, procedures)), true)
    assert.equal(hasUnassociated(classifyPages(pages.filter(p => p.slug !== 'suelta' && p.slug !== 'huerfana'), procedures)), false)
    assert.equal(hasUnassociated(classifyPages([], procedures)), false)
  })

  test('la vista solo renderiza «Sin asociación» con v-if sobre esa condición (nunca una categoría vacía permanente)', () => {
    const vue = read('pages/admin/recomendaciones/index.vue')
    assert.match(vue, /v-if="hasUnassociated\(classification\)"[^>]*>/)
  })
})

// ─────────────────────────── Fuente publicada ───────────────────────────
describe('fuente publicada (misma regla que la web pública)', () => {
  const link = (p) => ({ [`${p.procedureSlug}::${p.group}`]: p })
  const text = '<p>histórico</p>'

  test('página vinculada publicada => manda la página; el histórico no la sustituye', () => {
    const p = page({ slug: 'c', group: 'cuidados', procedureSlug: 'abdominoplastia', published: true })
    const s = deriveSource(proc({ recomendaciones_post: text }), 'cuidados', link(p), sourceDeps)
    assert.equal(s.fuente, 'pagina')
    assert.equal(s.page.slug, 'c')
    assert.equal(s.historicText, text) // se conserva para mostrarlo SOLO como lectura
  })

  test('página vinculada oculta => no hay contenido y el histórico NO reaparece', () => {
    const p = page({ slug: 'c', group: 'cuidados', procedureSlug: 'abdominoplastia', published: false })
    assert.equal(deriveSource(proc({ recomendaciones_post: text }), 'cuidados', link(p), sourceDeps).fuente, 'pagina_oculta')
  })

  test('sin página vinculada: histórico con texto => histórico; sin texto => ninguna', () => {
    assert.equal(deriveSource(proc({ recomendaciones_post: text }), 'cuidados', {}, sourceDeps).fuente, 'historico')
    assert.equal(deriveSource(proc({ recomendaciones_post: '<p> </p>' }), 'cuidados', {}, sourceDeps).fuente, 'ninguna')
    assert.equal(deriveSource(proc(), 'cuidados', {}, sourceDeps).fuente, 'ninguna')
  })

  test('cuidados y revisión son independientes', () => {
    const p = page({ slug: 'c', group: 'cuidados', procedureSlug: 'abdominoplastia', published: false })
    const procedure = proc({ recomendaciones_post: text, recomendaciones_revision: '<p>rev</p>' })
    assert.equal(deriveSource(procedure, 'cuidados', link(p), sourceDeps).fuente, 'pagina_oculta')
    assert.equal(deriveSource(procedure, 'revision', link(p), sourceDeps).fuente, 'historico')
  })

  test('paridad con la regla del Hub para todas las combinaciones (página × texto)', () => {
    // Réplica de Cirugia::recommendationSource del Hub: página publicada | oculta | histórico | ninguna.
    const hub = (page, hasText) => page ? (page.published ? 'pagina' : 'pagina_oculta') : (hasText ? 'historico' : 'ninguna')
    for (const pageState of [null, true, false]) {
      for (const hasText of [true, false]) {
        const p = pageState === null ? null : page({ slug: 'c', group: 'cuidados', procedureSlug: 'abdominoplastia', published: pageState })
        const procedure = proc({ recomendaciones_post: hasText ? text : '' })
        assert.equal(deriveSource(procedure, 'cuidados', p ? link(p) : {}, sourceDeps).fuente, hub(p, hasText), `página=${pageState} texto=${hasText}`)
      }
    }
  })

  test('la fuente se delega en resolveRecommendation: el panel no define una regla paralela', () => {
    const src = read('utils/recommendationsAdmin.ts')
    assert.match(src, /deps\.resolve\(/)
    assert.match(read('pages/admin/recomendaciones/index.vue'), /import \{ resolveRecommendation \} from '~\/utils\/recommendationSource'/)
  })

  test('«Ver en la web»: solo con destino real (publicada / con contenido / procedimiento activo)', () => {
    assert.equal(pagePublicUrl(page({ slug: 'g', published: true })), '/recomendaciones/g')
    assert.equal(pagePublicUrl(page({ slug: 'g', published: false })), null)
    const procedure = proc()
    assert.equal(procedurePublicUrl(procedure, 'cuidados', { fuente: 'historico' }), '/recomendaciones/cuidados/abdominoplastia')
    assert.equal(procedurePublicUrl(procedure, 'revision', { fuente: 'pagina' }), '/recomendaciones/revision/abdominoplastia')
    assert.equal(procedurePublicUrl(procedure, 'cuidados', { fuente: 'pagina_oculta' }), null)
    assert.equal(procedurePublicUrl(procedure, 'cuidados', { fuente: 'ninguna' }), null)
    assert.equal(procedurePublicUrl(proc({ activo: false }), 'cuidados', { fuente: 'historico' }), null)
  })
})

// ─────────────────────────── Controlador ───────────────────────────
function setup({ pages = [], procedures = [proc()], confirmAnswer = true, over = {} } = {}) {
  const calls = { savePage: [], setPublished: [], updateProcedure: [], createPage: [], deletePage: [], confirm: [] }
  const deps = {
    pages: {
      getPages: async () => structuredClone(pages),
      savePage: async (p) => { calls.savePage.push(structuredClone(p)); return { ...p } },
      setPublished: async (slug, published) => { calls.setPublished.push({ slug, published }); return { ...pages.find(p => p.slug === slug), published } },
      createPage: async (d) => { calls.createPage.push(d); return page({ slug: 'nueva', title: d.title, group: d.group }) },
      deletePage: async (slug) => { calls.deletePage.push(slug) },
      ...over.pages
    },
    procedures: {
      getProcedures: async () => structuredClone(procedures),
      updateProcedure: async (slug, data) => { calls.updateProcedure.push({ slug, data }); return { ...procedures.find(p => p.slug === slug), ...data } },
      ...over.procedures
    },
    ...sourceDeps,
    confirm: async (o) => { calls.confirm.push(o); return typeof confirmAnswer === 'function' ? confirmAnswer(o) : confirmAnswer },
    askTitle: async () => 'Mi nueva página',
    now: () => 1000
  }
  const state = createAdminState()
  const ctl = createAdminController(state, deps)
  return { state, ctl, calls }
}

describe('pestañas y selección', () => {
  const pages = [
    page({ slug: 'g1', title: 'General 1', published: true }),
    page({ slug: 'c-abdo', group: 'cuidados', procedureSlug: 'abdominoplastia', title: 'Cuidados abdo', published: true })
  ]
  const procedures = [proc({ recomendaciones_revision: '<p>rev</p>' }), proc({ slug: 'mamoplastia', name: 'Mamoplastia', recomendaciones_post: '<p>m</p>' })]

  test('carga: se selecciona la primera general; los vinculados no aparecen como generales', async () => {
    const { ctl, state } = setup({ pages, procedures })
    await ctl.load()
    assert.equal(state.loaded, true)
    assert.equal(ctl.current().key, 'page:g1')
    assert.deepEqual(ctl.classification().general.map(p => p.slug), ['g1'])
  })

  test('«Cuidados» y «Citas de revisión» muestran contenidos distintos del procedimiento elegido', async () => {
    const { ctl, state } = setup({ pages, procedures })
    await ctl.load()
    await ctl.selectProcedure('abdominoplastia')
    assert.equal(state.tab, 'procedure')
    // cuidados: página vinculada publicada => se edita la página
    assert.equal(ctl.current().type, 'page')
    assert.equal(ctl.current().key, 'page:c-abdo')
    // revisión: sin página => texto histórico del procedimiento
    await ctl.selectKind('revision')
    assert.equal(ctl.current().type, 'legacy')
    assert.equal(ctl.current().key, 'legacy:abdominoplastia:revision')
    assert.equal(ctl.current().label, `${KIND_LABEL.revision} de Abdominoplastia`)
  })

  test('cambiar de procedimiento no arrastra el estado del anterior', async () => {
    const { ctl, state } = setup({ pages, procedures })
    await ctl.load()
    await ctl.selectProcedure('abdominoplastia')
    await ctl.selectKind('revision')
    ctl.draft('legacy:abdominoplastia:revision')
    await ctl.selectProcedure('mamoplastia')
    assert.equal(ctl.current().key, 'legacy:mamoplastia:revision')
    assert.equal(state.drafts['legacy:abdominoplastia:revision'], undefined)
    assert.equal(ctl.draft(ctl.current().key).text, '') // revisión de Mamoplastia: sin texto
  })

  test('el texto histórico no es editable cuando una página del CMS es la fuente', async () => {
    const { ctl, calls } = setup({ pages, procedures })
    await ctl.load()
    await ctl.selectProcedure('abdominoplastia') // cuidados => página vinculada
    assert.equal(ctl.current().type, 'page')
    assert.equal(await ctl.save('legacy:abdominoplastia:cuidados'), false)
    assert.equal(calls.updateProcedure.length, 0)
  })

  test('un procedimiento maestro (no editable) queda en solo lectura y no guarda', async () => {
    const { ctl, calls } = setup({ pages: [], procedures: [proc({ editable: false, recomendaciones_post: '<p>x</p>' })] })
    await ctl.load()
    await ctl.selectProcedure('abdominoplastia')
    const el = ctl.current()
    assert.equal(el.readonly, true)
    ctl.draft(el.key).text = '<p>cambio</p>'
    assert.equal(await ctl.save(el.key), false)
    assert.equal(calls.updateProcedure.length, 0)
  })
})

describe('prevención de pérdida de cambios sin guardar', () => {
  const pages = [page({ slug: 'a', title: 'A', published: true }), page({ slug: 'b', title: 'B' })]

  test('con cambios, elegir otro elemento pide confirmación; si se rechaza, no se pierde nada', async () => {
    const { ctl, state, calls } = setup({ pages, confirmAnswer: false })
    await ctl.load()
    ctl.draft('page:a').title = 'A editada'
    assert.equal(ctl.isDirty('page:a'), true)
    assert.equal(await ctl.selectGeneralPage('b'), false)
    assert.equal(calls.confirm.length, 1)
    assert.match(calls.confirm[0].text, /«A»/)
    assert.equal(state.generalSlug, 'a')
    assert.equal(state.drafts['page:a'].title, 'A editada')
  })

  test('si se acepta, se descartan solo los cambios del elemento abierto y se cambia de selección', async () => {
    const { ctl, state } = setup({ pages, confirmAnswer: true })
    await ctl.load()
    ctl.draft('page:a').title = 'A editada'
    assert.equal(await ctl.selectGeneralPage('b'), true)
    assert.equal(state.generalSlug, 'b')
    assert.equal(state.drafts['page:a'], undefined)
    assert.equal(state.pages.find(p => p.slug === 'a').title, 'A') // lo guardado no cambió
  })

  test('sin cambios no se pregunta nada; elegir el mismo elemento tampoco', async () => {
    const { ctl, calls } = setup({ pages })
    await ctl.load()
    ctl.draft('page:a')
    assert.equal(await ctl.selectGeneralPage('a'), true)
    assert.equal(await ctl.selectGeneralPage('b'), true)
    assert.equal(calls.confirm.length, 0)
  })

  test('cambiar de pestaña con cambios pendientes también pide confirmación', async () => {
    const { ctl, state, calls } = setup({ pages, confirmAnswer: false })
    await ctl.load()
    ctl.draft('page:a').content = '<p>nuevo</p>'
    assert.equal(await ctl.selectTab('procedure'), false)
    assert.equal(state.tab, 'general')
    assert.equal(calls.confirm.length, 1)
  })

  test('"<p></p>" frente a "" no cuenta como cambio', () => {
    assert.equal(isDraftDirty({ content: '<p></p>' }, { content: '' }, isEmpty), false)
    assert.equal(isDraftDirty({ content: '<p>a</p>' }, { content: '' }, isEmpty), true)
  })

  test('la pantalla protege también la salida de la ruta y el cierre de la pestaña', () => {
    const vue = read('pages/admin/recomendaciones/index.vue')
    assert.match(vue, /onBeforeRouteLeave/)
    assert.match(vue, /beforeunload/)
  })

  test('recargar (reintentar) pasa por la misma protección', async () => {
    const { ctl, state, calls } = setup({ pages, confirmAnswer: false })
    await ctl.load()
    ctl.draft('page:a').title = 'X'
    assert.equal(await ctl.reload(), false)
    assert.equal(calls.confirm.length, 1)
    assert.equal(state.drafts['page:a'].title, 'X')
  })
})

describe('guardado del elemento correcto', () => {
  const pages = [page({ slug: 'a', title: 'A', published: true }), page({ slug: 'b', title: 'B', published: false })]

  test('guarda solo el elemento indicado, conserva su estado de publicación y no envía otros', async () => {
    const { ctl, state, calls } = setup({ pages, confirmAnswer: true })
    await ctl.load()
    ctl.draft('page:a').title = 'A nueva'
    assert.equal(await ctl.save('page:a'), true)
    assert.equal(calls.savePage.length, 1)
    assert.equal(calls.savePage[0].slug, 'a')
    assert.equal(calls.savePage[0].title, 'A nueva')
    assert.equal(calls.savePage[0].published, true) // guardar no cambia la publicación
    assert.equal(calls.setPublished.length, 0)
    assert.equal(state.pages.find(p => p.slug === 'b').title, 'B')
    assert.equal(ctl.isDirty('page:a'), false)
    assert.equal(state.savedAt['page:a'], 1000)
    assert.equal(state.savedAt['page:b'], undefined) // no se afirma que lo demás esté guardado
  })

  test('no se guarda un elemento que no es el abierto', async () => {
    const { ctl, calls } = setup({ pages })
    await ctl.load()
    ctl.draft('page:b').title = 'B nueva'
    assert.equal(await ctl.save('page:b'), false) // el abierto es «a»
    assert.equal(calls.savePage.length, 0)
  })

  test('no se envía el slug ni se cambia al editar (viaja el que ya existe)', async () => {
    const { ctl, calls } = setup({ pages })
    await ctl.load()
    ctl.draft('page:a').title = 'Otro título'
    await ctl.save('page:a')
    assert.equal(calls.savePage[0].slug, 'a')
    assert.doesNotMatch(read('pages/admin/recomendaciones/index.vue') + read('components/admin/recommendations/PageEditor.vue'), /v-model="draft\.slug"/)
  })

  test('sin solicitudes duplicadas: dos guardados simultáneos hacen una sola llamada', async () => {
    let release
    const gate = new Promise(r => { release = r })
    const { ctl, state, calls } = setup({ pages, over: { pages: { savePage: async (p) => { calls.savePage.push(p); await gate; return { ...p } } } } })
    await ctl.load()
    ctl.draft('page:a').title = 'A nueva'
    const first = ctl.save('page:a')
    const second = await ctl.save('page:a')
    assert.equal(second, false)
    assert.equal(state.saving['page:a'], true)
    release()
    assert.equal(await first, true)
    assert.equal(calls.savePage.length, 1)
    assert.equal(state.saving['page:a'], false)
  })

  test('durante el guardado no se puede abandonar el elemento', async () => {
    let release
    const gate = new Promise(r => { release = r })
    const { ctl, state } = setup({ pages, over: { pages: { savePage: async (p) => { await gate; return { ...p } } } } })
    await ctl.load()
    ctl.draft('page:a').title = 'A nueva'
    const saving = ctl.save('page:a')
    assert.equal(await ctl.selectGeneralPage('b'), false)
    assert.equal(state.generalSlug, 'a')
    release(); await saving
  })

  test('validaciones previas: título obligatorio y solo YouTube (sin llamar a la API)', async () => {
    const { ctl, state, calls } = setup({ pages })
    await ctl.load()
    ctl.draft('page:a').title = '   '
    assert.equal(await ctl.save('page:a'), false)
    assert.match(state.errors['page:a'].detail, /título/)
    ctl.draft('page:a').title = 'ok'
    ctl.draft('page:a').videoUrl = 'https://vimeo.com/1'
    assert.equal(await ctl.save('page:a'), false)
    assert.match(state.errors['page:a'].detail, /YouTube/)
    assert.equal(calls.savePage.length, 0)
    assert.equal(validatePageDraft({ title: 'x', videoUrl: 'https://youtu.be/abc', image: '', content: '' }), null)
  })

  test('texto histórico: guarda solo el campo del tipo y pide confirmar antes de vaciarlo', async () => {
    const { ctl, state, calls } = setup({ pages: [], procedures: [proc({ recomendaciones_post: '<p>viejo</p>' })], confirmAnswer: false })
    await ctl.load()
    await ctl.selectProcedure('abdominoplastia')
    const key = ctl.current().key
    ctl.draft(key).text = '<p></p>'
    assert.equal(await ctl.save(key), false) // vaciar no confirmado
    assert.equal(calls.updateProcedure.length, 0)
    assert.equal(calls.confirm.at(-1).title, 'Vaciar el texto')
    ctl.draft(key).text = '<p>nuevo</p>'
    assert.equal(await ctl.save(key), true)
    assert.deepEqual(calls.updateProcedure, [{ slug: 'abdominoplastia', data: { recomendaciones_post: '<p>nuevo</p>' } }])
    assert.equal(state.procedures[0].recomendaciones_post, '<p>nuevo</p>')
  })
})

describe('publicar y ocultar son acciones separadas', () => {
  const pages = [page({ slug: 'a', title: 'A', published: false, content: '<p>texto</p>' }), page({ slug: 'v', title: 'V', published: false, content: '<p></p>' })]

  test('publicar envía solo el estado; no guarda ni reenvía el borrador', async () => {
    const { ctl, calls } = setup({ pages })
    await ctl.load()
    assert.equal(await ctl.setPublished('a', true), true)
    assert.deepEqual(calls.setPublished, [{ slug: 'a', published: true }])
    assert.equal(calls.savePage.length, 0)
  })

  test('con cambios sin guardar no se publica (se publicaría contenido distinto al que se ve)', async () => {
    const { ctl, state, calls } = setup({ pages })
    await ctl.load()
    ctl.draft('page:a').title = 'cambio'
    assert.equal(await ctl.setPublished('a', true), false)
    assert.match(state.errors['page:a'].detail, /Guarda los cambios/)
    assert.equal(calls.setPublished.length, 0)
  })

  test('no se publica una página sin contenido; ocultar pide confirmación', async () => {
    const { ctl, calls } = setup({ pages: [{ ...pages[0], published: true }, pages[1]], confirmAnswer: false })
    await ctl.load()
    assert.equal(await ctl.setPublished('v', true), false)
    assert.equal(calls.setPublished.length, 0)
    assert.equal(await ctl.setPublished('a', false), false) // confirmación rechazada
    assert.equal(calls.setPublished.length, 0)
  })

  test('guardar nunca envía la publicación como cambio: viaja el valor ya guardado', async () => {
    const { ctl, calls } = setup({ pages: [{ ...pages[0], published: true }] })
    await ctl.load()
    ctl.draft('page:a').title = 'nuevo título'
    await ctl.save('page:a')
    assert.equal(calls.savePage[0].published, true)
  })

  test('el proveedor publica/oculta con un PUT parcial que solo lleva `published`', async () => {
    const sent = []
    const provider = new HubRecommendationsProvider(async (url, options) => { sent.push({ url, options }); return page({ published: true }) })
    await provider.setPublished('mi pagina', true)
    assert.equal(sent[0].url, '/api/admin/recommendations/mi%20pagina')
    assert.equal(sent[0].options.method, 'PUT')
    assert.deepEqual(sent[0].options.body, { published: true })
  })
})

describe('errores de API sin perder el contenido', () => {
  const pages = [page({ slug: 'a', title: 'A', published: true })]
  const forbidden = Object.assign(new Error('No tienes permiso para realizar esta acción.'), { statusCode: 403 })

  test('un 403 al guardar conserva el borrador, explica el permiso y no marca como guardado', async () => {
    const { ctl, state } = setup({ pages, over: { pages: { savePage: async () => { throw forbidden } } } })
    await ctl.load()
    const d = ctl.draft('page:a')
    d.title = 'Mi trabajo'
    d.content = '<p>mucho texto</p>'
    assert.equal(await ctl.save('page:a'), false)
    assert.equal(state.drafts['page:a'].title, 'Mi trabajo')
    assert.equal(state.drafts['page:a'].content, '<p>mucho texto</p>')
    assert.equal(ctl.isDirty('page:a'), true)
    assert.match(state.errors['page:a'].detail, /recomendaciones\.editar/)
    assert.equal(state.savedAt['page:a'], undefined)
    assert.equal(state.saving['page:a'], false)
    // y se puede reintentar
    assert.equal(ctl.isBusy('page:a'), false)
  })

  test('un error de red/validación del Hub conserva el borrador y muestra el mensaje real', async () => {
    const { ctl, state } = setup({ pages, over: { pages: { savePage: async () => { throw Object.assign(new Error('Revisa los datos ingresados.'), { statusCode: 422 }) } } } })
    await ctl.load()
    ctl.draft('page:a').title = 'X'
    await ctl.save('page:a')
    assert.equal(state.errors['page:a'].detail, 'Revisa los datos ingresados.')
    assert.equal(state.drafts['page:a'].title, 'X')
  })

  test('un fallo al cargar las páginas NO se interpreta como lista vacía y bloquea la edición por procedimiento', async () => {
    const { ctl, state } = setup({ pages, procedures: [proc({ recomendaciones_post: '<p>t</p>' })], over: { pages: { getPages: async () => { throw forbidden } } } })
    await ctl.load()
    assert.equal(state.loaded, true)
    assert.equal(state.pagesError.forbidden, true)
    assert.match(state.pagesError.message, /recomendaciones\.ver/)
    assert.deepEqual(state.pages, [])
    await ctl.selectProcedure('abdominoplastia')
    assert.equal(ctl.current().type, 'blocked') // sin saber si hay página vinculada no se edita el histórico a ciegas
    assert.equal(ctl.current().key, null)
  })

  test('un fallo al cargar procedimientos no impide ver las recomendaciones generales', async () => {
    const { ctl, state } = setup({ pages, over: { procedures: { getProcedures: async () => { throw Object.assign(new Error('x'), { statusCode: 503 }) } } } })
    await ctl.load()
    assert.ok(state.proceduresError)
    assert.equal(state.pagesError, null)
    assert.equal(ctl.current().key, 'page:a')
  })

  test('mensajes por código: 403 indica el permiso de la acción, 401 la sesión', () => {
    assert.match(describeError(forbidden, 'create').message, /recomendaciones\.crear/)
    assert.match(describeError(forbidden, 'delete').message, /recomendaciones\.eliminar/)
    assert.match(describeError(forbidden, 'save-legacy').message, /cirugias\.editar/)
    assert.match(describeError(Object.assign(new Error('x'), { statusCode: 401 }), 'save').message, /sesión/)
    assert.equal(describeError(new Error('boom'), 'save').message, 'boom')
  })

  test('crear: fallo del Hub no altera la lista; éxito agrega la página oculta y la selecciona', async () => {
    const failing = setup({ pages, over: { pages: { createPage: async () => { throw forbidden } } } })
    await failing.ctl.load()
    assert.equal(await failing.ctl.createGeneralPage(), false)
    assert.match(failing.state.errors['create'].detail, /recomendaciones\.crear/)
    assert.equal(failing.state.pages.length, 1)

    const ok = setup({ pages })
    await ok.ctl.load()
    assert.equal(await ok.ctl.createGeneralPage(), true)
    assert.deepEqual(ok.calls.createPage, [{ title: 'Mi nueva página', group: 'general' }])
    assert.equal(ok.state.generalSlug, 'nueva')
    assert.equal(ok.state.pages.find(p => p.slug === 'nueva').published, false)
  })

  test('eliminar: solo páginas creadas desde el panel y con confirmación', async () => {
    const { ctl, calls } = setup({ pages: [page({ slug: 'base', custom: false }), page({ slug: 'mia', custom: true })] })
    await ctl.load()
    assert.equal(await ctl.deletePage('base'), false)
    assert.equal(await ctl.deletePage('mia'), true)
    assert.deepEqual(calls.deletePage, ['mia'])
  })
})

describe('diseño de la pantalla', () => {
  const vue = read('pages/admin/recomendaciones/index.vue')

  test('dos pestañas principales y subpestañas por tipo, sin pestañas principales por tipo', () => {
    assert.match(vue, /Recomendaciones generales/)
    assert.match(vue, /Contenido por procedimiento/)
    assert.equal(/key: 'cuidados', label|key: 'revision', label/.test(vue), false)
    assert.deepEqual([KIND_LABEL.cuidados, KIND_LABEL.revision], ['Cuidados', 'Citas de revisión'])
  })

  test('no hay un «Guardar cambios» global: cada editor guarda su elemento y lo nombra', () => {
    assert.equal(/Guardar Cambios/i.test(vue), false)
    const bar = read('components/admin/recommendations/SaveBar.vue')
    assert.match(bar, /Guardar «/)
    assert.match(bar, /Cambios sin guardar/)
    assert.match(read('components/admin/recommendations/ErrorNotice.vue'), /Tus cambios siguen en pantalla/)
  })

  test('la pantalla no escribe URLs del Hub, ni slugs editables, ni usa almacenamiento del navegador', () => {
    const all = [vue, read('utils/recommendationsAdmin.ts'), ...['PageEditor', 'LegacyTextEditor', 'ProcedurePicker', 'SaveBar', 'StatusBadge'].map(n => read(`components/admin/recommendations/${n}.vue`))].join('\n')
    assert.equal(/https?:\/\/(localhost|127\.0\.0\.1|[a-z0-9.-]*wellezy)/i.test(all), false)
    assert.equal(/localStorage|sessionStorage|indexedDB/.test(all), false)
    assert.equal(/Authorization|Bearer |wellezyApiBaseUrl/.test(all), false)
  })
})
