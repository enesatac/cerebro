import type { ReactNode } from 'react';
import { PermissionDeniedState } from '@/components/feedback/PermissionDeniedState';
import { usePermission } from '../api/queries';
import type { Permission } from '../types';

interface RequirePermissionProps {
  permission: Permission;
  /** Phrase completing "Your role does not allow you to …". */
  action: string;
  backTo: string;
  backLabel: string;
  children: ReactNode;
}

/** Route-level guard. The repository enforces the same permission for the actual operation. */
export function RequirePermission({
  permission,
  action,
  backTo,
  backLabel,
  children,
}: RequirePermissionProps) {
  const allowed = usePermission(permission);
  return allowed ? (
    <>{children}</>
  ) : (
    <PermissionDeniedState action={action} backTo={backTo} backLabel={backLabel} />
  );
}
