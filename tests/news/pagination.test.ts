// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Paginación de /noticias: Hub limita per_page a 50, por eso la web mostraba solo 50 de las noticias publicadas.
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parsePage, pageWindow } from '../../shared/utils/pagination.ts'

const read = (p) => readFileSync(p, 'utf8')

describe('paginador de noticias', () => {
  test('parsePage: solo enteros >= 1; cualquier otra cosa es la primera página', () => {
    assert.equal(parsePage('3'), 3)
    assert.equal(parsePage(['4', '9']), 4)
    for (const v of [undefined, null, '', '0', '-2', 'abc', 'NaN']) assert.equal(parsePage(v), 1)
  })
  test('pageWindow: primera, última y vecinas, con huecos marcados', () => {
    assert.deepEqual(pageWindow(1, 1), [1])
    assert.deepEqual(pageWindow(1, 3), [1, 2, 3])
    assert.deepEqual(pageWindow(6, 12), [1, 'gap', 5, 6, 7, 'gap', 12])
    assert.deepEqual(pageWindow(1, 12), [1, 2, 'gap', 12])
    assert.deepEqual(pageWindow(12, 12), [1, 'gap', 11, 12])
    assert.deepEqual(pageWindow(4, 6), [1, 2, 3, 4, 5, 6])
  })
})

describe('/noticias pagina y ya no se limita a 50', () => {
  const handler = read('server/api/public/news-page.get.ts')
  const page = read('pages/noticias/index.vue')
  test('el endpoint reenvía page y per_page (tope 50 de Hub) y devuelve la paginación', () => {
    assert.match(handler, /posts\?per_page=\$\{perPage\}&page=\$\{page\}/)
    assert.match(handler, /MAX_PER_PAGE = 50/)
    assert.match(handler, /lastPage/)
    assert.match(handler, /total/)
  })
  test('la página usa la paginación (query ?pagina) y muestra el total real', () => {
    assert.match(page, /getNewsPage\(/)
    assert.match(page, /route\.query\.pagina/)
    assert.match(page, /data-testid="news-pagination"/)
    assert.doesNotMatch(page, /news\.value\.length/)
  })
  test('la lista simple /api/public/news se conserva', () => {
    assert.match(read('server/api/public/news/index.get.ts'), /per_page=50/)
  })
})
