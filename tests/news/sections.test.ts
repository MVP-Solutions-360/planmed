// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Secciones de contenido de noticias (una o dos columnas con bloques apilables): rutas permitidas del panel, contrato público, validación de
// enlaces, representación y edición.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from '../recommendations/harness.ts'
import { resolveNewsSectionRoute } from '../../shared/utils/newsSectionsApi.ts'
import { pickAllowed } from '../../shared/utils/recommendationAdminApi.ts'
import { visibleNewsSections, activeSlots } from '../../shared/utils/newsSections.ts'
import { parseEmbedUrl } from '../../shared/utils/embedUrl.ts'
import { fromPublicNewsSections, fromPublicPost } from '../../server/utils/news.ts'

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')
const YT = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
const IG = 'https://www.instagram.com/p/CxYz12AbCde/'

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
    assert.equal(resolveNewsSectionRoute('POST', ['sections', '7', 'image']), null) // la imagen es de un BLOQUE, no de la sección
    assert.equal(resolveNewsSectionRoute('PATCH', ['sections', '7']), null)
  })

  test('imagen de un bloque: solo subir o quitar, con la ruta del bloque', () => {
    const up = resolveNewsSectionRoute('POST', ['blocks', '15', 'image'])!
    assert.equal(up.hubPath, '/post-section-blocks/15/image')
    assert.equal(up.upload, true)
    assert.equal(resolveNewsSectionRoute('DELETE', ['blocks', '15', 'image'])?.hubPath, '/post-section-blocks/15/image')
    assert.equal(resolveNewsSectionRoute('GET', ['blocks', '15', 'image']), null)
    assert.equal(resolveNewsSectionRoute('PUT', ['blocks', '15']), null)
  })

  test('el cuerpo solo admite título, distribución, orden, estado y los campos de cada bloque (nunca empresa ni línea, tampoco anidados)', () => {
    const route = resolveNewsSectionRoute('POST', ['posts', '3'])!
    const body = pickAllowed({
      title: 'T', layout: 'two_columns', orden: 2, visible: true, company_id: 9, linea_id: 9, created_by: 1, post_id: 99,
      blocks: [{ id: 4, slot: 'left', type: 'text', content: '<p>a</p>', url: null, alt: null, company_id: 9, linea_id: 9, section_id: 77, created_by: 1 }, 'basura']
    }, route.body)
    assert.deepEqual(Object.keys(body).sort(), ['blocks', 'layout', 'orden', 'title', 'visible'])
    assert.deepEqual(body.blocks[0], { id: 4, slot: 'left', type: 'text', content: '<p>a</p>', url: null, alt: null })
    assert.equal(body.blocks[1], 'basura') // Hub lo rechaza con 422; Planmed no lo inventa ni lo deja pasar como objeto
  })

  test('un archivo de ruta por método delega en el manejador con sesión y origen antes de resolver la ruta', () => {
    for (const m of ['get', 'post', 'put', 'delete']) assert.match(read(`server/api/admin/news-sections/[...path].${m}.ts`), /handleNewsSectionsRequest\(event\)/)
    const util = read('server/utils/newsSections.ts')
    assert.ok(util.indexOf('await adminSession(event)') < util.indexOf('resolveNewsSectionRoute(String(event.method)'))
  })
})

describe('validación de enlaces (YouTube e Instagram)', () => {
  test('acepta las formas habituales y devuelve la URL canónica', () => {
    for (const u of [YT, 'https://youtu.be/dQw4w9WgXcQ', 'https://youtube.com/embed/dQw4w9WgXcQ', 'http://m.youtube.com/watch?v=dQw4w9WgXcQ&t=5s', 'https://www.youtube.com/shorts/dQw4w9WgXcQ']) {
      assert.deepEqual(parseEmbedUrl(u), { platform: 'youtube', id: 'dQw4w9WgXcQ', url: YT }, u)
    }
    assert.deepEqual(parseEmbedUrl('https://instagram.com/reel/CxYz12AbCde/?igsh=x'), { platform: 'instagram', id: 'CxYz12AbCde', url: 'https://www.instagram.com/reel/CxYz12AbCde/' })
    assert.equal(parseEmbedUrl(IG)?.url, IG)
  })

  test('rechaza hosts ajenos, esquemas peligrosos, credenciales, puertos raros, HTML y espacios', () => {
    for (const bad of [
      'https://evil.com/watch?v=dQw4w9WgXcQ', 'https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ', 'https://evilyoutube.com/watch?v=dQw4w9WgXcQ',
      'javascript:alert(1)', 'data:text/html,<script>1</script>', 'ftp://youtube.com/watch?v=dQw4w9WgXcQ', 'http://user:pw@youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtube.com:8443/watch?v=dQw4w9WgXcQ', '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>', ' https://www.youtube.com/watch?v=dQw4w9WgXcQ extra',
      'https://www.youtube.com/watch?v=corto', 'https://www.youtube.com/', 'https://www.instagram.com/someuser/', 'https://www.instagram.com/p/', '', null, undefined, 5
    ]) {
      assert.equal(parseEmbedUrl(bad), null, String(bad))
    }
  })
})

describe('contrato público: secciones con bloques', () => {
  test('ausente o inválido => [] (Hub anterior y noticias antiguas)', () => {
    for (const v of [undefined, null, 'x', {}, 5]) assert.deepEqual(fromPublicNewsSections(v), [])
  })

  test('mapeo defensivo de bloques: re-valida enlaces, descarta imágenes sin URL absoluta y ordena por columna', () => {
    const out = fromPublicNewsSections([
      { orden: 1, title: 'A', layout: 'two_columns', blocks: {
        main: [{ type: 'text', html: '<p>no se muestra</p>' }],
        left: [{ type: 'text', html: '<p>i</p>' }, { type: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ', embed_url: 'https://evil.com/x' }, { type: 'youtube', url: 'https://evil.com/watch?v=dQw4w9WgXcQ' }],
        right: [{ type: 'image', url: 'javascript:1', alt: 'x' }, { type: 'image', url: '/storage/a.jpg', alt: 'rel' }, { type: 'image', url: 'https://cdn.test/a.jpg', alt: 'ok' }, { type: 'instagram', url: IG }, { type: 'instagram', url: YT }, { type: 'text', html: '<p></p>' }, { type: 'otro' }, null]
      } },
      { orden: 2, title: null, layout: 'otra', blocks: { main: [{ type: 'text', html: '<p>u</p>' }], left: [], right: [] } },
      { orden: 3, title: null, layout: 'one_column', blocks: { main: [], left: [], right: [] } }, // sin título ni bloques => se descarta
      null, 7
    ])
    assert.equal(out.length, 2)
    assert.deepEqual(out[0].blocks.main, []) // en dos columnas la columna única no se publica
    assert.deepEqual(out[0].blocks.left, [{ type: 'text', html: '<p>i</p>' }, { type: 'youtube', url: YT }])
    assert.deepEqual(out[0].blocks.right, [{ type: 'image', url: 'https://cdn.test/a.jpg', alt: 'ok' }, { type: 'instagram', url: IG }])
    assert.equal(out[1].layout, 'one_column') // distribución desconocida => una columna
    assert.deepEqual(out[1].blocks.main, [{ type: 'text', html: '<p>u</p>' }])
  })

  test('un Hub anterior (sin `blocks`) se adapta desde sus campos de texto antiguos', () => {
    const out = fromPublicNewsSections([
      { orden: 1, title: null, layout: 'two_columns', content: null, content_left: '<p>I</p>', content_right: '<p>D</p>' },
      { orden: 2, title: null, layout: 'one_column', content: '<p>U</p>', content_left: null, content_right: null }
    ])
    assert.deepEqual(out[0].blocks.left, [{ type: 'text', html: '<p>I</p>' }])
    assert.deepEqual(out[0].blocks.right, [{ type: 'text', html: '<p>D</p>' }])
    assert.deepEqual(out[1].blocks.main, [{ type: 'text', html: '<p>U</p>' }])
  })

  test('el detalle público conserva el cuerpo histórico y agrega `sections`; sin secciones queda []', () => {
    const base = { slug: 'una', title: 'T', excerpt: '<p>e</p>', content: '<p>Cuerpo antiguo</p>', cover_url: null, published_at: '2026-01-01T00:00:00Z', seo: {} }
    const old = fromPublicPost(base)
    assert.equal(old.content, '<p>Cuerpo antiguo</p>')
    assert.deepEqual(old.sections, [])
    const withSections = fromPublicPost({ ...base, secciones: [{ orden: 1, title: 'S', layout: 'one_column', blocks: { main: [{ type: 'text', html: '<p>x</p>' }], left: [], right: [] } }] })
    assert.equal(withSections.sections.length, 1)
    assert.equal(withSections.content, '<p>Cuerpo antiguo</p>')
  })

  test('la página las pinta debajo del cuerpo y antes de los embeds de la noticia', () => {
    assert.match(read('server/utils/news.ts'), /sections: fromPublicNewsSections\(post\.secciones\)/)
    const page = read('pages/noticias/[slug].vue')
    assert.ok(page.indexOf('<NewsSections') > page.indexOf('<CommonRichContent'), 'las secciones van después del cuerpo')
    assert.ok(page.indexOf('<NewsSections') < page.indexOf('<NewsYouTubeEmbed'))
    assert.match(page, /:sections="article\.sections"/)
  })
})

describe('representación pública', () => {
  const comp = read('components/news/Sections.vue')
  const blocks = read('components/content/Blocks.vue')

  test('una columna a todo el ancho y dos columnas con izquierda antes que derecha, apiladas en móvil', () => {
    assert.match(comp, /v-if="s\.layout === 'two_columns'"/)
    assert.match(comp, /grid grid-cols-1 md:grid-cols-2/)
    assert.ok(comp.indexOf(':blocks="s.blocks.left"') < comp.indexOf(':blocks="s.blocks.right"'))
    assert.match(comp, /v-else :blocks="s\.blocks\.main"/)
  })

  test('cada tipo de bloque tiene su representación y los enlaces solo llegan validados', () => {
    assert.match(blocks, /b\.type === 'text'[^>]*:html="b\.html"/)
    assert.match(blocks, /b\.type === 'image'[^>]*:src="b\.url"[^>]*:alt="b\.alt"[^>]*loading="lazy"/)
    assert.match(blocks, /<NewsYouTubeEmbed v-else-if="b\.type === 'youtube'" :url="b\.url"/)
    assert.match(blocks, /<NewsInstagramEmbed v-else-if="b\.type === 'instagram'" :url="b\.url"/)
  })

  test('el HTML solo se pinta por CommonRichContent (lista blanca); ningún componente usa v-html', () => {
    assert.doesNotMatch(comp + blocks, /v-html/)
    assert.match(read('components/common/RichContent.vue'), /sanitizeRichHtml/)
  })

  test('sin secciones no se pinta nada', () => {
    assert.match(comp, /v-if="visibleSections\.length"/)
  })

  test('orden, vacías y distribución activa: se muestra lo que Hub entregó y se descarta lo vacío', () => {
    const view = (o) => ({ title: null, layout: 'one_column', blocks: { main: [], left: [], right: [] }, ...o })
    const b = [{ type: 'text', html: '<p>x</p>' }]
    const shown = visibleNewsSections([
      view({ title: 'Solo título' }),
      view({ blocks: { main: b, left: [], right: [] } }),
      view({ layout: 'two_columns', blocks: { main: [], left: b, right: [] } }),
      view({ layout: 'two_columns', blocks: { main: b, left: [], right: [] } }), // la columna única no cuenta en dos columnas
      view({ layout: 'one_column', blocks: { main: [], left: b, right: [] } }), // las columnas no cuentan en una
      view({})
    ])
    assert.equal(shown.length, 3)
    assert.deepEqual(visibleNewsSections(undefined), [])
    assert.deepEqual(activeSlots('two_columns'), ['left', 'right'])
    assert.deepEqual(activeSlots('one_column'), ['main'])
  })
})

describe('editor administrativo', () => {
  const mgr = read('components/admin/news/SectionsManager.vue')
  const editor = read('components/admin/content/BlocksEditor.vue')
  const util = read('shared/utils/contentBlocks.ts')
  const admin = read('pages/admin/noticias/[slug].vue')
  const provider = read('providers/HubNewsSectionsProvider.ts')

  test('se monta fuera del formulario y solo con la noticia ya guardada (id de Hub)', () => {
    assert.match(admin, /<AdminNewsSectionsManager v-if="!isNew && articleId"/)
    assert.ok(admin.indexOf('</form>') < admin.indexOf('<AdminNewsSectionsManager'))
    assert.match(mgr, /<AdminContentBlocksEditor v-model:layout="draft\.layout" :blocks="draft\.blocks"/)
  })

  test('cada columna activa apila bloques de los cuatro tipos y se pueden agregar, ordenar, mover de columna y quitar', () => {
    assert.match(util, /export const BLOCK_TYPES: readonly BlockType\[\] = \['text', 'image', 'youtube', 'instagram'\]/)
    assert.match(editor, /v-for="slot in slots"/)
    for (const fn of ['addBlock', 'removeBlock', 'moveBlock', 'moveToOtherSlot']) assert.match(editor, new RegExp(`function ${fn}\\(`))
    assert.match(editor, /<AdminRichTextEditor v-if="b\.type === 'text'"/)
    assert.match(editor, /type="file" accept="image\/png,image\/jpeg,image\/webp"/)
    assert.match(util, /parseEmbedUrl\(b\.url\)\?\.platform === b\.type/)
  })

  test('cambiar de distribución no descarta bloques: se envían SIEMPRE los de ambas columnas y se pide confirmación al reducir', () => {
    assert.match(util, /for \(const slot of SLOT_ORDER\)[\s\S]*blocks\.filter\(x => x\.slot === slot\)/) // recorre todas las columnas, no solo las activas
    assert.match(editor, /function setLayout[\s\S]*window\.confirm\(/)
    assert.match(editor, /data-testid="blocks-kept-columns"/)
  })

  test('las secciones del formato anterior se editan como bloques de texto y se avisa de la conversión', () => {
    assert.match(mgr, /if \(hasText\(s\.content\)\) out\.push\(newDraftBlock\('main', 'text'/)
    assert.match(mgr, /data-testid="news-legacy-notice"/)
  })

  test('las imágenes se suben aparte con el id del bloque que devuelve Hub; el orden de envío coincide con el de Hub (por columna)', () => {
    assert.match(util, /export const SLOT_ORDER: readonly BlockSlot\[\] = \['left', 'main', 'right'\]/)
    assert.match(mgr, /api\.setBlockImage\(id, b\.newImage\)/)
    assert.match(provider, /\/blocks\/\$\{blockId\}\/image/)
  })

  test('la edición solo habla con el proxy de Planmed (nunca con Hub) y sin company_id ni linea_id', () => {
    assert.match(provider, /\/api\/admin\/news-sections/)
    const code = (mgr + editor + provider).split(/\r?\n/).filter(l => !l.trim().startsWith('//')).join(' ')
    assert.doesNotMatch(code, /company_id|linea_id/)
  })

  test('los controles clicables tienen cursor de mano', () => {
    assert.ok(((mgr + editor).match(/cursor-pointer/g) ?? []).length >= 6)
  })
})
