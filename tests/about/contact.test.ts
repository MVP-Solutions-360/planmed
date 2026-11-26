// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Datos de contacto oficiales de Planmed y lectura del contenido persistido de «Nosotros». Sin red: directorio temporal.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const imp = rel => import(pathToFileURL(join(ROOT, rel)).href)
const read = rel => readFileSync(join(ROOT, rel), 'utf8')
const K = await imp('shared/utils/contact.ts')
const C = await imp('shared/utils/aboutContent.ts')

describe('datos de contacto oficiales', () => {
  test('celular, WhatsApp y correo', () => {
    assert.equal(K.WHATSAPP_NUMBER, '573011409597')
    assert.equal(K.WHATSAPP_DISPLAY, '301 140 9597')
    assert.equal(K.WHATSAPP_URL, 'https://wa.me/573011409597')
    assert.equal(K.CONTACT_EMAIL, 'planmedequipodetrabajo@gmail.com')
    assert.equal(K.CONTACT_MAILTO, 'mailto:planmedequipodetrabajo@gmail.com')
    assert.equal(K.whatsappUrlWithText('Hola, ¿qué tal?'), 'https://wa.me/573011409597?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F')
  })

  test('el contenido inicial de «Nosotros» coincide y su enlace de llamada es internacional', () => {
    const k = C.aboutDefaultContent().contact
    assert.equal(k.phone.replace(/\D/g, ''), K.WHATSAPP_NUMBER)
    assert.equal(C.aboutPhoneHref(k.phone), 'tel:+573011409597')
    assert.equal(k.email, K.CONTACT_EMAIL)
  })

  test('cada punto de contacto usa la fuente central', () => {
    const points = {
      'components/layout/Footer.vue': [':href="WHATSAPP_URL"'],
      'components/layout/ChatLauncher.vue': ['const whatsappUrl = WHATSAPP_URL'],
      'components/common/CtaSection.vue': ['default: WHATSAPP_URL'],
      'components/forms/LeadForm.vue': ['whatsappUrlWithText(text)'],
      'components/referral/ProgramContent.vue': [':href="WHATSAPP_URL"', '{{ WHATSAPP_DISPLAY }}'],
      'components/simulator/NextStepsSection.vue': [':href="whatsappUrlWithText('],
      'pages/quienes-somos.vue': [':href="WHATSAPP_URL"'],
      'pages/informacion-precontractual.vue': [':href="CONTACT_MAILTO"', '{{ CONTACT_EMAIL }}']
    }
    for (const [rel, uses] of Object.entries(points)) {
      const src = read(rel)
      assert.match(src, /import \{[^}]+\} from '#shared\/utils\/contact'/, rel)
      for (const u of uses) assert.ok(src.includes(u), `${rel}: ${u}`)
    }
  })

  test('el modal precontractual muestra y enlaza el correo oficial', () => {
    // El texto escapa la arroba para vue-i18n: se normaliza antes de comparar.
    const src = read('components/common/PrecontractualModal.vue').replaceAll("{\\'@\\'}", '@')
    assert.ok(src.includes(`mailto:${K.CONTACT_EMAIL}`))
    assert.ok(src.includes(`>${K.CONTACT_EMAIL}<`))
  })

  test('no quedan los datos anteriores ni números de contacto repetidos en el código', () => {
    const bad = []
    const check = f => {
      const src = readFileSync(f, 'utf8')
      if (/318[ .()-]*804[ .-]*3382|pqrs\.institucional/i.test(src)) bad.push(`${f}: dato anterior`)
      if (/wa\.me\/\d/.test(src)) bad.push(`${f}: enlace de WhatsApp escrito a mano`)
    }
    const walk = d => { for (const n of readdirSync(d)) { const f = join(d, n); if (statSync(f).isDirectory()) walk(f); else if (/\.(vue|ts|js)$/.test(n)) check(f) } }
    for (const d of ['components', 'pages', 'layouts', 'composables', 'services', 'server', 'shared', 'utils', 'data']) walk(join(ROOT, d))
    for (const f of ['app.vue', 'error.vue', 'nuxt.config.ts']) check(join(ROOT, f))
    assert.deepEqual(bad, [])
  })
})

describe('contenido persistido de «Nosotros»', () => {
  let dir, store
  before(async () => {
    dir = mkdtempSync(join(tmpdir(), 'contact-'))
    const g = globalThis
    g.useRuntimeConfig = () => ({ planmedContentDir: dir })
    g.createError = o => Object.assign(new Error(o.message ?? 'error'), o)
    Object.assign(g, C)
    store = await imp('server/utils/aboutStore.ts')
  })
  after(() => rmSync(dir, { recursive: true, force: true }))

  // Todos los campos distintos del contenido inicial, para detectar cualquier pérdida o sustitución.
  const saved = () => ({
    hero: { title: 'Equipo', image: '/images/web/otra.jpg', imageAlt: 'Otra' },
    institutional: { title: 'Título', legal: '<p>Legal</p>', paragraphs: ['<p>Uno</p>', '<p>Dos</p>', '<p>Tres</p>'] },
    video: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    faqs: [{ id: 'faq-uno', question: '¿Uno?', answer: '<p>Sí</p>', active: false }],
    contact: {
      address: 'Calle 1', building: 'Torre', city: 'Cali', region: 'Valle', phone: '+57 300 1112233', email: 'otro@planmed.example', schedule: '<p>Lunes</p>',
      socials: { instagram: 'https://www.instagram.com/otro', facebook: 'https://www.facebook.com/otro', tiktok: 'https://www.tiktok.com/@otro' },
      map: { enabled: true }
    },
    updatedAt: '2026-10-13T16:52:21.314Z'
  })

  test('lo guardado prevalece sobre el contenido inicial y se lee sin perder datos', async () => {
    writeFileSync(join(dir, 'about.json'), JSON.stringify(saved()))
    assert.deepEqual(await store.readAboutContent({}), saved())
  })

  test('normalizar no altera un contenido completo y es estable', () => {
    const once = C.normalizeAboutContent(saved())
    assert.deepEqual(once, saved())
    assert.deepEqual(C.normalizeAboutContent(once), saved())
  })

  test('un contenido guardado sin contacto toma los datos oficiales y conserva el resto', async () => {
    const { contact, ...rest } = saved()
    writeFileSync(join(dir, 'about.json'), JSON.stringify(rest))
    const read = await store.readAboutContent({})
    assert.deepEqual(read.contact, C.aboutDefaultContent().contact)
    assert.deepEqual(read.faqs, saved().faqs)
    assert.deepEqual(read.hero, saved().hero)
  })
})
