import type { AuthProvider } from './AuthProvider'
import type { AdminUser } from '~/types/auth'

const MOCK_USERS: AdminUser[] = [
  {
    id: '1',
    name: 'Administrador Planmed',
    email: 'admin@planmed.com.co',
    role: 'Administrador'
  },
  {
    id: '2',
    name: 'Diseñador Planmed',
    email: 'diseno@planmed.com.co',
    role: 'Diseñador gráfico'
  }
]

export class MockAuthProvider implements AuthProvider {
  async login(email: string, password: string): Promise<{ user: AdminUser, token: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800))

    const user = MOCK_USERS.find(u => u.email === email)
    
    // In mock, accept any password as long as the user exists
    if (user && password) {
      // Return a fake token
      return { user, token: `mock-token-${user.id}` }
    }

    throw new Error('Credenciales incorrectas')
  }

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400))
  }

  async getCurrentUser(token: string): Promise<AdminUser | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (token.startsWith('mock-token-')) {
      const id = token.replace('mock-token-', '')
      return MOCK_USERS.find(u => u.id === id) || null
    }
    return null
  }
}