import type { BusinessUnitId } from '@/domains/business-units/types';
import type { PersonId } from '@/domains/shared/types';

/**
 * A person known to Cerebro. Roles are *not* stored here — they exist in the context of an
 * application or project (`RoleAssignment`). Team membership is owned by `Team.memberIds`.
 */
export interface Person {
  id: PersonId;
  fullName: string;
  jobTitle: string;
  email: string;
  businessUnitId: BusinessUnitId | null;
  location: string | null;
}
