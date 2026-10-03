import type { UserAccount } from '@/domains/auth/types';
import { hasPermission } from '@/domains/auth/utils/permissions';
import type { Demand } from '../types';
import { CLOSED_STATUSES, REQUESTER_EDITABLE_STATUSES } from '../types';

type Viewer = Pick<UserAccount, 'role' | 'active' | 'personId'> | null | undefined;
type Ownable = Pick<Demand, 'requesterId' | 'status' | 'audit'>;

/** The person who asked, or the one who typed it in on their behalf. */
export function ownsDemand(user: Viewer, demand: Ownable): boolean {
  const personId = user?.personId;
  return (
    personId != null && (demand.requesterId === personId || demand.audit.createdBy === personId)
  );
}

/**
 * The single rule for changing a demand's request, shared by the repository (which enforces it)
 * and the UI (which only hides what would be refused).
 */
export function canEditDemand(user: Viewer, demand: Ownable): boolean {
  if (hasPermission(user, 'demands:manage')) return true;
  return (
    hasPermission(user, 'demands:submit') &&
    ownsDemand(user, demand) &&
    REQUESTER_EDITABLE_STATUSES.includes(demand.status)
  );
}

export function canWithdrawDemand(user: Viewer, demand: Ownable): boolean {
  if (CLOSED_STATUSES.includes(demand.status)) return false;
  return (
    hasPermission(user, 'demands:manage') ||
    (hasPermission(user, 'demands:submit') && ownsDemand(user, demand))
  );
}

/** Files on a demand: its requester while it is open, and the portfolio office. */
export function canAttachToDemand(user: Viewer, demand: Ownable): boolean {
  if (hasPermission(user, 'demands:manage')) return true;
  return (
    hasPermission(user, 'demands:submit') &&
    ownsDemand(user, demand) &&
    !CLOSED_STATUSES.includes(demand.status)
  );
}
