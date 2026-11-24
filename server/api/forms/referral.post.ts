// POST /api/forms/referral: inscripción al programa de referidos (ReferralForm) → correo. NO es el PRP de pacientes. Ver server/utils/referral.ts.
export default defineEventHandler(event => handleReferral(event))
