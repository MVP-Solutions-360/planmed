// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Secciones de Recomendaciones con bloques: contrato público (modo bloques y derivación del formato anterior) y partes de la sección.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from './harness.ts'

const t = await import(pathToFileURL(join(ROOT, 'shared/utils/recommendationTree.ts')).href)

const subtopic = (section) => ({
  slug: 'cuidados', title: 'Cuidados', topic: { slug: 'cirugia', title: 'Cirugía', menu_label: 'Cirugía' },
  intro: { content: null, image: null, video: null }, sections: [{ type: 'description', orden: 1, title: 'Sección', ...section }]
})
const first = (section) => t.fromPublicSubtopic(subtopic(section))?.sections[0]

describe('secciones con bloques', () => {
  test('modo bloques: respeta la distribución activa y descarta bloques inválidos', () => {
    const s = first({
      blocks_mode: true, column_layout: 'two_columns',
      blocks: { main: [{ type: 'text', html: '<p>oculto</p>' }], left: [{ type: 'text', html: '<p>Hola</p>' }], right: [{ type: 'youtube', url: 'https://evil.example/x' }, { type: 'image', url: 'https://cdn.example/a.jpg', alt: 'a' }] }
    })
    assert.equal(s.blocksMode, true)
    assert.equal(s.columnLayout, 'two_columns')
    const types = t.activeBlocks(s).map(b => b.type)
    assert.deepEqual(types, ['text', 'image'])
    assert.equal(t.sectionParts(s).hasMedia, true)
    assert.equal(t.sectionImageUrl(s), 'https://cdn.example/a.jpg')
    assert.match(t.sectionText(s), /Hola/)
  })

  test('formato anterior: se deriva imagen + texto en dos columnas según la posición de la imagen', () => {
    const s = first({ content: '<p>Texto</p>', layout: 'media_right', image: { url: 'https://cdn.example/a.jpg', alt: 'a' } })
    assert.equal(s.blocksMode, false)
    assert.equal(s.columnLayout, 'two_columns')
    assert.deepEqual(s.blocks.left.map(b => b.type), ['text'])
    assert.deepEqual(s.blocks.right.map(b => b.type), ['image'])
  })

  test('una sección en modo bloques sin bloques ni botón queda vacía', () => {
    const s = first({ blocks_mode: true, column_layout: 'one_column', blocks: { main: [], left: [], right: [] } })
    assert.equal(t.sectionParts(s).isEmpty, true)
  })
})
