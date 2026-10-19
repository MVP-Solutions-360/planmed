// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Árbol de Recomendaciones (shared/utils/recommendationTree.ts): mapeo del contrato real del Hub, validación de URLs y vídeos,
// presentación de cada tipo de sección, SEO y compatibilidad de rutas antiguas.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from './harness.ts'

const t = await import(pathToFileURL(join(ROOT, 'shared/utils/recommendationTree.ts')).href)

// ── Datos con la forma real del Hub ────────────────────────────────────────────────────────────────────────────────────────────
const sub = (slug, over = {}) => ({ slug, grupo: 'cuidados', menu_label: `Menú ${slug}`, title: `Título ${slug}`, orden: 1, path: null, short_url: null, ...over })
const topic = (slug, subtopics, over = {}) => ({ slug, menu_label: `Tema ${slug}`, title: `Título del tema ${slug}`, orden: 1, path: null, subtopics, ...over })
const embed = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
const section = (type, over = {}) => ({ type, orden: 1, title: `Sección ${type}`, subtitle: null, content: '', layout: 'stacked', image: null, video: null, cta: null, items: [], ...over })
const page = (over = {}) => ({
  ...sub('abdominoplastia', { path: '/recomendaciones/abdominoplastia', short_url: 'http://go.test/abc12345' }),
  topic: { slug: 'cuidados-de-cirugias', title: 'Cuidados de cirugías', menu_label: 'Cuidados' },
  intro: { content: '<p>Introducción</p>', image: null, video: null },
  sections: [],
  ...over
})

describe('menú: lista de temas y subtemas', () => {
  test('varios temas con varios subtemas, en el orden que entrega el Hub, sin ids ni empresa', () => {
    const tree = t.fromPublicTopics([
      topic('uno', [sub('a'), sub('b')], { orden: 2 }),
      topic('dos', [sub('c')], { orden: 1 })
    ])
    assert.deepEqual(tree.map(x => x.slug), ['uno', 'dos'], 'no se reordena: manda el orden de la API')
    assert.deepEqual(tree[0].subtopics.map(s => s.slug), ['a', 'b'])
    assert.deepEqual(Object.keys(tree[0]), ['slug', 'menuLabel', 'title', 'order', 'subtopics'])
    assert.deepEqual(Object.keys(tree[0].subtopics[0]), ['slug', 'group', 'menuLabel', 'title', 'order', 'shortUrl'])
    assert.equal(JSON.stringify(tree).includes('company'), false)
  })

  test('un tema sin subtemas (o con subtemas inutilizables) no se muestra', () => {
    const tree = t.fromPublicTopics([topic('vacio', []), topic('malos', [{ slug: 'Mal Slug', title: 'x' }, { title: 'sin slug' }, null]), topic('bien', [sub('a')])])
    assert.deepEqual(tree.map(x => x.slug), ['bien'])
  })

  test('sin duplicados: un subtema no aparece dos veces ni en dos temas, y un tema repetido se ignora', () => {
    const tree = t.fromPublicTopics([topic('uno', [sub('a'), sub('a')]), topic('dos', [sub('a'), sub('b')]), topic('uno', [sub('z')])])
    assert.deepEqual(tree.map(x => [x.slug, x.subtopics.map(s => s.slug)]), [['uno', ['a']], ['dos', ['b']]])
  })

  test('sin enlaces ni etiquetas vacías: sin slug válido o sin texto la entrada se descarta', () => {
    const tree = t.fromPublicTopics([topic('', [sub('a')]), topic('sin-texto', [sub('a')], { title: '  ', menu_label: '' }), topic('ok', [sub('b', { menu_label: '', title: 'Solo título' }), sub('c', { menu_label: '', title: '' })])])
    assert.deepEqual(tree.map(x => x.slug), ['ok'])
    assert.deepEqual(tree[0].subtopics.map(s => [s.slug, s.menuLabel]), [['b', 'Solo título']])
  })

  test('cualquier respuesta fuera de contrato produce una lista vacía, no un error', () => {
    for (const bad of [null, undefined, {}, 'x', 12, [null, 3, 'a']]) assert.deepEqual(t.fromPublicTopics(bad), [])
  })

  test('el enlace corto solo se conserva si es una URL http(s) válida', () => {
    const tree = t.fromPublicTopics([topic('uno', [sub('a', { short_url: 'javascript:alert(1)' }), sub('b', { short_url: 'https://go.example.com/xyz' })])])
    assert.deepEqual(tree[0].subtopics.map(s => s.shortUrl), [null, 'https://go.example.com/xyz'])
  })
})

describe('rutas jerárquicas (nunca se usa el campo `path` del Hub)', () => {
  test('se construyen con los slugs del tema y del subtema', () => {
    assert.equal(t.topicPath('cuidados'), '/recomendaciones/cuidados')
    assert.equal(t.subtopicPath('tema', 'sub'), '/recomendaciones/tema/sub')
    const found = t.findSubtopicOwner(t.fromPublicTopics([topic('uno', [sub('a')]), topic('dos', [sub('b')])]), 'b')
    assert.equal(found.slug, 'dos')
  })
})

describe('imágenes, vídeos y botones: seguridad de las URLs', () => {
  test('imagen: solo http(s) sin credenciales', () => {
    for (const ok of ['https://cdn.example.com/a.jpg', 'http://127.0.0.1:8000/storage/a.png']) assert.equal(t.safeHttpUrl(ok), ok)
    for (const bad of ['javascript:alert(1)', 'data:image/png;base64,AAAA', 'file:///etc/passwd', '//cdn.example.com/a.jpg', '/a.jpg', 'https://user:pass@host.com/a.jpg', 'https://host.com/a b.jpg', '', null, 7]) {
      assert.equal(t.safeHttpUrl(bad), null, String(bad))
    }
  })

  test('botón: https, mailto:, tel: o ruta interna; nunca http, javascript:, data:, //host ni credenciales', () => {
    for (const ok of ['https://checkout.wompi.co/l/abc', 'mailto:hola@planmed.com', 'tel:+573001234567', '/financiacion#calculadora', '/recomendaciones/x']) assert.equal(t.safeCtaUrl(ok), ok)
    for (const bad of ['http://inseguro.com', 'javascript:alert(1)', 'JAVASCRIPT:alert(1)', 'data:text/html,x', '//otro.com', 'https://u:p@host.com', 'https://host.com/a b', '/a\\b', 'ftp://x.com', 'mailto:sin-arroba', 'tel:abc', '', null]) {
      assert.equal(t.safeCtaUrl(bad), null, String(bad))
    }
  })

  test('vídeo: solo YouTube; el embed se deriva del identificador', () => {
    assert.deepEqual(t.safeVideo({ provider: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', embed_url: embed }), { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', embedUrl: embed })
    assert.deepEqual(t.safeVideo({ url: 'https://youtu.be/dQw4w9WgXcQ' }), { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', embedUrl: embed })
    for (const bad of [null, {}, { embed_url: 'https://evil.com/embed/dQw4w9WgXcQ' }, { embed_url: 'https://www.youtube.com.evil.com/embed/dQw4w9WgXcQ' }, { embed_url: 'http://www.youtube.com/embed/dQw4w9WgXcQ' },
      { embed_url: 'javascript:alert(1)' }, { embed_url: 'https://www.youtube.com/embed/' }, { embed_url: 'https://www.youtube.com/embed/<script>' }, { url: 'https://vimeo.com/123' }]) {
      assert.equal(t.safeVideo(bad), null, JSON.stringify(bad))
    }
  })
})

describe('detalle del subtema: introducción y secciones', () => {
  test('introducción con y sin imagen o vídeo; datos editoriales del subtema', () => {
    const full = t.fromPublicSubtopic(page({ intro: { content: '<p>Hola</p>', image: { url: 'https://cdn.example.com/i.jpg', alt: 'Paciente' }, video: { provider: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ', embed_url: embed } } }))
    assert.equal(full.title, 'Título abdominoplastia')
    assert.deepEqual(full.topic, { slug: 'cuidados-de-cirugias', title: 'Cuidados de cirugías', menuLabel: 'Cuidados' })
    assert.deepEqual(full.intro.image, { url: 'https://cdn.example.com/i.jpg', alt: 'Paciente' })
    assert.equal(full.intro.video.embedUrl, embed)
    assert.equal(full.shortUrl, 'http://go.test/abc12345')

    const bare = t.fromPublicSubtopic(page({ intro: { content: '', image: null, video: null } }))
    assert.deepEqual(bare.intro, { content: '', image: null, video: null })
    // Una imagen con URL insegura se descarta; el resto de la introducción se conserva.
    const unsafe = t.fromPublicSubtopic(page({ intro: { content: '<p>x</p>', image: { url: 'javascript:alert(1)', alt: null }, video: { embed_url: 'https://evil.com/embed/x' } } }))
    assert.equal(unsafe.intro.image, null)
    assert.equal(unsafe.intro.video, null)
    assert.equal(unsafe.intro.content, '<p>x</p>')
  })

  test('cada tipo de sección conserva sus campos y los que no trae quedan vacíos (nunca inventados)', () => {
    const d = t.fromPublicSubtopic(page({ sections: [
      section('description', { subtitle: 'Qué es', content: '<p>Texto</p>', layout: 'media_right', image: { url: 'https://cdn.example.com/s.jpg', alt: 'Alt' }, video: { embed_url: embed } }),
      section('recommendations', { content: '<ul><li>Uno</li></ul>' }),
      section('callout', { content: '<p>Financia</p>', cta: { label: 'Pagar', url: 'https://checkout.wompi.co/l/x' } }),
      section('contact', { content: '<p>Escríbenos</p>' }),
      section('custom', { title: 'Libre', content: '<p>x</p>' })
    ] }))
    assert.deepEqual(d.sections.map(s => s.type), ['description', 'recommendations', 'callout', 'contact', 'custom'])
    const [description, list, callout, contact] = d.sections
    assert.equal(description.layout, 'media_right')
    assert.equal(description.subtitle, 'Qué es')
    assert.equal(description.image.alt, 'Alt')
    assert.equal(description.video.embedUrl, embed)
    assert.equal(list.image, null)
    assert.equal(list.video, null)
    assert.equal(list.cta, null)
    assert.deepEqual(callout.cta, { label: 'Pagar', url: 'https://checkout.wompi.co/l/x' })
    assert.equal(contact.cta, null, 'sin botón: no se reserva ni se inventa uno')
  })

  test('el botón es opcional: sin texto, sin destino o con destino inseguro no existe', () => {
    const d = t.fromPublicSubtopic(page({ sections: [
      section('callout', { content: '<p>a</p>', cta: { label: 'Ir', url: 'javascript:alert(1)' } }),
      section('callout', { content: '<p>b</p>', cta: { label: '', url: 'https://ok.example.com' } }),
      section('callout', { content: '<p>c</p>', cta: { label: 'Ir', url: 'http://sin-cifrar.com' } }),
      section('contact', { content: '<p>d</p>', cta: { label: 'Escríbenos', url: 'mailto:hola@planmed.com' } }),
      section('contact', { content: '<p>e</p>', cta: { label: 'Interno', url: '/financiacion' } })
    ] }))
    assert.deepEqual(d.sections.map(s => s.cta), [null, null, null, { label: 'Escríbenos', url: 'mailto:hola@planmed.com' }, { label: 'Interno', url: '/financiacion' }])
  })

  test('lista con recomendaciones en `items` y lista cuyo texto está en `content`', () => {
    const d = t.fromPublicSubtopic(page({ sections: [
      section('recommendations', { items: [{ slug: 'faja', title: 'Usa la faja', content: '<p>Siempre</p>', orden: 1 }, { slug: 'reposo', title: 'Reposo', content: '', orden: 2 }] }),
      section('recommendations', { title: 'Es Normal', content: '<ul><li>Hinchazón</li></ul>', items: [] })
    ] }))
    const [withItems, withContent] = d.sections
    assert.deepEqual(withItems.items.map(i => [i.slug, i.title]), [['faja', 'Usa la faja'], ['reposo', 'Reposo']])
    assert.equal(t.sectionParts(withItems).hasItems, true)
    assert.equal(t.sectionParts(withItems).hasContent, false)
    // El contenido de la lista se presenta una sola vez (como `content`); no hay `items` duplicados.
    assert.equal(withContent.items.length, 0)
    assert.equal(t.sectionParts(withContent).hasContent, true)
    assert.equal(t.sectionParts(withContent).hasItems, false)
  })

  test('recomendaciones sin título (viñetas) se conservan con su texto; sin título ni texto se descartan', () => {
    const d = t.fromPublicSubtopic(page({ sections: [section('recommendations', { items: [{ slug: 'a', title: '', content: '<p>Solo viñeta</p>' }, { slug: 'b', title: '', content: '<p> </p>' }, { slug: 'Mal Slug', title: 'Con título', content: '' }, null, 'x'] })] }))
    assert.deepEqual(d.sections[0].items.map(i => [i.slug, i.title]), [['a', ''], ['', 'Con título']])
  })

  test('tipo o diseño desconocidos: se muestran como sección genérica / columna única, sin perder contenido', () => {
    const d = t.fromPublicSubtopic(page({ sections: [section('galeria-nueva', { content: '<p>x</p>', layout: 'diagonal' })] }))
    assert.equal(d.sections[0].type, 'custom')
    assert.equal(d.sections[0].layout, 'stacked')
  })

  test('una sección sin nada que mostrar queda marcada como vacía', () => {
    assert.equal(t.sectionParts(t.fromPublicSubtopic(page({ sections: [section('description', { content: '<p> </p>' })] })).sections[0]).isEmpty, true)
    assert.equal(t.sectionParts(t.fromPublicSubtopic(page({ sections: [section('callout', { cta: { label: 'Ir', url: '/x' } })] })).sections[0]).isEmpty, false)
  })

  test('contrato incumplido => null (nunca una página inventada): sin tema, sin slug o sin título', () => {
    assert.equal(t.fromPublicSubtopic(null), null)
    assert.equal(t.fromPublicSubtopic({}), null)
    assert.equal(t.fromPublicSubtopic(page({ topic: null })), null)
    assert.equal(t.fromPublicSubtopic(page({ topic: { slug: 'Mal Slug', title: 'x' } })), null)
    assert.equal(t.fromPublicSubtopic(page({ slug: 'Mal Slug' })), null)
    assert.equal(t.fromPublicSubtopic(page({ title: '', menu_label: '' })), null)
  })

  test('el HTML llega tal cual (se sanea al mostrarlo) y los campos de texto pierden caracteres de control', () => {
    const d = t.fromPublicSubtopic(page({ intro: { content: '<p onclick="x()">Hola\u0000</p><script>alert(1)</script>' }, sections: [section('custom', { title: 'Tít\u0007ulo   largo', content: '<p>x</p>' })] }))
    assert.equal(d.intro.content.includes('\u0000'), false)
    assert.equal(d.sections[0].title, 'Título largo')
  })
})

describe('SEO del subtema', () => {
  test('título, descripción de la introducción, imagen y ruta canónica jerárquica', () => {
    const d = t.fromPublicSubtopic(page({ intro: { content: '<p>La abdominoplastia &amp; sus <strong>cuidados</strong>.</p>', image: { url: 'https://cdn.example.com/i.jpg', alt: null }, video: null } }))
    assert.deepEqual(t.subtopicSeo(d), { title: 'Título abdominoplastia | Planmed', description: 'La abdominoplastia & sus cuidados .', image: 'https://cdn.example.com/i.jpg', canonicalPath: '/recomendaciones/cuidados-de-cirugias/abdominoplastia' })
  })

  test('descripción larga se recorta a 160 caracteres; sin introducción usa la primera sección con texto; sin nada, un texto de respaldo', () => {
    const long = t.fromPublicSubtopic(page({ intro: { content: `<p>${'palabra '.repeat(60)}</p>` } }))
    assert.equal(t.subtopicSeo(long).description.length <= 160, true)
    assert.equal(t.subtopicSeo(long).description.endsWith('...'), true)
    const fromSection = t.fromPublicSubtopic(page({ intro: { content: '' }, sections: [section('description', { content: '<p>Del cuerpo</p>', image: { url: 'https://cdn.example.com/s.jpg', alt: null } })] }))
    assert.equal(t.subtopicSeo(fromSection).description, 'Del cuerpo')
    assert.equal(t.subtopicSeo(fromSection).image, 'https://cdn.example.com/s.jpg')
    const bare = t.fromPublicSubtopic(page({ intro: { content: '' }, sections: [] }))
    assert.equal(t.subtopicSeo(bare).description, 'Recomendaciones de Planmed: Título abdominoplastia.')
    assert.equal(t.subtopicSeo(bare).image, null)
  })
})

describe('compatibilidad de rutas históricas /recomendaciones/{slug}', () => {
  const tree = t.fromPublicTopics([topic('cuidados-de-cirugias', [sub('abdominoplastia'), sub('mamoplastia')]), topic('valoracion', [sub('cita')])])

  test('un subtema del árbol redirige a su URL jerárquica', () => {
    assert.deepEqual(t.resolveLegacySlug(tree, 'abdominoplastia'), { kind: 'redirect', to: '/recomendaciones/cuidados-de-cirugias/abdominoplastia' })
    assert.deepEqual(t.resolveLegacySlug(tree, 'cita'), { kind: 'redirect', to: '/recomendaciones/valoracion/cita' })
  })

  test('nunca es circular: el destino tiene dos segmentos y no se vuelve a resolver como ruta antigua', () => {
    for (const topicItem of tree) for (const s of topicItem.subtopics) {
      const r = t.resolveLegacySlug(tree, s.slug)
      assert.equal(r.kind, 'redirect')
      assert.equal(r.to.split('/').filter(Boolean).length, 3, 'recomendaciones/{tema}/{subtema}')
      assert.notEqual(r.to, `/recomendaciones/${s.slug}`)
    }
  })

  test('un tema principal abre su portada; lo demás sigue el contrato histórico (páginas sin tema, inexistentes)', () => {
    assert.equal(t.resolveLegacySlug(tree, 'valoracion').kind, 'topic')
    assert.equal(t.resolveLegacySlug(tree, 'valoracion').topic.subtopics[0].slug, 'cita')
    for (const slug of ['pagina-sin-tema', 'no-existe', 'cuidados', 'revision']) assert.deepEqual(t.resolveLegacySlug(tree, slug), { kind: 'legacy' })
  })

  test('con el árbol vacío (Hub caído o sin temas) todo se resuelve como contrato histórico: no se redirige con datos incompletos', () => {
    assert.deepEqual(t.resolveLegacySlug([], 'abdominoplastia'), { kind: 'legacy' })
  })

  test('el conjunto de subtemas del árbol sirve para no repetirlos en los listados históricos', () => {
    assert.deepEqual([...t.treeSubtopicSlugs(tree)].sort(), ['abdominoplastia', 'cita', 'mamoplastia'])
  })
})
