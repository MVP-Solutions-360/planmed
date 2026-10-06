import type { H3Event } from 'h3'
import type { WellezyUser } from './wellezy'

export interface PublicAdminUser {
  id: number
  name: string
  email: string
  role: { id: number, name: string }
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
    role: { id: Number(user.role!.id), name: user.role!.name }
  }
}

export const MSG_UNAVAILABLE = 'No fue posible conectar con el servicio de autenticación. Intenta nuevamente.'
export const MSG_FORBIDDEN = 'No tienes acceso al panel administrativo de Planmed.'

export function authError(statusCode: number, message: string) {
  return createError({ statusCode, message, data: { message } })
}

// Defensa CSRF adicional a SameSite: las mutaciones deben venir del mismo origen.
export function assertSameOrigin(event: H3Event) {
  const method = event.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return
  const origin = getRequestHeader(event, 'origin')
  const host = getRequestHeader(event, 'x-forwarded-host') || getRequestHeader(event, 'host')
  if (origin) {
    let originHost = ''
    try { originHost = new URL(origin).host } catch { /* origen inválido */ }
    if (!host || originHost !== host) throw authError(403, 'Origen no permitido')
    return
  }
  const site = getRequestHeader(event, 'sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') throw authError(403, 'Origen no permitido')
}
