// Reglas de navegación del panel (/admin/**) según sesión, cambio obligatorio de contraseña y roles limitados a Micrositios. Función pura: la usa el middleware de rutas y
// se prueba sin Nuxt. La seguridad real la imponen el servidor (server/middleware/admin-password-change.ts) y Hub; esto solo guía la interfaz.
export const ADMIN_LOGIN_PATH = '/admin/login'
export const ADMIN_HOME_PATH = '/admin'
export const ADMIN_CHANGE_PASSWORD_PATH = '/admin/cambiar-contrasena'

export const ADMIN_MICROSITES_PATH = '/admin/micrositios'

/** Roles de Wellezy Hub (nombre en minúsculas) cuyo panel se limita a Micrositios. Ni el líder de la línea ni el superadmin global se restringen. */
export const MICROSITES_ONLY_ROLE_NAMES = ['asesora financiera']

type GateUser = { mustChangePassword?: boolean, isAreaLeader?: boolean, isGlobalAdmin?: boolean, role?: { name?: string } | null }

/** ¿Este usuario solo puede usar Micrositios? Usa el rol que el servidor obtuvo de Hub; no concede ni cambia permisos de Hub. */
export function isMicrositesOnlyUser(user: GateUser | null | undefined): boolean {
  if (!user || user.isGlobalAdmin === true || user.isAreaLeader === true) return false
  return MICROSITES_ONLY_ROLE_NAMES.includes(String(user.role?.name ?? '').trim().toLowerCase())
}

/**
 * Ruta normalizada para COMPARAR (no para navegar): minúsculas, sin barras repetidas y sin barra final. El router de Nuxt no distingue
 * mayúsculas: `/Admin/noticias` abre la misma pantalla que `/admin/noticias`.
 */
export function normalizeAdminPath(path: string): string {
  const p = path.toLowerCase().replace(/\/{2,}/g, '/')
  return p.length > 1 ? p.replace(/\/+$/, '') : p
}

export function isAdminPanelPath(path: string): boolean {
  const p = normalizeAdminPath(path)
  return p === ADMIN_HOME_PATH || p.startsWith(`${ADMIN_HOME_PATH}/`)
}

/** Ruta a la que hay que redirigir, o null si se puede continuar. */
export function adminGateRedirect(path: string, user: GateUser | null | undefined): string | null {
  if (!isAdminPanelPath(path)) return null
  const p = normalizeAdminPath(path)
  const micrositesOnly = isMicrositesOnlyUser(user)
  const home = micrositesOnly ? ADMIN_MICROSITES_PATH : ADMIN_HOME_PATH

  if (p === ADMIN_LOGIN_PATH) {
    if (!user) return null
    return user.mustChangePassword === true ? ADMIN_CHANGE_PASSWORD_PATH : home
  }
  if (!user) return ADMIN_LOGIN_PATH
  if (user.mustChangePassword === true) return p === ADMIN_CHANGE_PASSWORD_PATH ? null : ADMIN_CHANGE_PASSWORD_PATH
  if (p === ADMIN_CHANGE_PASSWORD_PATH) return home
  if (micrositesOnly && p !== ADMIN_MICROSITES_PATH && !p.startsWith(`${ADMIN_MICROSITES_PATH}/`)) return ADMIN_MICROSITES_PATH
  return null
}
