import type { H3Event } from 'h3'
import type { WellezyUser } from './wellezy'
import { wellezyMe } from './wellezy'

export interface PublicAdminUser {
  id: number
  name: string
  email: string
  role: { id: number, name: string }
  isAreaLeader: boolean
}

interface AdminSessionData {
  token?: string
  user?: PublicAdminUser
}

const SESSION_MAX_AGE = 60 * 60 * 8

function sessionOptions(event: H3Event) {
  const password = String(useRuntimeConfig(event).sessionPassword || '')
  if (password.length < 32) {
    console.error('[auth] NUXT_SESSION_PASSWORD no está configurada (mínimo 32 caracteres).')
    throw createError({ statusCode: 503, message: 'No fue posible conectar con el servicio de autenticación. Intenta nuevamente.' })
  }
  return {
    name: 'planmed-admin',
    password,
    maxAge: SESSION_MAX_AGE,
    cookie: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: !import.meta.dev,
      path: '/'
    }
  }
}

export function useAdminSession(event: H3Event) {
  return useSession<AdminSessionData>(event, sessionOptions(event))
}

// IDs de rol autorizados para el CMS (configuración de runtime NUXT_PLANMED_ADMIN_ROLE_IDS, p. ej. "19" o "19,25").
export function allowedRoleIds(event: H3Event): number[] {
  return String(useRuntimeConfig(event).planmedAdminRoleIds ?? '')
    .split(',')
    .map(s => Number(s.trim()))
    .filter(n => Number.isSafeInteger(n) && n > 0)
}

export function isAuthorizedUser(event: H3Event, user: WellezyUser): boolean {
  return !!user.role && allowedRoleIds(event).includes(Number(user.role.id))
}

// Solo los datos públicos mínimos: nunca el token ni los permisos.
export function toPublicUser(user: WellezyUser): PublicAdminUser {
  return {
    id: Number(user.id),
    name: user.name,
    email: user.email,
    role: { id: Number(user.role!.id), name: user.role!.name },
    isAreaLeader: user.is_area_leader === true
  }
}

// Autoridad de servidor para la sección Configuración: solo el líder de la línea
// (personnels.is_area_leader = true en Wellezy Hub), que NO es lo mismo que ser administrador del CMS.
// Se consulta Hub en cada llamada (no se confía en el valor cacheado en la cookie de sesión).
export async function requireAreaLeader(event: H3Event): Promise<WellezyUser> {
  const session = await useAdminSession(event)
  const token = session.data.token
  if (!token) throw authError(401, 'No autenticado')

  const res = await wellezyMe(event, token)
  if (res.status === 401) {
    await session.clear()
    throw authError(401, 'No autenticado')
  }
  if (res.status !== 200) throw authError(503, MSG_UNAVAILABLE)

  const user = res.data!.user
  if (!isAuthorizedUser(event, user) || user.is_area_leader !== true) throw authError(403, MSG_LEADER_ONLY)
  return user
}

export const MSG_UNAVAILABLE = 'No fue posible conectar con el servicio de autenticación. Intenta nuevamente.'
export const MSG_LEADER_ONLY = 'Solo el líder de la línea puede acceder a la configuración.'
export const MSG_FORBIDDEN = 'No tienes acceso al panel administrativo de Planmed.'

export function authError(statusCode: number, message: string) {
  return createError({ statusCode, message, data: { message } })
}

// assertSameOrigin vive en server/utils/origin.ts (auto-import de Nitro).
