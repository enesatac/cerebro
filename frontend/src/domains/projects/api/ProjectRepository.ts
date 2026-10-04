import type { ApplicationId } from '@/domains/applications/types';
import type { PagedResult, WriteRepository } from '@/domains/shared/types';
import type {
  ApplicationProjectLink,
  Project,
  ProjectId,
  ProjectInput,
  ProjectListItem,
  ProjectListQuery,
} from '../types';

export interface ProjectRepository extends WriteRepository<Project, ProjectInput> {
  list(query: ProjectListQuery): Promise<PagedResult<ProjectListItem>>;
  /** @throws NotFoundError */
  getById(id: ProjectId): Promise<Project>;
  /** Projects that affect an application, with the nature of the impact. */
  listByApplication(applicationId: ApplicationId): Promise<ApplicationProjectLink[]>;
  /** Lightweight id → name references for all projects (for resolving relationships). */
  listRefs(): Promise<{ id: ProjectId; name: string; code: string }[]>;
}
