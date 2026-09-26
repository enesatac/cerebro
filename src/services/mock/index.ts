import type { Repositories } from '../repositories';
import { createMockDatabase } from './database';
import { afterWrites, type DatabaseStore } from './persistence';
import { createLookup } from './lookup';
import { MockApplicationRepository } from './MockApplicationRepository';
import { createMockAuthRepositories } from './MockAuthRepositories';
import { createMockOperationalRepositories } from './MockOperationalRepositories';
import { MockProjectRepository } from './MockProjectRepository';
import { createMockReferenceRepositories } from './MockReferenceRepositories';
import { MockSearchRepository } from './MockSearchRepository';
import { createMemorySessionStore, MockAuthority, type SessionStore } from './session';
import { WriteKit } from './writeKit';

export interface MockRepositoryOptions {
  /** Simulated network latency so loading states are exercised in development. */
  latencyMs?: number;
  /** Where the signed-in account is kept. Defaults to an in-memory store. */
  session?: SessionStore;
  /** Convenience for tests: start signed in as this account (in-memory session). */
  signedInAs?: string;
  /** Persists writes (development); omitted in tests so each test starts from seed data. */
  store?: DatabaseStore;
}

export function createMockRepositories({
  latencyMs = 0,
  session,
  signedInAs,
  store,
}: MockRepositoryOptions = {}): Repositories {
  const db = store?.load() ?? createMockDatabase();
  const lookup = createLookup(db);
  const authority = new MockAuthority(db, session ?? createMemorySessionStore(signedInAs ?? null));
  const kit = new WriteKit(authority, latencyMs);
  const repositories: Repositories = {
    applications: new MockApplicationRepository(db, lookup, latencyMs, kit),
    projects: new MockProjectRepository(db, lookup, latencyMs, kit),
    search: new MockSearchRepository(db, latencyMs),
    ...createMockReferenceRepositories(db, lookup, latencyMs, kit),
    ...createMockOperationalRepositories(db, latencyMs, kit),
    ...createMockAuthRepositories(db, authority, kit, latencyMs),
  };
  return store ? afterWrites(repositories, () => store.save(db)) : repositories;
}
