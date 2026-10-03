import type { ReactNode } from 'react';
import { usePrivilege } from '../api/queries';
import type { Privilege } from '../types';

/** Shows `children` only when the signed-in user has `privilege` (e.g. hides Edit for users). */
export function Can({ privilege, children }: { privilege: Privilege; children: ReactNode }) {
  return usePrivilege(privilege) ? <>{children}</> : null;
}
