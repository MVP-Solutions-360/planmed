import type { AdminUser } from '~/types/auth'

// La sesión vive en el servidor (cookie httpOnly): el provider nunca maneja tokens.
export interface AuthProvider {
  login(email: string, password: string): Promise<AdminUser>
  logout(): Promise<void>
  getCurrentUser(): Promise<AdminUser | null>
  /** Cambio de contraseña propio (Hub valida). Devuelve el usuario con la sesión renovada, o null si hay que iniciar sesión de nuevo. */
  changePassword(currentPassword: string, password: string, confirmation: string): Promise<AdminUser | null>
}
