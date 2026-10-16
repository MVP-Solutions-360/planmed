export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const session = await useAdminSession(event)
  const token = session.data.token
  if (!token) throw authError(401, 'No autenticado')

  const res = await wellezyMe(event, token)

  if (res.status === 401) {
    // Token vencido o revocado en Wellezy.
    await session.clear()
    throw authError(401, 'No autenticado')
  }
  if (res.status === 403) {
    await session.clear()
    throw authError(403, MSG_FORBIDDEN)
  }
  if (res.status !== 200) {
    // Fallo temporal del Hub: no se destruye la sesión.
    throw authError(503, MSG_UNAVAILABLE)
  }

  const user = res.data!.user
  if (!isAuthorizedUser(event, user)) {
    // El rol cambió o fue revocado desde el último login.
    await wellezyLogout(event, token)
    await session.clear()
    throw authError(403, MSG_FORBIDDEN)
  }

  const publicUser = toPublicUser(user, event)
  await session.update({ token, user: publicUser })
  return { user: publicUser }
})
