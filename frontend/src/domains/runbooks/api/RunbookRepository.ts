import type { ApplicationId } from '@/domains/applications/types';
import type { WriteRepository } from '@/domains/shared/types';
import type { Runbook, RunbookInput } from '../types';

/**
 * One runbook per application. Reads are open to every signed-in user (anyone may be the one
 * handling an incident); writes follow the application's permissions.
 */
export interface RunbookRepository extends WriteRepository<Runbook, RunbookInput> {
  /** The application's runbook, or `null` when none has been written yet. */
  getByApplication(applicationId: ApplicationId): Promise<Runbook | null>;
}
