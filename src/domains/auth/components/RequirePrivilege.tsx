import type { ReactNode } from 'react';
import { PermissionDeniedState } from '@/components/feedback/PermissionDeniedState';
import { useCurrentUser } from '../api/queries';
import type { Privilege } from '../types';
import { hasPrivilege } from '../utils/permissions';

interface RequirePrivilegeProps {
  /** One privilege, or several of which any one is enough. */
  privilege: Privilege | readonly Privilege[];
  /** Phrase completing "Your role does not allow you to …". */
  action: string;
  backTo: string;
  backLabel: string;
  children: ReactNode;
}

/** Route-level guard. The repository enforces the same privilege for the actual operation. */
export function RequirePrivilege({
  privilege,
  action,
  backTo,
  backLabel,
  children,
}: RequirePrivilegeProps) {
  const user = useCurrentUser();
  const required: readonly Privilege[] = typeof privilege === 'string' ? [privilege] : privilege;
  return required.some((p) => hasPrivilege(user, p)) ? (
    <>{children}</>
  ) : (
    <PermissionDeniedState action={action} backTo={backTo} backLabel={backLabel} />
  );
}
