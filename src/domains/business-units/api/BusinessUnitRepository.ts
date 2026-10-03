import type { DeletionImpact } from '@/domains/shared/types';
import type { BusinessUnit, BusinessUnitId, BusinessUnitInput } from '../types';

export interface BusinessUnitRepository {
  list(): Promise<BusinessUnit[]>;
  /** Requires `masterData:edit`. @throws ValidationError on a duplicate code or name. */
  create(input: BusinessUnitInput): Promise<BusinessUnit>;
  update(id: BusinessUnitId, input: BusinessUnitInput): Promise<BusinessUnit>;
  /** @throws ValidationError while applications or projects belong to the unit. */
  remove(id: BusinessUnitId): Promise<void>;
  getDeletionImpact(id: BusinessUnitId): Promise<DeletionImpact>;
}
