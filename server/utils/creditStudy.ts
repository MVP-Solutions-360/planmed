import type { H3Event } from 'h3'
import {
  CREDIT_FIELDS, CREDIT_FILE_IDS, CREDIT_FILE_KINDS, CREDIT_INPUT_IDS, CREDIT_LIMITS, CREDIT_STEPS, EGR, ING,
  detectFileKind, isEnabled, isVisible, normalizeCreditValues, sumFields, validateCreditStudy,
  type CreditFileKind, type CreditValues
} from '#shared/utils/creditStudy'
import {
  CREDIT_STUDY_RECIPIENTS, cleanLine, contentFingerprint, deliverFormMail, fmtMoney, formFail, isRateLimited, renderFormEmail, requireMailConfig,
  resetMailGuards, setMailTransportFactory, type MailSection
} from './formMail'

// Formulario «Estudio de créditos» → CORREO ELECTRÓNICO. Solo servidor. La integración con el CRM está aplazada: aquí no se llama a ningún CRM.
// El transporte SMTP, la configuración, los guardas (límite y duplicados), el manejo de errores y la plantilla base son COMUNES a todos los formularios
// por correo y viven en ./formMail. Aquí queda solo lo propio del estudio de crédito:
//  · El navegador envía multipart/form-data (campos + documentos). Esta ruta VALIDA todo de nuevo y solo después arma y envía el correo.
//  · Destinatarios: NUXT_CREDIT_STUDY_TO/CC (servidor). Nada de lo que envía el navegador puede cambiar el destino.
//  · Documentos: tipo REAL por firma (PDF, PNG, JPEG), no por nombre ni por el tipo declarado; tamaño por documento y por solicitud; nombres de adjunto
//    generados por el servidor (jamás el nombre original). Viven solo en memoria durante la petición: no se escriben a disco y se descartan al terminar,
//    también si el envío falla.

const TAG = 'credit-study'
const FORM = 'credit-study'

/** Solo pruebas: vacía el estado en memoria y reemplaza el transporte SMTP (nunca se envían correos reales en las pruebas). */
export const resetCreditStudyGuards = resetMailGuards
export const setCreditStudyTransportFactory = setMailTransportFactory

export interface CreditAttachment { fieldId: string, label: string, filename: string, kind: CreditFileKind, content: Uint8Array }

const MONEY_IDS = new Set([...ING, ...EGR, 'cy-ingresos', 'valor-cotizado', 'valor-financiar', 've-valor', 'br-valor', 've-prenda'])

function sectionsOf(values: CreditValues): MailSection[] {
  const out: MailSection[] = []
  for (const step of CREDIT_STEPS) {
    for (const block of step.blocks) {
      const rows: MailSection['rows'] = []
      const procs: string[] = []
      for (const fd of block.fields) {
        if (fd.type === 'file' || fd.sum || !isVisible(fd, values) || !isEnabled(fd, values)) continue
        if (fd.type === 'checkbox') { if (values[fd.id] === true) procs.push(fd.label); continue }
        const v = String(values[fd.id] ?? '')
        if (!v) continue
        const label = fd.hint ? `${fd.label} (${fd.hint})` : fd.label
        rows.push({ label, value: MONEY_IDS.has(fd.id) && Number.isFinite(Number(v)) ? fmtMoney(Number(v)) : v })
      }
      if (procs.length) rows.unshift({ label: 'Procedimientos', value: procs.join(', ') })
      if (!rows.length) continue // bloque sin ningún dato: no se lista (ni sus totales)
      // Los totales se recalculan en el servidor a partir de los valores recibidos.
      for (const fd of block.fields) if (fd.sum) rows.push({ label: fd.label, value: fmtMoney(sumFields(values, fd.sum)) })
      out.push({ title: block.title ? `${step.label} — ${block.title}` : step.label, rows })
    }
  }
  return out
}

/** Asunto, texto y HTML del correo. Todo valor se escapa; no hay nada que venga del navegador salvo los datos del formulario ya validados. */
export function buildCreditStudyEmail(input: { brand: string, receivedAt: Date, values: CreditValues, attachments: CreditAttachment[] }) {
  const { brand, values, attachments } = input
  const subject = cleanLine(`[${brand}] Nueva solicitud de estudio de crédito`).slice(0, 150)
  const documents = attachments.map(a => `${a.label}: ${a.filename} (${Math.max(1, Math.round(a.content.byteLength / 1024))} KB)`)
  const { text, html } = renderFormEmail({
    brand,
    title: 'Solicitud de estudio de crédito',
    receivedAt: input.receivedAt,
    sections: sectionsOf(values),
    documents,
    footer: 'Mensaje generado automáticamente por el formulario web. Contiene información personal y financiera: trátala como confidencial.'
  })
  return { subject, text, html }
}

const slug = (id: string) => id.replace(/^archivo-/, '').replace(/[^a-z0-9-]/g, '')

/** Manejador de POST /api/forms/credit-study. Devuelve { ok: true } solo si el servidor SMTP aceptó el mensaje. */
export async function handleCreditStudy(event: H3Event) {
  assertSameOrigin(event)
  setHeader(event, 'Cache-Control', 'no-store')

  // Configuración de correo y destinatarios (solo servidor). Se evalúa ANTES de leer el cuerpo y de consumir el límite por IP.
  const { runtime: config, config: mail } = requireMailConfig(event, TAG, CREDIT_STUDY_RECIPIENTS)

  const now = Date.now()
  if (isRateLimited(FORM, event, config, now)) formFail(429, 'Recibimos demasiados intentos. Espera unos minutos e inténtalo de nuevo.', { reason: 'rate_limited' })

  // El tamaño se comprueba por la cabecera ANTES de leer: Node no entrega más bytes que los declarados.
  const length = Number(getRequestHeader(event, 'content-length'))
  if (!Number.isFinite(length) || length <= 0) formFail(411, 'No pudimos procesar el envío. Inténtalo de nuevo.', { reason: 'length_required' })
  if (length > CREDIT_LIMITS.maxRequestBytes) formFail(413, `El envío es demasiado grande. Los documentos no pueden superar ${CREDIT_LIMITS.maxTotalFileBytes / 1024 / 1024} MB en total.`, { reason: 'too_large' })
  if (!String(getRequestHeader(event, 'content-type') ?? '').toLowerCase().startsWith('multipart/form-data')) {
    formFail(415, 'No pudimos procesar el envío. Inténtalo de nuevo.', { reason: 'malformed' })
  }

  let parts: Awaited<ReturnType<typeof readMultipartFormData>>
  try { parts = await readMultipartFormData(event) } catch { parts = undefined }
  if (!parts || !parts.length || parts.length > CREDIT_LIMITS.maxParts) formFail(400, 'No pudimos procesar el envío. Inténtalo de nuevo.', { reason: 'malformed' })

  // Separa campos y documentos. Los nombres desconocidos se ignoran (en particular cualquier intento de fijar destinatarios); los repetidos se rechazan.
  const raw: Record<string, string> = {}
  const buffers: Record<string, Uint8Array> = {}
  const seen = new Set<string>()
  for (const part of parts) {
    const name = part.name
    if (!name) continue
    const isFile = CREDIT_FILE_IDS.includes(name)
    if (!isFile && !CREDIT_INPUT_IDS.includes(name)) continue
    if (seen.has(name)) formFail(400, 'No pudimos procesar el envío. Inténtalo de nuevo.', { reason: 'malformed' })
    seen.add(name)
    if (isFile) buffers[name] = part.data
    else raw[name] = part.data.byteLength > CREDIT_LIMITS.maxTextPartBytes ? 'x'.repeat(CREDIT_LIMITS.maxTextLength + 1) : Buffer.from(part.data).toString('utf8')
  }

  const values = normalizeCreditValues(raw)
  const metas: Record<string, { size: number }> = {}
  for (const id of CREDIT_FILE_IDS) {
    const fd = CREDIT_FIELDS.find(x => x.id === id)!
    if (buffers[id] && isVisible(fd, values)) metas[id] = { size: buffers[id]!.byteLength }
  }
  const errors = validateCreditStudy(values, metas)

  // Tipo real de cada documento (firma de los primeros bytes).
  const kinds: Record<string, CreditFileKind> = {}
  for (const id of Object.keys(metas)) {
    if (errors[id]) continue
    const kind = detectFileKind(buffers[id]!)
    if (kind) kinds[id] = kind
    else errors[id] = 'Formato no permitido. Usa PDF, PNG o JPG.'
  }
  if (Object.keys(errors).length) formFail(422, 'Revisa los datos ingresados.', { reason: 'validation', errors })

  const attachments: CreditAttachment[] = []
  for (const id of CREDIT_FILE_IDS) {
    const kind = kinds[id]
    if (!kind) continue
    const fd = CREDIT_FIELDS.find(x => x.id === id)!
    attachments.push({ fieldId: id, label: fd.label, filename: `${String(attachments.length + 1).padStart(2, '0')}-${slug(id)}.${CREDIT_FILE_KINDS[kind].ext}`, kind, content: buffers[id]! })
  }

  const { subject, text, html } = buildCreditStudyEmail({ brand: String(config.public?.appName || 'Planmed'), receivedAt: new Date(now), values, attachments })
  try {
    return await deliverFormMail({
      tag: TAG,
      form: FORM,
      print: contentFingerprint(values, attachments.map(a => ({ id: a.fieldId, content: a.content }))),
      now,
      mail,
      subject,
      text,
      html,
      replyTo: String(values.email),
      attachments: attachments.map(a => ({ filename: a.filename, content: a.content, contentType: CREDIT_FILE_KINDS[a.kind].mime }))
    })
  } finally {
    // Los documentos solo existían en memoria: se sueltan las referencias, haya habido éxito o error.
    for (const k of Object.keys(buffers)) delete buffers[k]
    attachments.length = 0
  }
}
