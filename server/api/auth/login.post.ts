export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  setHeader(event, 'Cache-Control', 'no-store')

  const body = await readBody(event).catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!email || !password || email.length > 255 || password.length > 1024) {
    throw authError(422, 'Ingresa un correo electrónico y una contraseña válidos.')
  }

  const session = await useAdminSession(event)

  const res = await wellezyLogin(event, email, password)

  switch (res.status) {
    case 200:
      break
    case 401:
      throw authError(401, 'Correo electrónico o contraseña incorrectos.')
    case 403:
      throw authError(403, MSG_FORBIDDEN)
    case 422:
      throw authError(422, 'Ingresa un correo electrónico y una contraseña válidos.')
    case 429:
      throw authError(429, 'Demasiados intentos. Espera unos minutos e intenta nuevamente.')
    default:
      throw authError(503, MSG_UNAVAILABLE)
  }

  const { token, user } = res.data!

  if (!isAuthorizedUser(event, user)) {
    // Credenciales válidas pero rol no autorizado: se revoca el token recién emitido y no se crea sesión.
    await wellezyLogout(event, token)
    await session.clear()
    throw authError(403, MSG_FORBIDDEN)
  }

  const publicUser = toPublicUser(user, event)
  await session.update({ token, user: publicUser })
  return { user: publicUser }
})
