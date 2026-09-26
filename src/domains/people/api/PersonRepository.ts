import type { DeletionImpact, PersonId } from '@/domains/shared/types';
import type { Person, PersonInput } from '../types';

export interface PersonRepository {
  list(): Promise<Person[]>;
  /** @throws NotFoundError */
  getById(id: PersonId): Promise<Person>;
  /** Requires `masterData:manage`. @throws ValidationError on a duplicate email. */
  create(input: PersonInput): Promise<Person>;
  update(id: PersonId, input: PersonInput): Promise<Person>;
  /** @throws ValidationError when the person is still referenced (see `getDeletionImpact`). */
  remove(id: PersonId): Promise<void>;
  getDeletionImpact(id: PersonId): Promise<DeletionImpact>;
}
