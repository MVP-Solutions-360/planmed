// POST /api/forms/credit-study: formulario «Estudio de créditos» → correo electrónico (SMTP). Ver server/utils/creditStudy.ts.
export default defineEventHandler(event => handleCreditStudy(event))
