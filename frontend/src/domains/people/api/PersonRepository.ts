import type { DeletionImpact, IsoDate, PersonId } from '@/domains/shared/types';
import type { Person, PersonInput, PersonWorkload } from '../types';

export interface PersonRepository {
  list(): Promise<Person[]>;
  /** @throws NotFoundError */
  getById(id: PersonId): Promise<Person>;
  /**
   * Everything the person is mapped to: roles, teams, the applications and projects they work
   * on (directly or through a team), risks, escalations, decisions and upcoming leaves.
   * `today` bounds the leaves. @throws NotFoundError
   */
  getWorkload(id: PersonId, today: IsoDate): Promise<PersonWorkload>;
  /** Requires `masterData:edit`. @throws ValidationError on a duplicate email. */
  create(input: PersonInput): Promise<Person>;
  update(id: PersonId, input: PersonInput): Promise<Person>;
  /** @throws ValidationError when the person is still referenced (see `getDeletionImpact`). */
  remove(id: PersonId): Promise<void>;
  getDeletionImpact(id: PersonId): Promise<DeletionImpact>;
}
