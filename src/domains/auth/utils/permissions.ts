import type { Permission, UserAccount, UserRole } from '../types';

/** The single source of truth for what each role may do. The backend enforces the same table. */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  admin: [
    'portfolio:view',
    'portfolio:edit',
    'portfolio:delete',
    'users:manage',
    'masterData:manage',
    'leaves:manage',
  ],
  user: ['portfolio:view'],
};

export function hasPermission(
  user: Pick<UserAccount, 'role' | 'active'> | null | undefined,
  permission: Permission,
): boolean {
  return Boolean(user?.active && ROLE_PERMISSIONS[user.role].includes(permission));
}
