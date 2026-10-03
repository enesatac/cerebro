import type { DeletionImpact } from '@/domains/shared/types';
import type {
  Role,
  RoleId,
  RoleInput,
  SessionUser,
  UserAccount,
  UserAccountId,
  UserAccountInput,
} from '../types';

/**
 * Session management. Today a demo account picker; with SSO this becomes a thin wrapper over the
 * identity provider (no passwords are ever handled by Cerebro).
 */
export interface AuthRepository {
  /** The signed-in account with its resolved privileges, or `null` when signed out. */
  getSession(): Promise<SessionUser | null>;
  /** Active accounts offered on the demo sign-in screen, with their role names. */
  listSignInAccounts(): Promise<SessionUser[]>;
  /**
   * Where the browser starts the corporate SSO login, or `null` where accounts are picked on the
   * sign-in screen (the demo and local development).
   */
  getSingleSignOnUrl(): Promise<string | null>;
  /** @throws ValidationError for unknown or deactivated accounts */
  signIn(accountId: UserAccountId): Promise<SessionUser>;
  signOut(): Promise<void>;
}

/** User administration: reading needs `users:view`, changes `users:edit`. */
export interface UserRepository {
  list(): Promise<UserAccount[]>;
  /** @throws NotFoundError */
  getById(id: UserAccountId): Promise<UserAccount>;
  /** @throws ValidationError (duplicate email, unknown role) */
  create(input: UserAccountInput): Promise<UserAccount>;
  /** @throws ValidationError (e.g. removing the last system administrator, deactivating yourself) */
  update(id: UserAccountId, input: UserAccountInput): Promise<UserAccount>;
  /**
   * Deletes the login only; the linked person and the record history stay untouched.
   * @throws ValidationError when deleting yourself or the last system administrator
   */
  remove(id: UserAccountId): Promise<void>;
  getDeletionImpact(id: UserAccountId): Promise<DeletionImpact>;
}

/**
 * Roles and their privileges. Reading needs `roles:view` or `users:view` (to assign roles);
 * changes need `roles:edit`. The system role cannot be changed or deleted, and roles still held
 * by users cannot be deleted.
 */
export interface RoleRepository {
  list(): Promise<Role[]>;
  /** @throws NotFoundError */
  getById(id: RoleId): Promise<Role>;
  /** @throws ValidationError (duplicate name) */
  create(input: RoleInput): Promise<Role>;
  update(id: RoleId, input: RoleInput): Promise<Role>;
  remove(id: RoleId): Promise<void>;
  getDeletionImpact(id: RoleId): Promise<DeletionImpact>;
}
