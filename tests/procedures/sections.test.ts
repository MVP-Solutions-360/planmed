// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Secciones de procedimientos por línea (una o dos columnas con bloques apilables): rutas permitidas del panel, mapeo defensivo del contrato público
// (incluido el formato anterior) y representación.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from '../recommendations/harness.ts'
import { resolveProcedureSectionRoute } from '../../shared/utils/procedureSectionsApi.ts'
import { pickAllowed } from '../../shared/utils/recommendationAdminApi.ts'
import { buildBlockInputs, newDraftBlock, blockHasData, countBlocks, activeSlots, SLOT_ORDER } from '../../shared/utils/contentBlocks.ts'
import { fromPublicSections } from '../../server/utils/procedures.ts'

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')
const YT = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
const IG = 'https://www.instagram.com/p/CxYz12AbCde/'

describe('proxy administrativo de secciones', () => {
  test('solo reenvía las rutas de la tabla y con ids numéricos válidos', () => {
    assert.equal(resolveProcedureSectionRoute('GET', ['procedures', '12'])?.hubPath, '/procedures/12/sections')
    assert.equal(resolveProcedureSectionRoute('POST', ['procedures', '12', 'reorder'])?.hubPath, '/procedures/12/sections/reorder')
    assert.equal(resolveProcedureSectionRoute('PUT', ['sections', '7'])?.hubPath, '/procedure-sections/7')
    assert.equal(resolveProcedureSectionRoute('POST', ['sections', '7', 'image'])?.upload, true) // imagen del formato anterior
    assert.equal(resolveProcedureSectionRoute('DELETE', ['sections', '7', 'image'])?.hubPath, '/procedure-sections/7/image')
    for (const bad of [['procedures', 'abc'], ['procedures', '0'], ['procedures', '1', '2', '3'], ['recommendation-sections', '1'], ['sections']]) {
      assert.equal(resolveProcedureSectionRoute('GET', bad), null, bad.join('/'))
    }
    assert.equal(resolveProcedureSectionRoute('PATCH', ['sections', '7']), null)
  })

  test('imagen de un bloque: solo subir o quitar, con la ruta del bloque', () => {
    const up = resolveProcedureSectionRoute('POST', ['blocks', '15', 'image'])!
    assert.equal(up.hubPath, '/procedure-section-blocks/15/image')
    assert.equal(up.upload, true)
    assert.equal(resolveProcedureSectionRoute('DELETE', ['blocks', '15', 'image'])?.hubPath, '/procedure-section-blocks/15/image')
    assert.equal(resolveProcedureSectionRoute('GET', ['blocks', '15', 'image']), null)
    assert.equal(resolveProcedureSectionRoute('PUT', ['blocks', '15']), null)
  })

  test('el cuerpo solo admite título, texto, posición, distribución, orden, estado y los campos de cada bloque (nunca empresa ni línea, tampoco anidados)', () => {
    const route = resolveProcedureSectionRoute('POST', ['procedures', '3'])!
    const body = pickAllowed({
      title: 'T', content: '<p>x</p>', layout: 'media_right', column_layout: 'two_columns', orden: 2, visible: true, company_id: 9, linea_id: 9, created_by: 1, cirugia_id: 99,
      blocks: [{ id: 4, slot: 'left', type: 'image', alt: 'a', from_section_image: true, company_id: 9, linea_id: 9, section_id: 77 }]
    }, route.body)
    assert.deepEqual(Object.keys(body).sort(), ['blocks', 'column_layout', 'content', 'layout', 'orden', 'title', 'visible'])
    assert.deepEqual(body.blocks[0], { id: 4, slot: 'left', type: 'image', alt: 'a', from_section_image: true })
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

  test('con bloques: se re-validan (enlaces, imágenes) y solo cuenta la distribución activa', () => {
    const [s] = fromPublicSections([{
      orden: 1, title: 'A', content: '', layout: 'media_left', image: null, column_layout: 'two_columns',
      blocks: {
        main: [{ type: 'text', html: '<p>no se muestra</p>' }],
        left: [{ type: 'text', html: '<p>i</p>' }, { type: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ', embed_url: 'https://evil.com' }, { type: 'youtube', url: 'https://evil.com/watch?v=dQw4w9WgXcQ' }],
        right: [{ type: 'image', url: 'javascript:1', alt: '' }, { type: 'image', url: '/rel.jpg', alt: '' }, { type: 'image', url: 'https://cdn.test/a.jpg', alt: 'ok' }, { type: 'instagram', url: IG }, { type: 'instagram', url: YT }]
      }
    }])
    assert.equal(s.columnLayout, 'two_columns')
    assert.deepEqual(s.blocks.main, [])
    assert.deepEqual(s.blocks.left, [{ type: 'text', html: '<p>i</p>' }, { type: 'youtube', url: YT }])
    assert.deepEqual(s.blocks.right, [{ type: 'image', url: 'https://cdn.test/a.jpg', alt: 'ok' }, { type: 'instagram', url: IG }])
  })

  test('formato anterior (Hub sin `blocks`): imagen + texto => dos columnas según la posición; solo texto o solo imagen => una columna; vacías descartadas', () => {
    const out = fromPublicSections([
      { orden: 1, title: 'A', content: '<p>a</p>', layout: 'media_right', image: { url: 'https://cdn.test/a.jpg' } },
      { orden: 2, title: null, content: '<p>b</p>', layout: 'stacked', image: { url: 'javascript:alert(1)' } },
      { orden: 3, title: null, content: '', layout: 'media_left', image: { url: 'https://cdn.test/c.jpg' } },
      { orden: 4, title: null, content: '<p>d</p>', layout: 'media_left', image: { url: 'https://cdn.test/d.jpg' } },
      { orden: 5, title: '', content: '', layout: 'media_left', image: null },
      null, 7
    ])
    const types = (s) => ({ col: s.columnLayout, main: s.blocks.main.map(b => b.type), left: s.blocks.left.map(b => b.type), right: s.blocks.right.map(b => b.type) })
    assert.equal(out.length, 4)
    assert.deepEqual(types(out[0]), { col: 'two_columns', main: [], left: ['text'], right: ['image'] }) // media_right: texto a la izquierda
    assert.deepEqual(types(out[1]), { col: 'one_column', main: ['text'], left: [], right: [] }) // la imagen javascript: se descarta
    assert.deepEqual(types(out[2]), { col: 'one_column', main: ['image'], left: [], right: [] })
    assert.deepEqual(types(out[3]), { col: 'two_columns', main: [], left: ['image'], right: ['text'] }) // media_left: imagen a la izquierda
    assert.equal(out[1].layout, 'media_left') // posición desconocida => izquierda
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

  test('una columna a todo el ancho y dos columnas con izquierda antes que derecha, apiladas en móvil', () => {
    assert.match(comp, /v-if="s\.columnLayout === 'two_columns'"/)
    assert.match(comp, /grid grid-cols-1 md:grid-cols-2/)
    assert.ok(comp.indexOf(':blocks="s.blocks.left"') < comp.indexOf(':blocks="s.blocks.right"'))
    assert.match(comp, /v-else :blocks="s\.blocks\.main"/)
    assert.doesNotMatch(comp, /v-html/)
  })

  test('sin secciones no se pinta nada', () => {
    assert.match(comp, /v-if="visibleSections\.length"/)
  })

  test('utilidades de bloques: orden de columnas, distribución activa y conteo', () => {
    assert.deepEqual(activeSlots('two_columns'), ['left', 'right'])
    assert.deepEqual(activeSlots('one_column'), ['main'])
    assert.deepEqual([...SLOT_ORDER], ['left', 'main', 'right'])
    const b = [{ type: 'text', html: '<p>x</p>' }]
    assert.equal(countBlocks({ main: b, left: [], right: [] }, 'two_columns'), 0)
    assert.equal(countBlocks({ main: b, left: [], right: b }, 'two_columns'), 1)
  })

  test('el panel lo monta fuera del formulario y los maestros solo escriben si están habilitados', () => {
    const admin = read('pages/admin/procedimientos/[slug].vue')
    assert.match(admin, /<AdminProceduresSectionsManager/)
    assert.match(admin, /:can-write="!form\.isMaster \|\| savedActivo"/)
    assert.ok(admin.indexOf('</form>') < admin.indexOf('<AdminProceduresSectionsManager'))
  })
})

describe('editor administrativo de procedimientos', () => {
  const mgr = read('components/admin/procedures/SectionsManager.vue')

  test('usa el editor de bloques compartido y envía la distribución y la lista completa de bloques', () => {
    assert.match(mgr, /<AdminContentBlocksEditor v-model:layout="draft\.layout" :blocks="draft\.blocks"/)
    assert.match(mgr, /column_layout: draft\.layout/)
    assert.match(mgr, /blocks: built\.inputs/)
    assert.match(mgr, /api\.setBlockImage\(id, b\.newImage\)/)
  })

  test('una sección del formato anterior se edita como bloques: su imagen se COPIA (from_section_image) y se avisa de la conversión', () => {
    assert.match(mgr, /fromSectionImage: true/)
    assert.match(mgr, /data-testid="section-legacy-notice"/)
    assert.match(mgr, /const imageFirst = s\.layout !== 'media_right'/)
    // En el borrador: la copia viaja como from_section_image solo si el bloque es nuevo y sigue sin imagen propia.
    const img = newDraftBlock('left', 'image', { imageUrl: 'https://cdn.test/a.jpg', fromSectionImage: true })
    const { inputs, error } = buildBlockInputs([img], ['left', 'right'])
    assert.equal(error, null)
    assert.deepEqual(inputs, [{ slot: 'left', type: 'image', content: null, url: null, alt: null, from_section_image: true }])
    const saved = newDraftBlock('left', 'image', { id: 5, imageUrl: 'https://cdn.test/a.jpg', fromSectionImage: true })
    assert.equal(buildBlockInputs([saved], ['left']).inputs[0].from_section_image, undefined) // un bloque ya guardado nunca pide copia
  })

  test('validación del borrador: bloques vacíos o inválidos de la columna activa son error; en la inactiva se descartan; se envían ambas columnas', () => {
    const text = newDraftBlock('main', 'text', { content: '<p>ok</p>' })
    const emptyActive = newDraftBlock('main', 'text', { content: '<p> </p>' })
    const emptyHidden = newDraftBlock('left', 'text', { content: '' })
    const hiddenOk = newDraftBlock('left', 'youtube', { url: YT })
    assert.match(buildBlockInputs([text, emptyActive], ['main']).error, /texto vacío/)
    const ok = buildBlockInputs([text, emptyHidden, hiddenOk], ['main'])
    assert.equal(ok.error, null)
    assert.deepEqual(ok.inputs.map(i => [i.slot, i.type]), [['left', 'youtube'], ['main', 'text']]) // orden de Hub (por columna) y la columna inactiva se conserva
    assert.match(buildBlockInputs([newDraftBlock('main', 'instagram', { url: YT })], ['main']).error, /Instagram/)
    assert.match(buildBlockInputs([newDraftBlock('main', 'image')], ['main']).error, /sin imagen/)
    assert.equal(blockHasData(newDraftBlock('main', 'image', { newImage: 'data:image/png;base64,AAAA' })), true)
  })

  test('los controles clicables tienen cursor de mano y no se envían company_id ni linea_id', () => {
    const code = mgr.split(/\r?\n/).filter(l => !l.trim().startsWith('//')).join(' ')
    assert.ok((mgr.match(/cursor-pointer/g) ?? []).length >= 6)
    assert.doesNotMatch(code, /company_id|linea_id/)
  })
})
