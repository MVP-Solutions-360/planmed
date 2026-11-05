// Reglas de navegación del panel (/admin/**) según sesión y cambio obligatorio de contraseña. Función pura: la usa el middleware de rutas y
// se prueba sin Nuxt. La seguridad real la imponen el servidor (server/middleware/admin-password-change.ts) y Hub; esto solo guía la interfaz.
export const ADMIN_LOGIN_PATH = '/admin/login'
export const ADMIN_HOME_PATH = '/admin'
export const ADMIN_CHANGE_PASSWORD_PATH = '/admin/cambiar-contrasena'

/** Ruta a la que hay que redirigir, o null si se puede continuar. */
export function adminGateRedirect(path: string, user: { mustChangePassword?: boolean } | null | undefined): string | null {
  const p = path.length > 1 ? path.replace(/\/+$/, '') : path
  if (p !== ADMIN_HOME_PATH && !p.startsWith(`${ADMIN_HOME_PATH}/`)) return null

  if (p === ADMIN_LOGIN_PATH) {
    if (!user) return null
    return user.mustChangePassword === true ? ADMIN_CHANGE_PASSWORD_PATH : ADMIN_HOME_PATH
  }
  if (!user) return ADMIN_LOGIN_PATH
  if (user.mustChangePassword === true) return p === ADMIN_CHANGE_PASSWORD_PATH ? null : ADMIN_CHANGE_PASSWORD_PATH
  return p === ADMIN_CHANGE_PASSWORD_PATH ? ADMIN_HOME_PATH : null
}
