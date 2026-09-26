import type { Permission, UserAccount } from '@/domains/auth/types';
import { hasPermission } from '@/domains/auth/utils/permissions';
import { ForbiddenError, UnauthenticatedError } from '@/lib/errors';
import type { MockDatabase } from './database';

const STORAGE_KEY = 'cerebro.demo-session';

/** Where the signed-in account id lives. Persisted in development so a reload keeps the session. */
export interface SessionStore {
  get(): string | null;
  set(userId: string | null): void;
}

export function createMemorySessionStore(initial: string | null = null): SessionStore {
  let current = initial;
  return { get: () => current, set: (id) => void (current = id) };
}

/** localStorage can be unavailable (private mode, blocked storage) — fall back to memory. */
export function createBrowserSessionStore(): SessionStore {
  const memory = createMemorySessionStore();
  return {
    get() {
      try {
        return window.localStorage.getItem(STORAGE_KEY) ?? memory.get();
      } catch {
        return memory.get();
      }
    },
    set(id) {
      memory.set(id);
      try {
        if (id) window.localStorage.setItem(STORAGE_KEY, id);
        else window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Memory fallback already holds the value.
      }
    },
  };
}

/**
 * Server-side authorisation for the mock backend. Every write goes through `require`, so a
 * read-only user is refused even if the UI were bypassed.
 */
export class MockAuthority {
  constructor(
    private readonly db: MockDatabase,
    readonly store: SessionStore,
  ) {}

  currentUser(): UserAccount | null {
    const id = this.store.get();
    const user = id ? this.db.users.find((candidate) => candidate.id === id) : undefined;
    return user?.active ? user : null;
  }

  require(permission: Permission): UserAccount {
    const user = this.currentUser();
    if (!user) throw new UnauthenticatedError();
    if (!hasPermission(user, permission)) throw new ForbiddenError();
    return user;
  }

  /** Person id recorded in audit fields (falls back to the account id for unlinked accounts). */
  static actorId(user: UserAccount): string {
    return user.personId ?? user.id;
  }
}
