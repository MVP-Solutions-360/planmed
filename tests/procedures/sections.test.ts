// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Secciones de procedimientos por línea: tabla de rutas permitidas del panel, mapeo defensivo del contrato público y representación.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from '../recommendations/harness.ts'
import { resolveProcedureSectionRoute } from '../../shared/utils/procedureSectionsApi.ts'
import { pickAllowed } from '../../shared/utils/recommendationAdminApi.ts'
import { fromPublicSections } from '../../server/utils/procedures.ts'

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')

describe('proxy administrativo de secciones', () => {
  test('solo reenvía las rutas de la tabla y con ids numéricos válidos', () => {
    assert.equal(resolveProcedureSectionRoute('GET', ['procedures', '12'])?.hubPath, '/procedures/12/sections')
    assert.equal(resolveProcedureSectionRoute('POST', ['procedures', '12', 'reorder'])?.hubPath, '/procedures/12/sections/reorder')
    assert.equal(resolveProcedureSectionRoute('PUT', ['sections', '7'])?.hubPath, '/procedure-sections/7')
    assert.equal(resolveProcedureSectionRoute('POST', ['sections', '7', 'image'])?.upload, true)
    assert.equal(resolveProcedureSectionRoute('DELETE', ['sections', '7', 'image'])?.hubPath, '/procedure-sections/7/image')
    for (const bad of [['procedures', 'abc'], ['procedures', '0'], ['procedures', '1', '2', '3'], ['recommendation-sections', '1'], ['sections']]) {
      assert.equal(resolveProcedureSectionRoute('GET', bad), null, bad.join('/'))
    }
    assert.equal(resolveProcedureSectionRoute('PATCH', ['sections', '7']), null)
  })

  test('el cuerpo solo admite título, contenido, posición, orden y estado (nunca empresa ni línea)', () => {
    const route = resolveProcedureSectionRoute('POST', ['procedures', '3'])!
    const body = pickAllowed({ title: 'T', content: '<p>x</p>', layout: 'media_right', orden: 2, visible: true, company_id: 9, linea_id: 9, created_by: 1, cirugia_id: 99 }, route.body)
    assert.deepEqual(Object.keys(body).sort(), ['content', 'layout', 'orden', 'title', 'visible'])
  })

  test('un archivo de ruta por método delega en el manejador con sesión y origen antes de resolver la ruta', () => {
    for (const m of ['get', 'post', 'put', 'delete']) assert.match(read(`server/api/admin/procedure-sections/[...path].${m}.ts`), /handleProcedureSectionsRequest\(event\)/)
    const util = read('server/utils/procedureSections.ts')
    assert.ok(util.indexOf('await adminSession(event)') < util.indexOf('resolveProcedureSectionRoute(String(event.method)'))
  })
})

describe('contrato público: secciones', () => {
  test('ausente o inválido => [] (Hub anterior y procedimientos históricos)', () => {
    for (const v of [undefined, null, 'x', {}, 5]) assert.deepEqual(fromPublicSections(v), [])
  })

  test('mapeo defensivo: posición desconocida => izquierda, imagen solo http(s), vacías descartadas', () => {
    const out = fromPublicSections([
      { orden: 1, title: 'A', content: '<p>a</p>', layout: 'media_right', image: { url: 'https://cdn.test/a.jpg' } },
      { orden: 2, title: null, content: '<p>b</p>', layout: 'stacked', image: { url: 'javascript:alert(1)' } },
      { orden: 3, title: '', content: '', layout: 'media_left', image: null },
      null, 7
    ])
    assert.equal(out.length, 2)
    assert.deepEqual([out[0].layout, out[0].image?.url], ['media_right', 'https://cdn.test/a.jpg'])
    assert.deepEqual([out[1].layout, out[1].image], ['media_left', null])
  })

  test('el detalle público trae `secciones` y la página las pinta debajo del contenido actual', () => {
    assert.match(read('server/utils/procedures.ts'), /secciones: fromPublicSections\(d\.secciones\)/)
    const page = read('pages/procedimientos/[slug].vue')
    assert.ok(page.indexOf('<ProcedureSections') > page.indexOf('IMAGEN EN PRODUCCIÓN'), 'las secciones van después de la ficha y su imagen')
    assert.match(page, /:sections="procedure\.secciones"/)
  })
})

describe('representación', () => {
  const comp = read('components/procedure/ProcedureSections.vue')
  test('imagen a izquierda o derecha en dos columnas desde md; apilada en móvil; sin imagen, una columna sin hueco', () => {
    assert.match(comp, /md:grid-cols-\[minmax\(0,2fr\)_minmax\(0,3fr\)\]/)
    assert.match(comp, /s\.layout === 'media_right' \? 'md:order-2'/)
    assert.match(comp, /v-else-if="hasText\(s\.content\)"/)
    assert.match(comp, /v-if="s\.image && hasText\(s\.content\)"/)
  })
  test('sin secciones no se pinta nada', () => {
    assert.match(comp, /v-if="visibleSections\.length"/)
  })
  test('el panel lo monta fuera del formulario y los maestros solo escriben si están habilitados', () => {
    const admin = read('pages/admin/procedimientos/[slug].vue')
    assert.match(admin, /<AdminProceduresSectionsManager/)
    assert.match(admin, /:can-write="!form\.isMaster \|\| savedActivo"/)
    assert.ok(admin.indexOf('</form>') < admin.indexOf('<AdminProceduresSectionsManager'))
  })
})
