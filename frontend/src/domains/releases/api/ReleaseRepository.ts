import type { WriteRepository } from '@/domains/shared/types';
import type { Release, ReleaseId, ReleaseInput, ReleaseQuery } from '../types';

/**
 * Production releases. Reading needs `releases:view`, recording and changing them
 * `releases:edit`, deleting `releases:delete`.
 */
export interface ReleaseRepository extends WriteRepository<Release, ReleaseInput> {
  /** Ordered by date, start time and release number. */
  list(query?: ReleaseQuery): Promise<Release[]>;
  /** @throws NotFoundError */
  getById(id: ReleaseId): Promise<Release>;
}
