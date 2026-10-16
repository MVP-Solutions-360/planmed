// @ts-nocheck -- pruebas ejecutadas con Node (node:test); fuera del alcance del typecheck de Nuxt.
// Cotización del simulador: conversión de la tasa, fórmula sin redondeo artificial, servicio de la tasa (caché de corta vida, sin respaldo),
// proveedor de cotización y consumidores (SimulatorPanel y LeadForm) sin ninguna tasa fija.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT } from '../recommendations/harness.ts'

const imp = rel => import(pathToFileURL(join(ROOT, rel)).href)
const src = rel => readFileSync(join(ROOT, rel), 'utf8')
const F = await imp('shared/utils/financing.ts')
const S = await imp('services/FinancingRateService.ts')
const P = await imp('providers/MockQuotationProvider.ts')

// Oráculo independiente: amortiza mes a mes; con la cuota correcta el saldo final es ~0.
function finalBalance(principal, months, r, payment) {
  let balance = principal
  for (let i = 0; i < months; i++) balance = balance * (1 + r) - payment
  return balance
}

describe('conversión del porcentaje mensual a decimal', () => {
  test('2.12 → 0.0212 y 2.0126 → 0.020126, exactos', () => {
    assert.equal(F.financingRateToDecimal('2.12'), 0.0212)
    assert.equal(F.financingRateToDecimal('2.0126'), 0.020126)
    assert.equal(F.financingRateToDecimal('2'), 0.02)
    assert.equal(F.financingRateToDecimal('2.0000'), 0.02)
    assert.equal(F.financingRateToDecimal('0.0001'), 0.000001)
    assert.equal(F.financingRateToDecimal('5'), 0.05)
  })

  test('no se redondea a dos decimales ni se pierde precisión', () => {
    assert.notEqual(F.financingRateToDecimal('2.0126'), F.financingRateToDecimal('2.01'))
    assert.equal(F.parseFinancingRate('2.0126').text, '2.0126')
    assert.equal(F.parseFinancingRate(2.0126).text, '2.0126')
    assert.equal(F.parseFinancingRate('2.1').text, '2.1000')
  })

  test('formato inválido: no se reinterpreta', () => {
    for (const bad of ['2,12', '2.12345', 'abc', '', '0', '5.0001', '1e1', '-2', ' ', null, undefined, NaN, Infinity]) {
      assert.equal(F.parseFinancingRate(bad).ok, false, String(bad))
    }
    assert.throws(() => F.financingRateToDecimal('2,12'), RangeError)
  })

  test('límites técnicos: 0.0001 y 5 son válidos; justo fuera, no', () => {
    assert.equal(F.parseFinancingRate('0.0001').ok, true)
    assert.equal(F.parseFinancingRate('5').ok, true)
    assert.equal(F.parseFinancingRate('5.0000').ok, true)
    assert.equal(F.parseFinancingRate('0.0000').ok, false)
    assert.equal(F.parseFinancingRate('5.0001').ok, false)
  })
})

describe('fórmula de cuota fija amortizada (sin redondeo artificial)', () => {
  test('la cuota amortiza exactamente el capital (saldo final ≈ 0) para todos los plazos y varias tasas', () => {
    for (const rate of ['2', '2.12', '2.0126', '1.5', '0.0001', '5']) {
      for (const months of F.FINANCING_TERMS) {
        const r = F.financingRateToDecimal(rate)
        const pmt = F.calculateMonthlyPayment(15_000_000, months, r)
        assert.ok(Math.abs(finalBalance(15_000_000, months, r, pmt)) < 1e-3, `${rate} % · ${months} meses`)
      }
    }
  })

  test('ya NO se redondea hacia arriba a la centena: la cuota es el valor exacto de la fórmula', () => {
    const q = F.buildFinancingQuote(15_000_000, 24, '2')
    const factor = Math.pow(1.02, 24)
    assert.ok(Math.abs(q.monthlyPayment - (15_000_000 * 0.02 * factor) / (factor - 1)) < 1e-6, 'equivale a la fórmula PMT directa')
    assert.ok(Math.abs(q.monthlyPayment - 793066.4588) < 1e-3)
    assert.notEqual(q.monthlyPayment, 793100, 'antes: Math.ceil(x/100)*100')
    assert.equal(Number.isInteger(q.monthlyPayment / 100), false)
  })

  test('el total es cuota × plazo y no arrastra el incremento artificial anterior', () => {
    const q = F.buildFinancingQuote(15_000_000, 24, '2')
    assert.equal(q.totalAmount, q.monthlyPayment * 24)
    assert.ok(q.totalAmount < 793100 * 24, 'menor que con la cuota redondeada hacia arriba')
    assert.ok(q.totalAmount > 15_000_000)
  })

  test('la cuota cambia con la tasa configurada y con el plazo (recálculo)', () => {
    const a = F.buildFinancingQuote(15_000_000, 24, '2.0000').monthlyPayment
    const b = F.buildFinancingQuote(15_000_000, 24, '2.12').monthlyPayment
    const c = F.buildFinancingQuote(15_000_000, 24, '2.0126').monthlyPayment
    assert.ok(a < c && c < b)
    assert.ok(F.buildFinancingQuote(15_000_000, 36, '2').monthlyPayment < a)
    assert.equal(F.buildFinancingQuote(15_000_000, 24, '2.12').ratePercent, '2.1200')
  })

  test('tasa cero → P/n; entradas inválidas lanzan en lugar de producir NaN', () => {
    assert.equal(F.calculateMonthlyPayment(12_000_000, 12, 0), 1_000_000)
    for (const args of [[0, 12, 0.02], [-1, 12, 0.02], [NaN, 12, 0.02], [1e6, 0, 0.02], [1e6, -6, 0.02], [1e6, 12.5, 0.02], [1e6, 12, -0.01], [1e6, 12, NaN]]) {
      assert.throws(() => F.calculateMonthlyPayment(...args), RangeError, JSON.stringify(args))
    }
    assert.throws(() => F.buildFinancingQuote(1e6, 12, '2,5'), RangeError)
  })

  test('el redondeo a pesos es solo de presentación y al peso más cercano (sin sesgo hacia arriba)', () => {
    const plain = v => F.formatPesos(v).replace(/\s/g, ' ')
    assert.match(plain(793065.4), /793\.065$/)
    assert.match(plain(793065.6), /793\.066$/)
    assert.match(plain(793066.4588), /793\.066$/)
    assert.equal(F.formatPesos(NaN), '$ 0')
  })
})

describe('regresión de plazos y límites', () => {
  test('plazos 12, 18, 24, 36, 48, 60 y 72 en la utilidad y en ambos consumidores', () => {
    assert.deepEqual([...F.FINANCING_TERMS], [12, 18, 24, 36, 48, 60, 72])
    assert.ok(src('components/simulator/SimulatorPanel.vue').includes('[12, 18, 24, 36, 48, 60, 72]'))
    const lead = src('components/forms/LeadForm.vue')
    for (const m of [12, 18, 24, 36, 48, 60, 72]) assert.ok(lead.includes(`<option :value="${m}">${m} Meses</option>`), `LeadForm ${m}`)
  })

  test('monto: mínimo 1.000.000, máximo 100.000.000, paso 500.000, 24 meses por defecto', () => {
    const s = src('composables/useSimulator.ts')
    assert.match(s, /STEP_AMOUNT = 500000/)
    assert.match(s, /MIN_AMOUNT = 1000000/)
    assert.match(s, /MAX_AMOUNT = 100000000/)
    assert.match(s, /ref\(24\)/)
    assert.match(s, /if \(amount\.value < MIN_AMOUNT\) return/)
  })
})

describe('servicio de la tasa: caché de corta vida y sin respaldo', () => {
  const mk = (impl, clock = { t: 0 }) => {
    const calls = []
    const svc = new S.FinancingRateService(async (url) => { calls.push(url); return impl(calls.length) }, () => clock.t)
    return { svc, calls, clock }
  }

  test('consulta la ruta pública y reutiliza la tasa dentro de la vigencia; pasada la vigencia, vuelve a consultar', async () => {
    const { svc, calls, clock } = mk(n => ({ rate: n === 1 ? '2.0000' : '2.1200', updatedAt: `v${n}` }))
    assert.equal((await svc.getPublicRate()).rate, '2.0000')
    assert.equal((await svc.getPublicRate()).rate, '2.0000')
    assert.deepEqual(calls, ['/api/public/financing-rate'])
    clock.t += S.PUBLIC_RATE_TTL_MS + 1
    assert.equal((await svc.getPublicRate()).rate, '2.1200', 'una tasa actualizada se refleja tras la vigencia')
    assert.equal(calls.length, 2)
  })

  test('peticiones simultáneas comparten una sola consulta', async () => {
    const { svc, calls } = mk(() => ({ rate: '2.0000', updatedAt: 'v1' }))
    await Promise.all([svc.getPublicRate(), svc.getPublicRate(), svc.getPublicRate()])
    assert.equal(calls.length, 1)
  })

  test('si la consulta falla NO se usa una tasa anterior: error controlado, incluso con una tasa vencida en memoria', async () => {
    const clock = { t: 0 }
    let fail = false
    const svc = new S.FinancingRateService(async () => { if (fail) throw new Error('503'); return { rate: '2.0000', updatedAt: 'v1' } }, () => clock.t)
    assert.equal((await svc.getPublicRate()).rate, '2.0000')
    fail = true
    clock.t += S.PUBLIC_RATE_TTL_MS + 1
    await assert.rejects(svc.getPublicRate(), S.FinancingRateUnavailableError)
    fail = false
    assert.equal((await svc.getPublicRate()).rate, '2.0000', 'se recupera cuando el servidor vuelve')
  })

  test('respuesta sin tasa => error controlado', async () => {
    for (const bad of [null, {}, { rate: '' }, { rate: 2 }]) {
      const { svc } = mk(() => bad)
      await assert.rejects(svc.getPublicRate(), S.FinancingRateUnavailableError)
    }
  })

  test('guardar desde el panel invalida la memoria', async () => {
    let rate = '2.0000'
    const svc = new S.FinancingRateService(async (url, opts) => {
      if (opts?.method === 'PUT') { rate = opts.body.rate; return { rate: '2.1200', updatedAt: 'v2', history: [] } }
      return { rate, updatedAt: 'v1' }
    })
    assert.equal((await svc.getPublicRate()).rate, '2.0000')
    await svc.saveRate('2.12', 'v1')
    assert.equal((await svc.getPublicRate()).rate, '2.12')
  })

  test('errores de guardado: mensaje, código y error de campo del servidor', async () => {
    const svc = new S.FinancingRateService(async () => { throw { statusCode: 422, data: { data: { message: 'Formato inválido', errors: { rate: 'Usa punto' } } } } })
    await assert.rejects(svc.saveRate('2,5', 'v'), e => e.statusCode === 422 && e.field === 'Usa punto' && e.message === 'Formato inválido')
  })
})

describe('proveedor de cotización con la tasa configurada', () => {
  const provider = rate => new P.MockQuotationProvider({ getPublicRate: async () => rate })

  test('usa exactamente la tasa configurada (2.12 y 2.0126) y devuelve la tasa y versión aplicadas', async () => {
    const a = await provider({ rate: '2.1200', updatedAt: 'v-212' }).getQuote(15_000_000, 24, 'x')
    const b = await provider({ rate: '2.0126', updatedAt: 'v-2126' }).getQuote(15_000_000, 24, 'x')
    assert.equal(a.monthlyPayment, F.calculateMonthlyPayment(15_000_000, 24, 0.0212))
    assert.equal(b.monthlyPayment, F.calculateMonthlyPayment(15_000_000, 24, 0.020126))
    assert.equal(a.ratePercent, '2.1200')
    assert.equal(a.rateUpdatedAt, 'v-212')
    assert.equal(b.ratePercent, '2.0126')
    assert.equal(a.totalAmount, a.monthlyPayment * 24)
    assert.match(a.disclaimer, /2\.1200 % mensual/)
    assert.match(a.disclaimer, /tasa de usura vigente, fijada mensualmente/)
  })

  test('cambia la tasa → cambia la cuota del mismo monto y plazo (recálculo)', async () => {
    const rates = { rate: '2.0000', updatedAt: 'v1' }
    const p = new P.MockQuotationProvider({ getPublicRate: async () => rates })
    const before = await p.getQuote(20_000_000, 36, 'x')
    rates.rate = '2.5000'
    const after = await p.getQuote(20_000_000, 36, 'x')
    assert.ok(after.monthlyPayment > before.monthlyPayment)
    assert.equal(before.ratePercent, '2.0000', 'la cotización ya generada conserva la tasa con la que se calculó')
  })

  test('sin tasa disponible no hay cuota: el error se propaga (nada de tasa fija)', async () => {
    const p = new P.MockQuotationProvider({ getPublicRate: async () => { throw new S.FinancingRateUnavailableError() } })
    await assert.rejects(p.getQuote(15_000_000, 24, 'x'), S.FinancingRateUnavailableError)
  })

  test('un valor de tasa inválido que llegue del servidor tampoco produce cuota', async () => {
    await assert.rejects(provider({ rate: '2,5', updatedAt: 'v' }).getQuote(15_000_000, 24, 'x'), RangeError)
    await assert.rejects(provider({ rate: '9.0000', updatedAt: 'v' }).getQuote(15_000_000, 24, 'x'), RangeError)
  })

  test('cotización abortada: AbortError y ninguna cuota', async () => {
    const ac = new AbortController()
    ac.abort()
    await assert.rejects(provider({ rate: '2.0000', updatedAt: 'v' }).getQuote(15_000_000, 24, 'x', ac.signal), { name: 'AbortError' })
  })
})

describe('consumidores: ninguna tasa fija y ambos usan la tasa configurada', () => {
  const walk = (dir, out = []) => { for (const n of readdirSync(dir)) { const p = join(dir, n); statSync(p).isDirectory() ? walk(p, out) : out.push(p) } return out }

  test('no queda el 0.02 fijo ni el Math.ceil a centenas en el código de cotización', () => {
    for (const rel of ['providers/MockQuotationProvider.ts', 'services/QuotationService.ts', 'services/FinancingRateService.ts', 'composables/useSimulator.ts', 'shared/utils/financing.ts', 'components/simulator/SimulatorPanel.vue', 'components/forms/LeadForm.vue']) {
      const code = src(rel)
      assert.ok(!/rate\s*=\s*0\.02\b/.test(code), `${rel}: tasa fija`)
      assert.ok(!/Math\.ceil\(\s*\w+\s*\/\s*100\s*\)\s*\*\s*100/.test(code), `${rel}: redondeo a centenas`)
      assert.ok(!/setTimeout\(resolve,\s*800\)/.test(code), `${rel}: latencia simulada`)
    }
  })

  test('el único cálculo de cuota vive en shared/utils/financing.ts (no hay copias de la fórmula)', () => {
    const offenders = []
    for (const root of ['components', 'composables', 'pages', 'services', 'providers', 'server', 'utils']) {
      for (const f of walk(join(ROOT, root))) {
        if (!/\.(ts|vue)$/.test(f)) continue
        if (/Math\.pow\(\s*1\s*\+/.test(readFileSync(f, 'utf8'))) offenders.push(relative(ROOT, f))
      }
    }
    assert.deepEqual(offenders, [])
  })

  test('SimulatorPanel (vía useSimulator) y LeadForm cotizan solo con quotationService y muestran «no disponible» sin tasa', () => {
    const sim = src('composables/useSimulator.ts')
    assert.ok(sim.includes("quotationService.calculateQuotation(") && sim.includes('FinancingRateUnavailableError'))
    assert.match(sim, /currentQuote\.value = null/)
    const panel = src('components/simulator/SimulatorPanel.vue')
    assert.ok(panel.includes('quoteError') && panel.includes('data-testid="simulator-unavailable"'))
    assert.ok(panel.includes('useSimulator'))
    const lead = src('components/forms/LeadForm.vue')
    assert.ok(lead.includes("quotationService.calculateQuotation(") && lead.includes('FinancingRateUnavailableError'))
    assert.ok(lead.includes('data-testid="leadform-quote-unavailable"'))
    assert.ok(lead.includes('formatPesos(currentQuote.monthlyPayment)'), 'la cuota se muestra con formato de pesos, no con decimales crudos')
    assert.equal((lead.match(/quotationService\.calculateQuotation\(/g) ?? []).length, 1, 'una sola llamada (refreshQuote)')
  })

  test('el formulario de solicitud conserva la tasa con la que se cotizó (condiciones del momento de la solicitud)', () => {
    const lead = src('components/forms/LeadForm.vue')
    assert.ok(lead.includes('quote_rate_percent') && lead.includes('quote_rate_version') && lead.includes('quote_monthly_payment'))
    assert.ok(src('providers/MockLeadProvider.ts').includes('metadata?:'))
  })

  test('el aviso informativo del simulador se conserva (tasa referencial / usura vigente)', async () => {
    const q = await new P.MockQuotationProvider({ getPublicRate: async () => ({ rate: '2.0000', updatedAt: 'v' }) }).getQuote(10_000_000, 12, 'x')
    assert.match(q.disclaimer, /estimación preliminar/)
    assert.match(q.disclaimer, /Las condiciones definitivas estarán sujetas al estudio y aprobación de la solicitud/)
  })
})
