// Cambio de contraseña del usuario de la sesión (obligatorio con contraseña temporal). Orden: origen → sesión → cuerpo (lista blanca) → Hub.
// Hub valida contraseña actual, política y confirmación (POST /auth/password/change); aquí no se duplica ninguna regla. Nunca se registra
// ni se devuelve ninguna contraseña.
export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  setHeader(event, 'Cache-Control', 'no-store')

  const session = await useAdminSession(event)
  if (!session.data.token || !session.data.user) throw authError(401, 'No autenticado')

  const input = parsePasswordChangeBody(await readBody(event).catch(() => null))
  return await changeOwnPassword(event, input)
})
