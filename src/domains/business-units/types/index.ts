import type { EntityId, PersonId } from '@/domains/shared/types';

export type BusinessUnitId = EntityId;

export interface BusinessUnit {
  id: BusinessUnitId;
  code: string;
  name: string;
  description: string;
  headId: PersonId | null;
}

export type BusinessUnitInput = Omit<BusinessUnit, 'id'>;
