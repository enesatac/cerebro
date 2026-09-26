import type { MockDatabase } from './database';

/**
 * Development-only persistence for the mock backend so records created in the browser survive a
 * reload. Bump the key when the seed data or its shape changes. Storage can be unavailable
 * (private mode, blocked site data) — every access is guarded and falls back to seed data.
 */
const STORAGE_KEY = 'cerebro.demo-db.v2';

export interface DatabaseStore {
  load(): MockDatabase | null;
  save(db: MockDatabase): void;
}

export function createBrowserDatabaseStore(): DatabaseStore {
  return {
    load() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as MockDatabase) : null;
      } catch {
        return null;
      }
    },
    save(db) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      } catch {
        // Quota or blocked storage: the session keeps working in memory.
      }
    },
  };
}

const WRITE_METHODS = new Set(['create', 'update', 'remove', 'signIn']);

/**
 * Wraps repository objects so that every successful write is followed by `onWrite()`. Nested
 * repository objects (e.g. `connections.dependencies`) are wrapped too.
 */
export function afterWrites<T extends object>(target: T, onWrite: () => void): T {
  return new Proxy(target, {
    get(object, property, receiver) {
      const value: unknown = Reflect.get(object, property, receiver);
      if (typeof value === 'function') {
        const method = value as (...args: unknown[]) => unknown;
        if (typeof property === 'string' && WRITE_METHODS.has(property)) {
          return async (...args: unknown[]) => {
            const result = await method.apply(object, args);
            onWrite();
            return result;
          };
        }
        return method.bind(object);
      }
      if (value && typeof value === 'object') return afterWrites(value, onWrite);
      return value;
    },
  });
}
