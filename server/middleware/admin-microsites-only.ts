// Roles limitados a Micrositios (hoy «Asesora financiera»): en la API administrativa solo alcanzan /api/admin/prp. La regla de quién está
// limitado vive en shared/utils/adminPasswordGate.ts (la misma que usa la navegación). Es una restricción de ESTA web: no cambia permisos en
// Wellezy Hub, que sigue decidiendo cada operación de Micrositios. Nunca concede acceso: solo deniega. /api/auth/** queda libre.
import { isMicrositesOnlyUser, normalizeAdminPath } from '#shared/utils/adminPasswordGate'

// Lo ÚNICO permitido: el listado/alta y un micrositio por id numérico (las rutas de server/api/admin/prp).
const MICROSITES_API = /^\/api\/admin\/prp(\/\d+)?$/

export default defineEventHandler(async (event) => {
  // `event.path` es la ruta decodificada con la que el router elige el manejador (`getRequestURL` conservaría `/api/%61dmin/…`).
  const path = normalizeAdminPath(event.path.split('?')[0]!)
  if (!path.startsWith('/api/admin/')) return
  if (!getCookie(event, 'planmed-admin')) return // sin sesión: cada ruta responde 401 por su cuenta

  const session = await useAdminSession(event)
  const { token, user } = session.data
  if (!token || !isMicrositesOnlyUser(user)) return

  // El cambio obligatorio de contraseña tiene prioridad y alcanza también a Micrositios.
  if (user!.mustChangePassword === true) {
    const message = 'Debes cambiar tu contraseña temporal antes de continuar.'
    throw createError({ statusCode: 403, message, data: { message, code: 'password_change_required' } })
  }
  if (MICROSITES_API.test(path)) return

  // La cookie puede ser anterior a un cambio de rol (o no saber aún que es superadmin): antes de denegar se confirma con Hub.
  const res = await wellezyMe(event, token)
  if (res.status === 200 && res.data && isAuthorizedUser(event, res.data.user) && !isMicrositesOnlyUser(toPublicUser(res.data.user, event))) return

  const message = 'Tu perfil solo tiene acceso a Micrositios.'
  throw createError({ statusCode: 403, message, data: { message, code: 'microsites_only' } })
})
