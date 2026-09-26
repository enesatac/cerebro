import type { PersonId } from '@/domains/shared/types';
import type { Person } from '../types';

export interface PersonRepository {
  list(): Promise<Person[]>;
  /** @throws NotFoundError */
  getById(id: PersonId): Promise<Person>;
}
