import type { ReactNode } from 'react';
import { usePermission } from '../api/queries';
import type { Permission } from '../types';

/** Shows `children` only when the signed-in user has `permission` (e.g. hides Edit for users). */
export function Can({ permission, children }: { permission: Permission; children: ReactNode }) {
  return usePermission(permission) ? <>{children}</> : null;
}
