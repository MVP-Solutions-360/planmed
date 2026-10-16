export interface AdminUserRole {
  id: number;
  name: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminUserRole;
  /** Líder de la línea (solo informativo para la UI; el servidor es la autoridad). */
  isAreaLeader: boolean;
  /** Puede ver y modificar la tasa de interés del simulador (solo informativo para la UI; el servidor es la autoridad). */
  canEditRate: boolean;
}
