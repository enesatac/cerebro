import type { BusinessUnit } from '../types';

export interface BusinessUnitRepository {
  list(): Promise<BusinessUnit[]>;
}
