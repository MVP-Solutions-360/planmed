// POST /api/forms/valuation: solicitud de valoración (formulario «Pide tu cita») → CRM médico. Ver server/utils/valuation.ts.
export default defineEventHandler(event => handleValuation(event))
