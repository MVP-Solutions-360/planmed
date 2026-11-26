// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// /recursos: documentos legales estáticos, cada uno con su PDF alojado en el sitio, su enlace de Drive y su vista de detalle.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const { resourceDocuments, resourceDocumentBySlug } = await import(pathToFileURL(join(ROOT, 'data/resourceDocuments.ts')).href)
const src = rel => readFileSync(join(ROOT, rel), 'utf8')

describe('Documentos de /recursos', () => {
  test('los cuatro documentos, en orden y con slug único', () => {
    assert.deepEqual(resourceDocuments.map(d => d.slug), ['politica-tratamiento-datos', 'aviso-privacidad-autorizacion', 'aviso-privacidad', 'autorizacion-tratamiento-datos'])
  })
  test('cada PDF existe en public y es un PDF real; cada documento tiene contenido y enlace de Drive', () => {
    for (const d of resourceDocuments) {
      assert.match(d.file, /^\/images\/web\/pdf\/[a-z-]+\.pdf$/)
      const path = join(ROOT, 'public', d.file)
      assert.ok(existsSync(path), d.file)
      assert.equal(readFileSync(path).subarray(0, 5).toString(), '%PDF-')
      assert.ok(d.title && d.description && d.documentTitle && d.sections.length, d.slug)
      assert.match(d.driveUrl, /^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+\/view/)
    }
    assert.equal(new Set(resourceDocuments.map(d => d.driveUrl)).size, resourceDocuments.length)
  })
  test('sin marcas de acento rotas por la extracción del PDF', () => {
    assert.equal(/[ŕś́]/.test(JSON.stringify(resourceDocuments)), false)
  })
  test('búsqueda por slug: un slug inexistente no devuelve documento (la vista responde 404)', () => {
    assert.equal(resourceDocumentBySlug('aviso-privacidad')?.title, 'Aviso de privacidad')
    assert.equal(resourceDocumentBySlug('no-existe'), undefined)
    assert.match(src('pages/recursos/[slug].vue'), /statusCode: 404/)
  })
  test('la lista enlaza al detalle y ofrece la descarga', () => {
    const list = src('pages/recursos/index.vue')
    assert.match(list, /:to="`\/recursos\/\$\{doc\.slug\}`"/)
    assert.match(list, /:download="`\$\{doc\.slug\}\.pdf`"/)
  })
})
