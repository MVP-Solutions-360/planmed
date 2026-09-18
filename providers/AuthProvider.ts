import type { AdminUser } from '~/types/auth'

export interface AuthProvider {
  login(email: string, password: string): Promise<{ user: AdminUser, token: string }>
  logout(): Promise<void>
  getCurrentUser(token: string): Promise<AdminUser | null>
}