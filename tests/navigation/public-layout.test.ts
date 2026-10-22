// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Menú público único y chat flotante: todas las páginas públicas (incluidas las de error) usan el mismo layout y el mismo menú, y el
// lanzador de chat se abre sin depender de la hidratación.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { ROOT } from '../recommendations/harness.ts'

const read = rel => readFileSync(join(ROOT, rel), 'utf8')
function walk(dir) {
  return readdirSync(dir).flatMap(n => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]))
}
const publicPages = walk(join(ROOT, 'pages')).filter(f => f.endsWith('.vue')).map(f => relative(ROOT, f).replaceAll('\\', '/')).filter(f => !f.startsWith('pages/admin/'))

describe('un único menú público', () => {
  test('hay páginas públicas que revisar y NINGUNA define su propio layout, navegación o cabecera de menú', () => {
    assert.ok(publicPages.length >= 20)
    for (const f of publicPages) {
      const src = read(f)
      assert.equal(/layout:\s*(false|['"])/.test(src), false, `${f} cambia de layout`)
      assert.equal(/<nav\b|<LayoutNavbar|<NuxtLayout/.test(src), false, `${f} define su propia navegación`)
    }
  })

  test('el layout por defecto contiene el menú, el pie y el chat; el layout del panel es el único alterno', () => {
    const layout = read('layouts/default.vue')
    for (const c of ['<LayoutNavbar', '<LayoutFooter', '<LayoutChatLauncher']) assert.ok(layout.includes(c), c)
    assert.deepEqual(readdirSync(join(ROOT, 'layouts')).sort(), ['admin.vue', 'default.vue'])
    assert.match(read('app.vue'), /<NuxtLayout>\s*<NuxtPage \/>\s*<\/NuxtLayout>/)
  })

  test('las páginas de error (404, 503…) usan el MISMO layout, es decir, el mismo menú, pie y chat', () => {
    const err = read('error.vue')
    assert.match(err, /<NuxtLayout>/)
    assert.equal(/<nav|<header|<footer|LayoutNavbar/.test(err), false, 'no tiene una cabecera propia')
  })

  test('el menú tiene UNA sola fuente (Navbar.vue) con las mismas opciones en escritorio y móvil', () => {
    const nav = read('components/layout/Navbar.vue')
    for (const label of ['PROCEDIMIENTOS', 'NOTICIAS', 'PLANMED', 'SIMULAR FINANCIACIÓN', 'INICIAR SESIÓN']) assert.ok(nav.includes(label), label)
    // Las entradas de «Planmed» y las principales se definen una vez y se usan en ambas versiones.
    assert.equal((nav.match(/const planmedItems = \[/g) || []).length, 1)
    assert.equal((nav.match(/const mainLinks = \[/g) || []).length, 1)
    assert.ok(nav.includes('v-for="item in planmedItems"'))
    assert.ok(nav.includes('data-testid="planmed-menu-mobile"'))
    for (const other of walk(join(ROOT, 'components')).map(f => f.split('\\').join('/')).filter(f => f.endsWith('.vue') && !f.includes('/layout/') && !f.includes('/admin/'))) {
      assert.equal(/aria-label="Menú principal"/.test(readFileSync(other, 'utf8')), false, `${other} duplica el menú principal`)
    }
  })
})

describe('chat flotante «Chatea con nosotros»', () => {
  const chat = read('components/layout/ChatLauncher.vue')

  test('abre y cierra con <details>/<summary> nativos: funciona antes de hidratar (causa del fallo en páginas pesadas)', () => {
    assert.match(chat, /<details ref="details"/)
    assert.match(chat, /<summary/)
    assert.equal(/@click="isOpen|isOpen\s*=\s*!isOpen|v-show="isOpen"/.test(chat), false, 'el estado ya no depende de un clic gestionado por Vue')
  })

  test('conserva los canales y su diseño: WhatsApp y Messenger como enlaces seguros, accesibles y con las mismas direcciones', () => {
    assert.match(chat, /data-testid="chat-whatsapp"/)
    assert.match(chat, /data-testid="chat-messenger"/)
    assert.match(chat, /WHATSAPP_URL/)
    assert.match(chat, /MESSENGER_URL/)
    const contact = read('shared/utils/contact.ts')
    assert.match(contact, /WHATSAPP_NUMBER = '573188043382'/)
    assert.match(contact, /MESSENGER_URL = 'https:\/\/www\.facebook\.com\/Financicioncirugiaplastica\/'/)
    assert.match(contact, /CONTACT_EMAIL = 'planmedequipodetrabajo@gmail\.com'/)
    assert.equal((chat.match(/rel="noopener noreferrer"/g) || []).length, 2)
    assert.match(chat, /aria-label="Chatea con nosotros"/)
  })

  test('se cierra con Escape y al hacer clic fuera, y el panel se abre hacia arriba dentro de la pantalla', () => {
    assert.match(chat, /@keydown\.esc="close\(true\)"/)
    assert.match(chat, /document\.addEventListener\('click', onOutside\)/)
    assert.match(chat, /absolute bottom-full right-0/)
  })
})
