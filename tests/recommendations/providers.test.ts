// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { HubRecommendationsProvider } from '../../providers/HubRecommendationsProvider.ts'
import { HubPublicRecommendationsProvider } from '../../providers/HubPublicRecommendationsProvider.ts'

type Call = { url: string, options?: any }
function fetcher(handler: (call: Call) => any) {
  const calls: Call[] = []
  const fn = async (url: string, options?: any) => {
    calls.push({ url, options })
    const out = handler({ url, options })
    if (out instanceof Error) throw out
    return out
  }
  return { fn: fn as any, calls }
}
const httpError = (statusCode: number, message?: string) => Object.assign(new Error('fetch failed'), { statusCode, data: message ? { message } : undefined })

const page = (over: any = {}) => ({ slug: 'p', group: 'general', custom: true, menuLabel: 'P', title: 'T', videoUrl: '', image: '', content: '<p>x</p>', published: false, ...over })

describe('HubRecommendationsProvider (admin)', () => {
  test('lee de la ruta interna de Nitro, nunca de Hub directamente', async () => {
    const f = fetcher(() => ({ data: [page()] }))
    const pages = await new HubRecommendationsProvider(f.fn).getPages()
    assert.equal(pages.length, 1)
    assert.equal(f.calls[0]!.url, '/api/admin/recommendations')
    assert.equal(f.calls.every(c => c.url.startsWith('/api/')), true)
  })

  test('getPage por slug: encuentra o devuelve null', async () => {
    const f = fetcher(() => ({ data: [page(), page({ slug: 'otra' })] }))
    const provider = new HubRecommendationsProvider(f.fn)
    assert.equal((await provider.getPage('otra'))?.slug, 'otra')
    assert.equal(await provider.getPage('no-existe'), null)
  })

  test('guardar: envía título, etiqueta, video, contenido y publicación; la imagen solo si cambió', async () => {
    const f = fetcher(() => page({ published: true }))
    const provider = new HubRecommendationsProvider(f.fn)

    await provider.savePage(page({ published: true, image: 'https://hub/existente.jpg' }))
    assert.equal(f.calls[0]!.url, '/api/admin/recommendations/p')
    assert.equal(f.calls[0]!.options.method, 'PUT')
    assert.deepEqual(f.calls[0]!.options.body, { title: 'T', menuLabel: 'P', videoUrl: '', content: '<p>x</p>', published: true })

    await provider.savePage(page({ image: 'data:image/png;base64,AAAA' }))
    assert.equal(f.calls[1]!.options.body.image, 'data:image/png;base64,AAAA')
    await provider.savePage(page({ image: '' }))
    assert.equal(f.calls[2]!.options.body.image, '')
  })

  test('publicar y despublicar viajan en "published"', async () => {
    const f = fetcher(() => page())
    const provider = new HubRecommendationsProvider(f.fn)
    await provider.savePage(page({ published: true }))
    await provider.savePage(page({ published: false }))
    assert.deepEqual(f.calls.map(c => c.options.body.published), [true, false])
  })

  test('crear y eliminar usan las rutas internas y el slug se codifica', async () => {
    const f = fetcher(() => page())
    const provider = new HubRecommendationsProvider(f.fn)
    await provider.createPage({ title: '  Dieta  ', group: 'cuidados' })
    assert.deepEqual(f.calls[0]!.options, { method: 'POST', body: { title: 'Dieta', group: 'cuidados' } })
    await provider.deletePage('a b/c')
    assert.equal(f.calls[1]!.url, '/api/admin/recommendations/a%20b%2Fc')
    assert.equal(f.calls[1]!.options.method, 'DELETE')
    await assert.rejects(() => provider.createPage({ title: '   ', group: 'general' }), /título/)
  })

  test('errores 401, 403, 404 y 422 conservan código y mensaje; sin mensaje => texto genérico', async () => {
    for (const [status, message] of [[401, 'No autenticado'], [403, 'No tienes permiso'], [404, 'La página no existe.'], [422, 'Revisa los datos ingresados.']] as const) {
      const provider = new HubRecommendationsProvider(fetcher(() => httpError(status, message)).fn)
      await assert.rejects(() => provider.savePage(page()), (e: any) => e.statusCode === status && e.message === message)
    }
    const nested = Object.assign(new Error('x'), { statusCode: 422, data: { data: { message: 'anidado' } } })
    await assert.rejects(() => new HubRecommendationsProvider(fetcher(() => nested).fn).getPages(), (e: any) => e.message === 'anidado')
    await assert.rejects(() => new HubRecommendationsProvider(fetcher(() => httpError(503)).fn).getPages(), (e: any) => e.statusCode === 503 && /Wellezy Hub/.test(e.message))
  })
})

describe('HubPublicRecommendationsProvider (público)', () => {
  test('lista y detalle por las rutas públicas internas', async () => {
    const f = fetcher(({ url }) => (url.endsWith('recommendations') ? [page({ published: true })] : page({ slug: 'x', content: '<p>y</p>' })))
    const provider = new HubPublicRecommendationsProvider(f.fn)
    assert.equal((await provider.getPages()).length, 1)
    assert.equal((await provider.getPage('x'))?.content, '<p>y</p>')
    assert.deepEqual(f.calls.map(c => c.url), ['/api/public/recommendations', '/api/public/recommendations/x'])
  })

  test('404 => null (la página lanza 404 real); otros errores se propagan', async () => {
    assert.equal(await new HubPublicRecommendationsProvider(fetcher(() => httpError(404)).fn).getPage('no'), null)
    await assert.rejects(() => new HubPublicRecommendationsProvider(fetcher(() => httpError(503)).fn).getPage('no'), (e: any) => e.statusCode === 503)
    await assert.rejects(() => new HubPublicRecommendationsProvider(fetcher(() => httpError(503)).fn).getPages())
  })
})
