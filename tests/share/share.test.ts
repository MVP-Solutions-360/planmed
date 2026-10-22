// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Acciones de compartir: reglas de URL (shared/utils/share.ts) y comprobaciones estáticas del componente y de las páginas que lo usan.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from '../recommendations/harness.ts'
import { httpUrl, publicPath, resolveShareTarget, shareTitle, whatsappShareUrl } from '../../shared/utils/share.ts'

const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const ORIGIN = 'https://planmed.com.co'

describe('resolveShareTarget', () => {
  test('usa el enlace corto REAL de Hub cuando existe y es válido', () => {
    assert.deepEqual(resolveShareTarget({ shortUrl: 'https://go.planmed.com/2whshx6n', origin: ORIGIN, path: '/noticias/x' }), { url: 'https://go.planmed.com/2whshx6n', kind: 'short' })
    assert.deepEqual(resolveShareTarget({ shortUrl: ' http://go.localhost:8000/abc23456 ', origin: ORIGIN, path: '/noticias/x' })?.kind, 'short')
  })

  test('sin enlace corto (o con uno inválido) usa la URL pública de la página actual; nunca inventa un código', () => {
    for (const bad of [null, undefined, '', '   ', 'javascript:alert(1)', 'data:text/html,x', 'ftp://x.test/a', '/solo-ruta', 'https://user:pass@x.test/a', 'https://x.test/a b', 'https://x.test/a\\b', 42]) {
      assert.deepEqual(resolveShareTarget({ shortUrl: bad, origin: ORIGIN, path: '/noticias/mi-nota' }), { url: 'https://planmed.com.co/noticias/mi-nota', kind: 'canonical' }, String(bad))
    }
    assert.deepEqual(resolveShareTarget({ origin: 'https://planmed.com.co/', path: '/recomendaciones/t/s' })?.url, 'https://planmed.com.co/recomendaciones/t/s')
  })

  test('no comparte rutas del panel, de la API ni formas ambiguas: devuelve null (no se muestran acciones)', () => {
    for (const path of ['/admin', '/admin/login', '/admin/recomendaciones/temas', '/ADMIN/x', '/api/public/about', '//evil.test/x', '\\evil', 'noticias/x', 'https://evil.test/x', '/a b', '/x\n', '', undefined, null, 5]) {
      assert.equal(resolveShareTarget({ origin: ORIGIN, path }), null, String(path))
    }
    for (const origin of ['', undefined, 'planmed.com', 'javascript:x', 'https://planmed.com.co/ruta', 'https://planmed.com.co?x=1', 'https://u:p@planmed.com.co']) {
      assert.equal(resolveShareTarget({ origin, path: '/noticias/x' }), null, String(origin))
    }
  })

  test('publicPath y httpUrl rechazan controles y barras invertidas', () => {
    assert.equal(publicPath('/ok/ruta?x=1#y'), '/ok/ruta?x=1#y')
    assert.equal(publicPath('/a\u0000b'), null)
    assert.equal(httpUrl('https://x.test/\u0007'), null)
  })
})

describe('WhatsApp', () => {
  test('título y URL van en un único parámetro `text` codificado, separados por salto de línea', () => {
    const href = whatsappShareUrl('Recomendaciones: ¿cuándo operarte? & más', 'https://go.planmed.com/abc23456?x=1&y=2')
    assert.ok(href.startsWith('https://wa.me/?text='))
    assert.equal(href.includes(' '), false)
    assert.equal(new URL(href).searchParams.get('text'), 'Recomendaciones: ¿cuándo operarte? & más\nhttps://go.planmed.com/abc23456?x=1&y=2')
    assert.equal(new URL(href).searchParams.size, 1)
  })

  test('título vacío: solo la URL; título largo o con saltos: una línea de máximo 140 caracteres; sin teléfono ni envío automático', () => {
    assert.equal(new URL(whatsappShareUrl('', 'https://x.test/a')).searchParams.get('text'), 'https://x.test/a')
    const t = shareTitle('línea 1\n\nlínea 2\t' + 'x'.repeat(300))
    assert.ok(t.length <= 140 && !/[\n\t]/.test(t))
    assert.equal(/phone=|api\.whatsapp/.test(whatsappShareUrl('a', 'https://x.test')), false)
  })
})

describe('componente y páginas', () => {
  const comp = read('components/common/ShareActions.vue')

  test('copiar: API moderna, método clásico y salida manual con enlace seleccionable; confirmación visible y accesible', () => {
    assert.match(comp, /navigator\.clipboard\.writeText/)
    assert.match(comp, /execCommand\('copy'\)/)
    assert.match(comp, /data-testid="share-manual"/)
    assert.match(comp, /role="status"/)
    assert.match(comp, /¡Enlace corto copiado!/)
    assert.match(comp, /aún no tiene enlace corto/)
  })

  test('WhatsApp es un enlace (funciona sin JavaScript), en pestaña nueva y con rel seguro; no pide permisos ni envía nada', () => {
    assert.match(comp, /<a\s[^>]*:href="whatsappHref"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/s)
    assert.equal(/geolocation|Notification\.requestPermission|navigator\.share/.test(comp), false)
  })

  test('no genera enlaces cortos ni llama a Hub: solo recibe el que se le pasa', () => {
    assert.equal(/\$fetch|useFetch|useAsyncData|short-link|go\./i.test(comp), false)
  })

  test('subtemas: usan SU ruta jerárquica y el enlace corto de Hub; noticias: su URL pública sin enlace corto', () => {
    const sub = read('pages/recomendaciones/[topic]/[subtopic].vue')
    assert.match(sub, /:share-path="`\/recomendaciones\/\$\{topic\}\/\$\{slug\}`"/)
    assert.match(sub, /:short-url="subtopic\.shortUrl"/)
    const news = read('pages/noticias/[slug].vue')
    assert.match(news, /<CommonShareActions :title="article\.title" :path="`\/noticias\/\$\{slug\}`"/)
    assert.equal(/short-url/.test(news), false)
    assert.match(read('components/recommendations/RecommendationShell.vue'), /<CommonShareActions v-if="sharePath"/)
  })

  test('las páginas históricas (/recomendaciones/{slug}, cuidados, revisión) y los redireccionados NO muestran las acciones', () => {
    for (const f of ['pages/recomendaciones/[slug].vue', 'pages/recomendaciones/cuidados/[slug].vue', 'pages/recomendaciones/revision/[slug].vue']) {
      assert.equal(/share-path|ShareActions/.test(read(f)), false, f)
    }
  })
})
