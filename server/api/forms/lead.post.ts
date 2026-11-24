// POST /api/forms/lead: solicitud de financiación (LeadForm del simulador) → correo. Ver server/utils/leadForm.ts.
export default defineEventHandler(event => handleLead(event))
