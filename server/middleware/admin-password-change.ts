// Bloqueo del panel mientras haya un cambio de contraseña obligatorio (contraseña temporal sin cambiar). Se aplica a TODA ruta /api/admin/**,
// incluidas las que solo escriben contenido local y no pasan por Hub (que de todos modos respondería 403 password_change_required).
// /api/auth/** queda libre: es donde se cambia la contraseña y se cierra la sesión. La bandera viene de la cookie sellada (la fija el servidor
// con lo que Hub informó al iniciar sesión o consultar /auth/me); el navegador no puede alterarla.
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/admin/')) return
  if (!getCookie(event, 'planmed-admin')) return // sin sesión: cada ruta responde 401 por su cuenta

  const session = await useAdminSession(event)
  if (session.data.user?.mustChangePassword === true) {
    const message = 'Debes cambiar tu contraseña temporal antes de continuar.'
    throw createError({ statusCode: 403, message, data: { message, code: 'password_change_required' } })
  }
})
