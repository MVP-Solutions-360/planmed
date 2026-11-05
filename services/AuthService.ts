import { WellezyAuthProvider } from '~/providers/WellezyAuthProvider'
import type { AuthProvider } from '~/providers/AuthProvider'
import type { AdminUser } from '~/types/auth'
import { useState } from '#imports'

class AuthService {
  private provider: AuthProvider;

  constructor(provider: AuthProvider) {
    this.provider = provider;
  }

  // Estado reactivo (por petición en SSR). La sesión real vive en el servidor (cookie httpOnly).
  public getUser() {
    return useState<AdminUser | null>('auth-user', () => null)
  }

  // Autenticado = hay un usuario autorizado cargado desde una sesión válida del servidor.
  public isAuthenticated(): boolean {
    return !!this.getUser().value
  }

  public can(_permission: string): boolean {
    // Los roles autorizados tienen exactamente los mismos privilegios en el CMS Planmed.
    // La autorización real (user.role.id) la aplica el servidor en /api/auth/*.
    return this.isAuthenticated()
  }

  public async login(email: string, password: string): Promise<void> {
    const userState = this.getUser()
    userState.value = await this.provider.login(email, password)
  }

  /**
   * Cambio de contraseña obligatorio o voluntario del usuario de la sesión. Hub es la autoridad (valida actual, política y confirmación);
   * Hub revoca los tokens al cambiar, así que el servidor renueva la sesión. Si no pudo, el usuario queda sin sesión y hay que ingresar de nuevo.
   */
  public async changePassword(currentPassword: string, password: string, confirmation: string): Promise<AdminUser | null> {
    // Los composables se resuelven antes de cualquier await.
    const userState = this.getUser()
    try {
      const user = await this.provider.changePassword(currentPassword, password, confirmation)
      userState.value = user
      return user
    } catch (e: any) {
      if (e?.statusCode === 401) userState.value = null // la sesión ya no es válida
      throw e
    }
  }

  public async logout(): Promise<void> {
    // Los composables se resuelven antes de cualquier await.
    const userState = this.getUser()
    try {
      await this.provider.logout()
    } catch {
      // El servidor destruye la sesión local pase lo que pase; el cliente siempre queda sin usuario.
    } finally {
      userState.value = null
    }
  }

  public async loadUserSession(): Promise<boolean> {
    // Los composables se resuelven antes de cualquier await.
    const userState = this.getUser()

    // Si ya tenemos el usuario en estado, no recargamos
    if (userState.value) return true

    userState.value = await this.provider.getCurrentUser()
    return !!userState.value
  }
}

export const authService = new AuthService(new WellezyAuthProvider())
