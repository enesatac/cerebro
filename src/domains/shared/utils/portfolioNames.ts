import type { ApplicationRepository } from '@/domains/applications/api/ApplicationRepository';
import type { ProjectRepository } from '@/domains/projects/api/ProjectRepository';
import type { EntityId } from '../types';

export interface PortfolioNames {
  application: (id: EntityId) => string;
  project: (id: EntityId) => string;
  /** Names of several applications/projects, one per line (for a spreadsheet cell). */
  applications: (ids: readonly EntityId[]) => string;
  projects: (ids: readonly EntityId[]) => string;
}

/**
 * Application and project names for an export, loaded when the export runs. Reading them at click
 * time (rather than subscribing a table to the name queries) keeps tables from re-rendering for
 * a rarely used action.
 */
export async function loadPortfolioNames(repositories: {
  applications: Pick<ApplicationRepository, 'listRefs'>;
  projects: Pick<ProjectRepository, 'listRefs'>;
}): Promise<PortfolioNames> {
  const [applications, projects] = await Promise.all([
    repositories.applications.listRefs(),
    repositories.projects.listRefs(),
  ]);
  const appNames = new Map(applications.map((ref) => [ref.id, ref.name]));
  const projectNames = new Map(projects.map((ref) => [ref.id, ref.name]));
  const application = (id: EntityId) => appNames.get(id) ?? `#${id}`;
  const project = (id: EntityId) => projectNames.get(id) ?? `#${id}`;
  return {
    application,
    project,
    applications: (ids) => ids.map(application).join('\n'),
    projects: (ids) => ids.map(project).join('\n'),
  };
}
