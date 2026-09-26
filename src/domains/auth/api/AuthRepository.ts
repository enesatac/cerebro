import type { DeletionImpact } from '@/domains/shared/types';
import type { UserAccount, UserAccountId, UserAccountInput } from '../types';

/**
 * Session management. Today a demo account picker; with SSO this becomes a thin wrapper over the
 * identity provider (no passwords are ever handled by Cerebro).
 */
export interface AuthRepository {
  /** The signed-in account, or `null` when signed out. */
  getSession(): Promise<UserAccount | null>;
  /** Active accounts offered on the demo sign-in screen. */
  listSignInAccounts(): Promise<UserAccount[]>;
  /** @throws ValidationError for unknown or deactivated accounts */
  signIn(accountId: UserAccountId): Promise<UserAccount>;
  signOut(): Promise<void>;
}

/** User administration. Every method requires `users:manage`. */
export interface UserRepository {
  list(): Promise<UserAccount[]>;
  /** @throws NotFoundError */
  getById(id: UserAccountId): Promise<UserAccount>;
  /** @throws ValidationError (duplicate email) */
  create(input: UserAccountInput): Promise<UserAccount>;
  /** @throws ValidationError (e.g. removing the last active admin, deactivating yourself) */
  update(id: UserAccountId, input: UserAccountInput): Promise<UserAccount>;
  /**
   * Deletes the login only; the linked person and the record history stay untouched.
   * @throws ValidationError when deleting yourself or the last active admin
   */
  remove(id: UserAccountId): Promise<void>;
  getDeletionImpact(id: UserAccountId): Promise<DeletionImpact>;
}
