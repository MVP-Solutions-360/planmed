import { MockAuthProvider } from '~/providers/MockAuthProvider'
import type { AuthProvider } from '~/providers/AuthProvider'
import type { AdminUser } from '~/types/auth'
import { useCookie, useState } from '#imports'

class AuthService {
  private provider: AuthProvider;

  constructor(provider: AuthProvider) {
    this.provider = provider;
  }

  // Reactive state getters
  public getUser() {
    return useState<AdminUser | null>('auth-user', () => null)
  }

  public getToken() {
    return useCookie<string | null>('admin-auth-token', {
      watch: true,
      path: '/admin',
      maxAge: 60 * 60 * 24 // 1 day
    })
  }

  public isAuthenticated(): boolean {
    return !!this.getToken().value
  }

  public can(permission: string): boolean {
    const user = this.getUser().value
    if (!user) return false;
    
    // CRÍTICO: Ambos roles tienen exactamente los mismos privilegios en Planmed.
    // 'Administrador' y 'Diseñador gráfico' pueden hacer todo en el CMS.
    return true; 
  }

  public async login(email: string, password: string): Promise<void> {
    try {
      const { user, token } = await this.provider.login(email, password)
      
      const tokenCookie = this.getToken()
      tokenCookie.value = token
      
      const userState = this.getUser()
      userState.value = user
    } catch (error) {
      throw error
    }
  }

  public async logout(): Promise<void> {
    await this.provider.logout()
    
    const tokenCookie = this.getToken()
    tokenCookie.value = null
    
    const userState = this.getUser()
    userState.value = null
  }

  public async loadUserSession(): Promise<boolean> {
    const token = this.getToken().value
    const userState = this.getUser()

    if (!token) {
      userState.value = null
      return false
    }

    // Si ya tenemos el usuario en estado, no recargamos
    if (userState.value) return true;

    try {
      const user = await this.provider.getCurrentUser(token)
      if (user) {
        userState.value = user
        return true
      } else {
        // Token inválido
        this.getToken().value = null
        userState.value = null
        return false
      }
    } catch (e) {
      this.getToken().value = null
      userState.value = null
      return false
    }
  }
}

export const authService = new AuthService(new MockAuthProvider())