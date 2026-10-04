import type { PersonId, RoleAssignment, StakeholderRole } from '../types';

/** All people holding `role`, in declaration order. */
export function findRoleHolders(
  roles: readonly RoleAssignment[],
  role: StakeholderRole,
): PersonId[] {
  return roles
    .filter((assignment) => assignment.role === role)
    .map((assignment) => assignment.personId);
}

/** The first (primary) holder of `role`, or `null` when the role is unassigned. */
export function findPrimaryRoleHolder(
  roles: readonly RoleAssignment[],
  role: StakeholderRole,
): PersonId | null {
  return roles.find((assignment) => assignment.role === role)?.personId ?? null;
}
