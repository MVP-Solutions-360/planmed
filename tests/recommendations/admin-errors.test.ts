// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Errores de la administración de Recomendaciones asociados a la ACCIÓN que falló (Guardar / Publicar / Ocultar / Crear / Eliminar):
// título propio, clase (401, 403, validación, conexión, servidor), detalle real del Hub, borrador intacto y sin éxito falso.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from './harness.ts'
import { HubRecommendationsProvider } from '../../providers/HubRecommendationsProvider.ts'
import { ACTION_TITLE, createAdminController, createAdminState, describeError } from '../../utils/recommendationsAdmin.ts'
import { resolveRecommendation } from '../../utils/recommendationSource.ts'

const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const isEmpty = html => !html || html.replace(/<[^>]*>/g, '').trim() === ''
const page = (over = {}) => ({ slug: 'p', group: 'general', custom: true, menuLabel: 'P', title: 'T', videoUrl: '', image: '', content: '<p>x</p>', published: false, procedureSlug: null, ...over })
const proc = (over = {}) => ({ slug: 'abdominoplastia', name: 'Abdominoplastia', activo: true, editable: true, recomendaciones_post: '', recomendaciones_revision: '', ...over })

function setup({ pages = [], procedures = [proc()], confirmAnswer = true, over = {} } = {}) {
  const calls = { setPublished: [], successes: [] }
  const deps = {
    pages: {
      getPages: async () => structuredClone(pages),
      savePage: async (p) => ({ ...p }),
      setPublished: async (slug, published) => { calls.setPublished.push({ slug, published }); return { ...pages.find(p => p.slug === slug), published } },
      createPage: async (d) => page({ slug: 'nueva', title: d.title, group: d.group }),
      deletePage: async () => {},
      ...over.pages
    },
    procedures: {
      getProcedures: async () => structuredClone(procedures),
      updateProcedure: async (slug, data) => ({ ...procedures.find(p => p.slug === slug), ...data }),
      ...over.procedures
    },
    resolve: resolveRecommendation,
    isEmpty,
    confirm: async () => confirmAnswer,
    askTitle: async () => 'Nueva',
    notify: { success: m => calls.successes.push(m), warning: m => calls.successes.push(m) },
    now: () => 1000
  }
  const state = createAdminState()
  return { state, ctl: createAdminController(state, deps), calls }
}

const http = (statusCode, message = 'x', fieldErrors) => Object.assign(new Error(message), { statusCode, fieldErrors })
const pages = [
  page({ slug: 'a', title: 'A', published: false, content: '<p>texto</p>' }),
  page({ slug: 'v', title: 'V', published: false, content: '' }),
  page({ slug: 'o', title: 'O', published: true, content: '<p>t</p>' })
]
const CASES = [
  { name: '401', err: http(401), kind: 'auth', detail: /sesión/ },
  { name: '403', err: http(403), kind: 'forbidden', detail: /recomendaciones\.editar/ },
  { name: 'validación 422', err: http(422, 'Revisa los datos ingresados.', { video_url: ['El video debe ser un enlace válido de YouTube.'] }), kind: 'validation', detail: /Revisa los datos/ },
  { name: 'red (sin respuesta)', err: new Error('fetch failed'), kind: 'network', detail: /fetch failed/ },
  { name: '503', err: http(503, 'No fue posible conectar con Wellezy Hub. Intenta nuevamente.'), kind: 'network', detail: /Wellezy Hub/ },
  { name: '500', err: http(500, 'Error interno'), kind: 'server', detail: /Error interno/ }
]

describe('Guardar, Publicar y Ocultar: cada fallo lleva el título de SU acción', () => {
  for (const c of CASES) {
    test(`Guardar — ${c.name}: título propio, clase «${c.kind}», borrador intacto y nada marcado como guardado`, async () => {
      const { ctl, state, calls } = setup({ pages, over: { pages: { savePage: async () => { throw c.err } } } })
      await ctl.load()
      ctl.draft('page:a').title = 'Mi trabajo'
      assert.equal(await ctl.save('page:a'), false)
      const e = state.errors['page:a']
      assert.equal(e.action, 'save')
      assert.equal(e.title, 'No se pudieron guardar los cambios')
      assert.equal(e.kind, c.kind)
      assert.match(e.detail, c.detail)
      assert.equal(state.drafts['page:a'].title, 'Mi trabajo')
      assert.equal(ctl.isDirty('page:a'), true)
      assert.equal(state.savedAt['page:a'], undefined)
      assert.equal(state.pages.find(p => p.slug === 'a').title, 'A')
      assert.deepEqual(calls.successes, [])
    })

    test(`Publicar — ${c.name}: título propio, la página sigue oculta y no se anuncia éxito`, async () => {
      const { ctl, state, calls } = setup({ pages, over: { pages: { setPublished: async () => { throw c.err } } } })
      await ctl.load()
      assert.equal(await ctl.setPublished('a', true), false)
      const e = state.errors['page:a']
      assert.equal(e.action, 'publish')
      assert.equal(e.title, 'No se pudo publicar la página')
      assert.equal(e.kind, c.kind)
      assert.match(e.detail, c.detail)
      assert.equal(state.pages.find(p => p.slug === 'a').published, false)
      assert.equal(state.publishing['page:a'], false)
      assert.deepEqual(calls.successes, [])
    })

    test(`Ocultar — ${c.name}: título propio y la página sigue publicada`, async () => {
      const { ctl, state, calls } = setup({ pages, confirmAnswer: true, over: { pages: { setPublished: async () => { throw c.err } } } })
      await ctl.load()
      assert.equal(await ctl.setPublished('o', false), false)
      const e = state.errors['page:o']
      assert.equal(e.action, 'unpublish')
      assert.equal(e.title, 'No se pudo ocultar la página')
      assert.equal(e.kind, c.kind)
      assert.equal(state.pages.find(p => p.slug === 'o').published, true)
      assert.deepEqual(calls.successes, [])
    })
  }

  test('títulos exactos por acción', () => {
    assert.deepEqual([ACTION_TITLE.save, ACTION_TITLE.publish, ACTION_TITLE.unpublish], ['No se pudieron guardar los cambios', 'No se pudo publicar la página', 'No se pudo ocultar la página'])
  })

  test('403 al publicar y al ocultar nombran el permiso del Hub (recomendaciones.editar)', async () => {
    const { ctl, state } = setup({ pages, over: { pages: { setPublished: async () => { throw http(403) } } } })
    await ctl.load()
    await ctl.setPublished('a', true)
    assert.match(state.errors['page:a'].detail, /recomendaciones\.editar/)
    await ctl.setPublished('o', false)
    assert.match(state.errors['page:o'].detail, /recomendaciones\.editar/)
  })

  test('el detalle de validación del Hub se conserva (campos aplanados) y solo en errores 422', () => {
    const fields = { video_url: ['El video debe ser un enlace válido de YouTube.'], title: ['El título es obligatorio.'] }
    assert.deepEqual(describeError(http(422, 'Revisa los datos ingresados.', fields), 'save').details, ['El video debe ser un enlace válido de YouTube.', 'El título es obligatorio.'])
    assert.deepEqual(describeError(http(500, 'x', { a: ['no debería verse'] }), 'save').details, [])
  })
})

describe('el caso de la captura y otras validaciones locales', () => {
  test('publicar una página SIN contenido: «No se pudo publicar la página» (no «guardar»), sin llamar al Hub', async () => {
    const { ctl, state, calls } = setup({ pages })
    await ctl.load()
    await ctl.selectGeneralPage('v')
    assert.equal(await ctl.setPublished('v', true), false)
    const e = state.errors['page:v']
    assert.equal(e.action, 'publish')
    assert.equal(e.title, 'No se pudo publicar la página')
    assert.match(e.detail, /no tiene contenido guardado/)
    assert.equal(calls.setPublished.length, 0)
    assert.equal(state.pages.find(p => p.slug === 'v').published, false)
  })

  test('publicar con cambios sin guardar es un error de PUBLICAR (validación) y el borrador sigue', async () => {
    const { ctl, state } = setup({ pages })
    await ctl.load()
    ctl.draft('page:a').title = 'cambio'
    await ctl.setPublished('a', true)
    assert.equal(state.errors['page:a'].action, 'publish')
    assert.equal(state.errors['page:a'].kind, 'validation')
    assert.equal(state.drafts['page:a'].title, 'cambio')
  })

  test('guardar con título vacío: validación de «guardar»', async () => {
    const { ctl, state } = setup({ pages })
    await ctl.load()
    ctl.draft('page:a').title = ' '
    await ctl.save('page:a')
    assert.equal(state.errors['page:a'].action, 'save')
    assert.equal(state.errors['page:a'].kind, 'validation')
  })

  test('un error no queda pegado: la siguiente acción lo limpia y se puede cerrar a mano', async () => {
    let fail = true
    const { ctl, state } = setup({ pages, over: { pages: { setPublished: async (slug, published) => { if (fail) throw http(503, 'caído'); return { ...pages.find(p => p.slug === slug), published } } } } })
    await ctl.load()
    await ctl.setPublished('a', true)
    assert.equal(state.errors['page:a'].action, 'publish')
    fail = false
    assert.equal(await ctl.setPublished('a', true), true)
    assert.equal(state.errors['page:a'], null)
    fail = true
    await ctl.setPublished('o', false)
    ctl.clearError('page:o')
    assert.equal(state.errors['page:o'], null)
  })

  test('éxito solo tras respuesta satisfactoria: la lista cambia y se anuncia', async () => {
    const { ctl, state, calls } = setup({ pages })
    await ctl.load()
    assert.equal(await ctl.setPublished('a', true), true)
    assert.equal(state.pages.find(p => p.slug === 'a').published, true)
    assert.deepEqual(calls.successes, ['Página publicada'])
  })

  test('texto histórico: error de guardar con el permiso cirugias.editar y el borrador intacto', async () => {
    const { ctl, state } = setup({ pages: [], procedures: [proc({ recomendaciones_post: '<p>x</p>' })], over: { procedures: { updateProcedure: async () => { throw http(403) } } } })
    await ctl.load()
    await ctl.selectProcedure('abdominoplastia')
    const key = ctl.current().key
    ctl.draft(key).text = '<p>nuevo</p>'
    assert.equal(await ctl.save(key), false)
    assert.equal(state.errors[key].action, 'save')
    assert.match(state.errors[key].detail, /cirugias\.editar/)
    assert.equal(state.drafts[key].text, '<p>nuevo</p>')
  })

  test('crear y eliminar con error: título propio y la lista no cambia', async () => {
    const { ctl, state } = setup({ pages, confirmAnswer: true, over: { pages: { createPage: async () => { throw http(403) }, deletePage: async () => { throw http(500, 'Error interno') } } } })
    await ctl.load()
    await ctl.createGeneralPage()
    assert.equal(state.errors['create'].title, 'No se pudo crear la página')
    await ctl.deletePage('a')
    assert.equal(state.errors['page:a'].title, 'No se pudo eliminar la página')
    assert.equal(state.pages.length, 3)
  })
})

describe('proveedor y presentación', () => {
  test('el proveedor conserva código, mensaje y errores por campo del Hub', async () => {
    const body = { data: { message: 'Revisa los datos ingresados.', errors: { title: ['El título es obligatorio.'] } } }
    const provider = new HubRecommendationsProvider(async () => { throw Object.assign(new Error('fetch failed'), { statusCode: 422, data: body }) })
    await assert.rejects(() => provider.setPublished('x', true), e => e.statusCode === 422 && e.message === 'Revisa los datos ingresados.' && e.fieldErrors.title[0] === 'El título es obligatorio.')
  })

  test('la insignia sale de la acción y el aviso está junto a ella (no todo es «Error al guardar»)', () => {
    const editor = read('components/admin/recommendations/PageEditor.vue')
    assert.doesNotMatch(editor, /label="Error al guardar"/)
    assert.match(editor, /ACTION_BADGE\[error\.action\]/)
    assert.match(editor, /<AdminRecommendationsErrorNotice v-if="actionError"/)
    assert.match(read('components/admin/recommendations/SaveBar.vue'), /error\?\.action === 'save'/)
    assert.doesNotMatch(read('components/admin/recommendations/LegacyTextEditor.vue'), /label="Error al guardar"/)
  })

  test('una página sin contenido avisa ANTES de intentar publicar (con la razón visible)', () => {
    assert.match(read('components/admin/recommendations/PageEditor.vue'), /aún no tiene contenido guardado/)
  })
})
