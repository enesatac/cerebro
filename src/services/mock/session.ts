import type { Privilege, SessionUser, UserAccount, UserAccountId } from '@/domains/auth/types';
import type { PersonId } from '@/domains/shared/types';
import { hasPrivilege, privilegesOfRoles } from '@/domains/auth/utils/permissions';
import { ForbiddenError, UnauthenticatedError } from '@/lib/errors';
import type { MockDatabase } from './database';

const STORAGE_KEY = 'cerebro.demo-session.v2';

/** Where the signed-in account id lives. Persisted in development so a reload keeps the session. */
export interface SessionStore {
  get(): UserAccountId | null;
  set(userId: UserAccountId | null): void;
}

export function createMemorySessionStore(initial: UserAccountId | null = null): SessionStore {
  let current = initial;
  return { get: () => current, set: (id) => void (current = id) };
}

/** localStorage can be unavailable (private mode, blocked storage) — fall back to memory. */
export function createBrowserSessionStore(): SessionStore {
  const memory = createMemorySessionStore();
  return {
    get() {
      try {
        const stored = Number(window.localStorage.getItem(STORAGE_KEY));
        return Number.isInteger(stored) && stored > 0 ? stored : memory.get();
      } catch {
        return memory.get();
      }
    },
    set(id) {
      memory.set(id);
      try {
        if (id !== null) window.localStorage.setItem(STORAGE_KEY, String(id));
        else window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Memory fallback already holds the value.
      }
    },
  };
}

/**
 * Server-side authorisation for the mock backend. Every write goes through `require` with the
 * screen's privilege, so a role without it is refused even if the UI were bypassed.
 */
export class MockAuthority {
  constructor(
    private readonly db: MockDatabase,
    readonly store: SessionStore,
  ) {}

  /** An account with its role names and the union of its roles' privileges. */
  resolve(user: UserAccount): SessionUser {
    const roles = this.db.roles.filter((role) => user.roleIds.includes(role.id));
    return {
      ...user,
      roleNames: roles.map((role) => role.name),
      privileges: privilegesOfRoles(roles),
    };
  }

  /** Resolved on every call, so role changes apply to the next request without signing in again. */
  currentUser(): SessionUser | null {
    const id = this.store.get();
    const user = id !== null ? this.db.users.find((candidate) => candidate.id === id) : undefined;
    return user?.active ? this.resolve(user) : null;
  }

  require(privilege: Privilege): SessionUser {
    return this.requireAny([privilege]);
  }

  /** Passes when the user holds at least one of `privileges`. */
  requireAny(privileges: readonly Privilege[]): SessionUser {
    const user = this.currentUser();
    if (!user) throw new UnauthenticatedError();
    if (!privileges.some((privilege) => hasPrivilege(user, privilege))) throw new ForbiddenError();
    return user;
  }

  /** Person recorded in audit fields; `null` for accounts not linked to a person. */
  static actorId(user: UserAccount): PersonId | null {
    return user.personId;
  }
}
