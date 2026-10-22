// POST /api/forms/prp-enrollment: inscripción al Programa de referidos (PRP) → Wellezy Hub. Ver server/utils/prpEnrollment.ts.
export default defineEventHandler(event => handlePrpEnrollment(event))
