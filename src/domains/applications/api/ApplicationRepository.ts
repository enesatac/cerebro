import type { PagedResult, WriteRepository } from '@/domains/shared/types';
import type {
  Application,
  ApplicationId,
  ApplicationInput,
  ApplicationListItem,
  ApplicationListQuery,
} from '../types';

export interface ApplicationRepository extends WriteRepository<Application, ApplicationInput> {
  list(query: ApplicationListQuery): Promise<PagedResult<ApplicationListItem>>;
  /** @throws NotFoundError */
  getById(id: ApplicationId): Promise<Application>;
  /** Lightweight id → name references for all applications (for resolving relationships). */
  listRefs(): Promise<{ id: ApplicationId; name: string; code: string }[]>;
}
