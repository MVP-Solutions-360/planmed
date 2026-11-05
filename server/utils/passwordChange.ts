import type { H3Event } from 'h3'

// Cambio obligatorio de contraseña (contraseña temporal de un colaborador recién creado). Hub es la ÚNICA autoridad: valida la contraseña
// actual, la política y la confirmación en POST /auth/password/change. El portal solo reenvía los tres campos, traduce la respuesta y
// renueva la sesión; no duplica ninguna regla de contraseña. Helpers de Nitro (createError, authError, wellezyRequest, …) son auto-imports.
//
// Comportamiento real de Hub verificado en código (PasswordController::change + SetUserPassword): al cambiar, revoca TODOS los tokens
// Sanctum del usuario, incluido el que se usó. Por eso, tras el 200 el portal inicia sesión de nuevo con la contraseña recién elegida
// (que la persona acaba de escribir) para obtener un token nuevo; si eso falla, la sesión se cierra y se pide ingresar otra vez.

export const PASSWORD_FIELDS = ['current_password', 'password', 'password_confirmation'] as const
export type PasswordField = typeof PASSWORD_FIELDS[number]
export interface PasswordChangeInput { current_password: string, password: string, password_confirmation: string }

export const MSG_PASSWORD_INVALID = 'Revisa los datos ingresados.'
export const MSG_PASSWORD_UNCONFIRMED = 'No se pudo confirmar el cambio de contraseña. Intenta iniciar sesión con la contraseña nueva; si no funciona, usa la temporal.'
export const MSG_PASSWORD_TOO_MANY = 'Demasiados intentos. Espera unos minutos e intenta nuevamente.'

/** Lista blanca: solo los tres campos, como texto no vacío. Las reglas de contraseña NO se validan aquí (las aplica Hub). */
export function parsePasswordChangeBody(body: unknown): PasswordChangeInput {
  const src = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {}
  const errors: Record<string, string[]> = {}
  const out = {} as PasswordChangeInput
  for (const f of PASSWORD_FIELDS) {
    const v = src[f]
    if (typeof v !== 'string' || !v) errors[f] = ['Este campo es obligatorio.']
    else if (v.length > 1024) errors[f] = ['El valor es demasiado largo.']
    else out[f] = v
  }
  if (Object.keys(errors).length) throw createError({ statusCode: 422, message: MSG_PASSWORD_INVALID, data: { message: MSG_PASSWORD_INVALID, errors } })
  return out
}

/** Errores de campo que Hub devuelve: solo los tres campos, como arreglo de textos acotados; lo demás se resume en `_form`. */
export function normalizePasswordErrors(raw: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    const msgs = (Array.isArray(val) ? val : [val]).filter((m): m is string => typeof m === 'string' && m.length > 0).map(m => m.slice(0, 300))
    if (!msgs.length) continue
    const field = (PASSWORD_FIELDS as readonly string[]).includes(key) ? key : '_form'
    out[field] = [...(out[field] ?? []), ...msgs].slice(0, 5)
  }
  return out
}

/**
 * Cambia la contraseña del usuario de la sesión. Devuelve el usuario público con la sesión renovada, o `null` si la contraseña se cambió pero
 * no se pudo renovar la sesión (se cerró y hay que iniciar sesión de nuevo).
 */
export async function changeOwnPassword(event: H3Event, input: PasswordChangeInput): Promise<{ user: PublicAdminUser | null }> {
  const session = await useAdminSession(event)
  const token = session.data.token
  const email = session.data.user?.email
  if (!token || !email) throw authError(401, 'No autenticado')

  const res = await wellezyRequest<any>(event, token, 'POST', '/auth/password/change', { body: { ...input } })
  const hubMessage = typeof res.data?.message === 'string' && res.data.message ? res.data.message.slice(0, 300) : ''
  const fail = (statusCode: number, message: string, extra: Record<string, unknown> = {}) => createError({ statusCode, message, data: { message, ...extra } })

  switch (res.status) {
    case 200:
      break
    case 401:
      await session.clear() // token vencido o ya revocado
      throw authError(401, 'No autenticado')
    case 403:
      throw authError(403, MSG_FORBIDDEN)
    case 422:
      throw fail(422, hubMessage || MSG_PASSWORD_INVALID, { errors: normalizePasswordErrors(res.data?.errors) })
    case 429:
      throw fail(429, MSG_PASSWORD_TOO_MANY)
    case 503:
      throw fail(503, MSG_UNAVAILABLE)
    default:
      // 0 (timeout/red) u otro estado: no se sabe si el cambio se aplicó.
      throw fail(504, MSG_PASSWORD_UNCONFIRMED, { code: 'password_change_unconfirmed' })
  }

  // Hub revocó todos los tokens: se obtiene uno nuevo con la contraseña que la persona acaba de elegir.
  const login = await wellezyLogin(event, email, input.password)
  if (login.status !== 200 || !login.data || !isAuthorizedUser(event, login.data.user)) {
    await session.clear()
    return { user: null }
  }
  const publicUser = toPublicUser(login.data.user, event)
  await session.update({ token: login.data.token, user: publicUser })
  return { user: publicUser }
}
