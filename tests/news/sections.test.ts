// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Secciones de contenido de noticias (una o dos columnas): tabla de rutas permitidas del panel, contrato público, representación y edición.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from '../recommendations/harness.ts'
import { resolveNewsSectionRoute } from '../../shared/utils/newsSectionsApi.ts'
import { pickAllowed } from '../../shared/utils/recommendationAdminApi.ts'
import { visibleNewsSections } from '../../shared/utils/newsSections.ts'
import { fromPublicNewsSections, fromPublicPost } from '../../server/utils/news.ts'

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')

describe('proxy administrativo de secciones de noticias', () => {
  test('solo reenvía las rutas de la tabla y con ids numéricos válidos', () => {
    assert.equal(resolveNewsSectionRoute('GET', ['posts', '12'])?.hubPath, '/posts/12/sections')
    assert.equal(resolveNewsSectionRoute('POST', ['posts', '12'])?.hubPath, '/posts/12/sections')
    assert.equal(resolveNewsSectionRoute('POST', ['posts', '12', 'reorder'])?.hubPath, '/posts/12/sections/reorder')
    assert.equal(resolveNewsSectionRoute('GET', ['sections', '7'])?.hubPath, '/post-sections/7')
    assert.equal(resolveNewsSectionRoute('PUT', ['sections', '7'])?.hubPath, '/post-sections/7')
    assert.equal(resolveNewsSectionRoute('DELETE', ['sections', '7'])?.hubPath, '/post-sections/7')
    for (const bad of [['posts', 'abc'], ['posts', '0'], ['posts', '1', '2', '3'], ['procedures', '1'], ['sections']]) {
      assert.equal(resolveNewsSectionRoute('GET', bad), null, bad.join('/'))
    }
    // Sin imagen: la noticia no sube imágenes por sección; y ningún método fuera de la tabla.
    assert.equal(resolveNewsSectionRoute('POST', ['sections', '7', 'image']), null)
    assert.equal(resolveNewsSectionRoute('PATCH', ['sections', '7']), null)
  })

  test('el cuerpo solo admite título, distribución, los tres contenidos, orden y estado (nunca empresa ni línea)', () => {
    const route = resolveNewsSectionRoute('POST', ['posts', '3'])!
    const body = pickAllowed({ title: 'T', layout: 'two_columns', content: '<p>a</p>', content_left: '<p>i</p>', content_right: '<p>d</p>', orden: 2, visible: true, company_id: 9, linea_id: 9, created_by: 1, post_id: 99 }, route.body)
    assert.deepEqual(Object.keys(body).sort(), ['content', 'content_left', 'content_right', 'layout', 'orden', 'title', 'visible'])
  })

  test('un archivo de ruta por método delega en el manejador con sesión y origen antes de resolver la ruta', () => {
    for (const m of ['get', 'post', 'put', 'delete']) assert.match(read(`server/api/admin/news-sections/[...path].${m}.ts`), /handleNewsSectionsRequest\(event\)/)
    const util = read('server/utils/newsSections.ts')
    assert.ok(util.indexOf('await adminSession(event)') < util.indexOf('resolveNewsSectionRoute(String(event.method)'))
  })
})

describe('contrato público: secciones', () => {
  test('ausente o inválido => [] (Hub anterior y noticias antiguas)', () => {
    for (const v of [undefined, null, 'x', {}, 5]) assert.deepEqual(fromPublicNewsSections(v), [])
  })

  test('mapeo defensivo: distribución desconocida => una columna, vacías descartadas, sin confiar en tipos', () => {
    const out = fromPublicNewsSections([
      { orden: 1, title: 'A', layout: 'one_column', content: '<p>a</p>', content_left: null, content_right: null },
      { orden: 2, title: null, layout: 'two_columns', content: null, content_left: '<p>i</p>', content_right: '<p>d</p>' },
      { orden: 3, title: null, layout: 'three', content: '<p>c</p>' },
      { orden: 4, title: '', layout: 'two_columns', content_left: '<p></p>', content_right: '' },
      { orden: 5, title: null, layout: 'one_column', content: 42 },
      null, 7
    ])
    assert.deepEqual(out.map(s => [s.orden, s.layout]), [[1, 'one_column'], [2, 'two_columns'], [3, 'one_column']])
    assert.deepEqual([out[1].contentLeft, out[1].contentRight, out[1].content], ['<p>i</p>', '<p>d</p>', ''])
  })

  test('el detalle público conserva el cuerpo histórico y agrega `sections`; sin secciones queda []', () => {
    const base = { slug: 'una', title: 'T', excerpt: '<p>e</p>', content: '<p>Cuerpo antiguo</p>', cover_url: null, published_at: '2026-01-01T00:00:00Z', seo: {} }
    const old = fromPublicPost(base)
    assert.equal(old.content, '<p>Cuerpo antiguo</p>')
    assert.deepEqual(old.sections, [])
    const withSections = fromPublicPost({ ...base, secciones: [{ orden: 1, title: 'S', layout: 'one_column', content: '<p>x</p>' }] })
    assert.equal(withSections.sections.length, 1)
    assert.equal(withSections.content, '<p>Cuerpo antiguo</p>')
  })

  test('el servicio público reenvía el detalle tal cual (el tenant lo decide Hub) y la página las pinta debajo del cuerpo', () => {
    assert.match(read('server/utils/news.ts'), /sections: fromPublicNewsSections\(post\.secciones\)/)
    const page = read('pages/noticias/[slug].vue')
    assert.ok(page.indexOf('<NewsSections') > page.indexOf('<CommonRichContent'), 'las secciones van después del cuerpo')
    assert.ok(page.indexOf('<NewsSections') < page.indexOf('<NewsYouTubeEmbed'))
    assert.match(page, /:sections="article\.sections"/)
  })
})

describe('representación pública', () => {
  const comp = read('components/news/Sections.vue')

  test('una columna a todo el ancho y dos columnas con izquierda antes que derecha, apiladas en móvil', () => {
    assert.match(comp, /v-if="s\.layout === 'two_columns'"/)
    assert.match(comp, /grid grid-cols-1 md:grid-cols-2/)
    assert.ok(comp.indexOf(':html="s.contentLeft"') < comp.indexOf(':html="s.contentRight"'))
    assert.match(comp, /v-else :html="s\.content"/)
  })

  test('el HTML solo se pinta por CommonRichContent (lista blanca); el componente no usa v-html', () => {
    assert.doesNotMatch(comp, /v-html/)
    assert.match(read('components/common/RichContent.vue'), /sanitizeRichHtml/)
  })

  test('sin secciones no se pinta nada', () => {
    assert.match(comp, /v-if="visibleSections\.length"/)
  })

  test('orden, vacías y distribución activa: se muestra lo que Hub entregó y se descarta lo vacío', () => {
    const view = (o) => ({ title: null, layout: 'one_column', content: '', contentLeft: '', contentRight: '', ...o })
    const shown = visibleNewsSections([
      view({ title: 'Solo título' }),
      view({ content: '<p>uno</p>' }),
      view({ layout: 'two_columns', contentLeft: '<p>i</p>' }),
      view({ layout: 'two_columns', content: '<p>no cuenta</p>' }), // el contenido de una columna no cuenta en dos columnas
      view({ layout: 'one_column', contentLeft: '<p>no cuenta</p>' }),
      view({ content: '<p> </p>' })
    ])
    assert.equal(shown.length, 3)
    assert.deepEqual(visibleNewsSections(undefined), [])
    assert.deepEqual(visibleNewsSections([]), [])
  })
})

describe('editor administrativo', () => {
  const mgr = read('components/admin/news/SectionsManager.vue')
  const admin = read('pages/admin/noticias/[slug].vue')

  test('se monta fuera del formulario y solo con la noticia ya guardada (id de Hub)', () => {
    assert.match(admin, /<AdminNewsSectionsManager v-if="!isNew && articleId"/)
    assert.ok(admin.indexOf('</form>') < admin.indexOf('<AdminNewsSectionsManager'))
  })

  test('una columna muestra un editor; dos columnas, dos editores independientes (izquierda y derecha)', () => {
    assert.match(mgr, /v-if="draft\.layout === 'one_column'"[\s\S]*v-model="draft\.content"/)
    assert.match(mgr, /v-model="draft\.contentLeft"/)
    assert.match(mgr, /v-model="draft\.contentRight"/)
    assert.ok(mgr.indexOf('v-model="draft.contentLeft"') < mgr.indexOf('v-model="draft.contentRight"'))
  })

  test('cambiar de distribución no descarta contenido: se envían siempre los tres campos y se pide confirmación al reducir', () => {
    assert.match(mgr, /content: clean\(draft\.content\),\s*content_left: clean\(draft\.contentLeft\),\s*content_right: clean\(draft\.contentRight\)/)
    assert.match(mgr, /function setLayout[\s\S]*window\.confirm\(/)
    // Al pasar a una columna con texto en las columnas, el aviso explica que se conserva y no se publica.
    assert.match(mgr, /data-testid="news-kept-columns"/)
  })

  test('la edición solo habla con el proxy de Planmed (nunca con Hub) y sin company_id ni linea_id', () => {
    const provider = read('providers/HubNewsSectionsProvider.ts')
    assert.match(provider, /\/api\/admin\/news-sections/)
    const code = (mgr + provider).split(/\r?\n/).filter(l => !l.trim().startsWith('//')).join(' ')
    assert.doesNotMatch(code, /company_id|linea_id/)
  })

  test('los controles clicables tienen cursor de mano', () => {
    assert.ok((mgr.match(/cursor-pointer/g) ?? []).length >= 6)
  })
})
