import type {
  DataStore,
  Environment,
  EnvironmentStatus,
  EnvironmentType,
  SourceRepository,
  SourceRepositoryType,
  TechnologyUsage,
} from '@/domains/applications/types';
import type {
  DocumentationLink,
  DocumentationLinkType,
  RoleAssignment,
  StakeholderRole,
  TeamAssignment,
  TeamResponsibility,
} from '@/domains/shared/types';
import type { TechnologyId, TechnologyLayer } from '@/domains/technologies/types';
import type { PersonId, TeamId } from '@/domains/shared/types';
import { seedId } from './sequence';

/**
 * Terse constructors that keep seed files readable. Each child row takes the next id of its table's
 * sequence (`seedId`). Fictional hosts use the reserved `.example` TLD.
 */

export const role = (personId: PersonId, r: StakeholderRole): RoleAssignment => ({
  id: seedId('roleAssignments'),
  personId,
  role: r,
});

export const team = (teamId: TeamId, responsibility: TeamResponsibility): TeamAssignment => ({
  id: seedId('teamAssignments'),
  teamId,
  responsibility,
});

export const uses = (
  technologyId: TechnologyId,
  layer: TechnologyLayer,
  version?: string,
): TechnologyUsage => {
  const id = seedId('technologyUsages');
  return version ? { id, technologyId, layer, version } : { id, technologyId, layer };
};

export const doc = (
  type: DocumentationLinkType,
  title: string,
  path: string,
  description?: string,
): DocumentationLink => {
  const host: Partial<Record<DocumentationLinkType, string>> = {
    confluence: 'wiki.corp.example',
    architecture: 'wiki.corp.example',
    analysis: 'wiki.corp.example',
    runbook: 'wiki.corp.example',
    jira: 'jira.corp.example',
    monitoring: 'grafana.corp.example',
    dashboard: 'grafana.corp.example',
    design: 'design.corp.example',
    repository: 'git.corp.example',
  };
  const url = `https://${host[type] ?? 'docs.corp.example'}/${path}`;
  const id = seedId('documentationLinks');
  return description ? { id, type, title, url, description } : { id, type, title, url };
};

export const repo = (
  name: string,
  type: SourceRepositoryType,
  description?: string,
  defaultBranch = 'main',
): SourceRepository => ({
  id: seedId('repositories'),
  name,
  type,
  url: `https://git.corp.example/${name}`,
  defaultBranch,
  ...(description ? { description } : {}),
});

export const env = (
  type: EnvironmentType,
  host: string | null,
  status: EnvironmentStatus = 'available',
  region: string | null = 'eu-central',
  notes?: string,
): Environment => {
  const names: Record<EnvironmentType, string> = {
    development: 'Geliştirme',
    test: 'Test',
    uat: 'UAT',
    'pre-production': 'Canlı öncesi',
    production: 'Canlı',
    'disaster-recovery': 'Felaket kurtarma',
  };
  return {
    id: seedId('environments'),
    type,
    name: names[type] ?? type,
    url: host ? `https://${host}.corp.example` : null,
    status,
    region,
    ...(notes ? { notes } : {}),
  };
};

export const store = (
  name: string,
  technologyId: TechnologyId,
  purpose: string,
  containsPersonalData = false,
): DataStore => ({ id: seedId('dataStores'), name, technologyId, purpose, containsPersonalData });

/** The standard dev → test → uat → prod (+ optional DR) environment ladder for an app slug. */
export function standardEnvironments(slug: string, options: { dr?: boolean } = {}): Environment[] {
  const list = [
    env('development', `${slug}.dev`),
    env('test', `${slug}.test`),
    env('uat', `${slug}.uat`),
    env('production', slug),
  ];
  if (options.dr) list.push(env('disaster-recovery', `${slug}.dr`, 'available', 'eu-west'));
  return list;
}
