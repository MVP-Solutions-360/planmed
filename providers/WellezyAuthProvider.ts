import type { AuthProvider } from './AuthProvider'
import type { AdminUser } from '~/types/auth'
import { useRequestFetch } from '#imports'

// Habla únicamente con las rutas internas de Nitro (/api/auth/*). Nitro es quien se comunica con Wellezy Hub;
// el Bearer de Wellezy nunca llega a este código.

const GENERIC_ERROR = 'No fue posible conectar con el servicio de autenticación. Intenta nuevamente.'

function toError(e: any): Error & { statusCode?: number, errors?: Record<string, string[]> } {
  const data = e?.data?.data ?? e?.data
  const message = data?.message
  const error = new Error(typeof message === 'string' && message ? message : GENERIC_ERROR) as Error & { statusCode?: number, errors?: Record<string, string[]> }
  error.statusCode = e?.statusCode ?? e?.response?.status
  error.errors = data?.errors && typeof data.errors === 'object' ? data.errors : {}
  return error
}

export class WellezyAuthProvider implements AuthProvider {
  async login(email: string, password: string): Promise<AdminUser> {
    const request = useRequestFetch()
    try {
      const res = await request<{ user: AdminUser }>('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })
      return res.user
    } catch (e) {
      throw toError(e)
    }
  }

  async changePassword(currentPassword: string, password: string, confirmation: string): Promise<AdminUser | null> {
    const request = useRequestFetch()
    try {
      const res = await request<{ user: AdminUser | null }>('/api/auth/password', {
        method: 'POST',
        body: { current_password: currentPassword, password, password_confirmation: confirmation }
      })
      return res.user ?? null
    } catch (e) {
      throw toError(e)
    }
  }

  async logout(): Promise<void> {
    const request = useRequestFetch()
    await request('/api/auth/logout', { method: 'POST' })
  }

  async getCurrentUser(): Promise<AdminUser | null> {
    // useRequestFetch reenvía las cookies de la petición original durante SSR.
    const request = useRequestFetch()
    try {
      const res = await request<{ user: AdminUser }>('/api/auth/me')
      return res.user
    } catch {
      return null
    }
  }
}
