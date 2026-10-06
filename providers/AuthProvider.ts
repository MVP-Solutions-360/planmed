import type { AdminUser } from '~/types/auth'

// La sesión vive en el servidor (cookie httpOnly): el provider nunca maneja tokens.
export interface AuthProvider {
  login(email: string, password: string): Promise<AdminUser>
  logout(): Promise<void>
  getCurrentUser(): Promise<AdminUser | null>
}
