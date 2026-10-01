import type { AuditMetadata, EntityId, IsoDateTime, PersonId } from '@/domains/shared/types';

export type UserAccountId = EntityId;

export const USER_ROLES = ['admin', 'user'] as const;
/**
 * `admin` — full access: create, edit and delete any record and manage user accounts.
 * `user` — read-only access to everything.
 */
export type UserRole = (typeof USER_ROLES)[number];

export const PERMISSIONS = [
  'portfolio:view',
  'portfolio:edit',
  'portfolio:delete',
  'users:manage',
  'masterData:manage',
  'leaves:manage',
  'resources:manage',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** A Cerebro login. Optionally linked to the `Person` it represents in the organisation. */
export interface UserAccount {
  id: UserAccountId;
  displayName: string;
  email: string;
  role: UserRole;
  personId: PersonId | null;
  /** Deactivated accounts cannot sign in; accounts are never hard-deleted (auditability). */
  active: boolean;
  lastSignInAt: IsoDateTime | null;
  audit: AuditMetadata;
}

export type UserAccountInput = Pick<
  UserAccount,
  'displayName' | 'email' | 'role' | 'personId' | 'active'
>;
