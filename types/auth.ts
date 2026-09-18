export type AdminRole = 'Administrador' | 'Diseñador gráfico';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

export interface AuthState {
  user: AdminUser | null;
  token: string | null;
}