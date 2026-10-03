import { ActionMenu } from '@/components/actions/ActionMenu';
import { useCurrentUser } from '../api/queries';
import type { Privilege } from '../types';
import { hasPrivilege } from '../utils/permissions';

export interface GuardedActionMenuItem {
  label: string;
  to: string;
  /** The privilege the target page needs (the item is hidden without it). */
  privilege: Privilege;
}

/** `ActionMenu` showing only the actions the signed-in user may take; hidden when none remain. */
export function GuardedActionMenu({ items }: { items: GuardedActionMenuItem[] }) {
  const user = useCurrentUser();
  return <ActionMenu items={items.filter((item) => hasPrivilege(user, item.privilege))} />;
}
