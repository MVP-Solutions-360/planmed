export interface AdminUserRole {
  id: number;
  name: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminUserRole;
}
