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
import type { TechnologyLayer } from '@/domains/technologies/types';

/** Terse constructors that keep seed files readable. Fictional hosts use the reserved `.example` TLD. */

export const role = (personId: string, r: StakeholderRole): RoleAssignment => ({
  personId,
  role: r,
});

export const team = (teamId: string, responsibility: TeamResponsibility): TeamAssignment => ({
  teamId,
  responsibility,
});

export const uses = (
  technologyId: string,
  layer: TechnologyLayer,
  version?: string,
): TechnologyUsage => (version ? { technologyId, layer, version } : { technologyId, layer });

export const doc = (
  id: string,
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
  return description ? { id, type, title, url, description } : { id, type, title, url };
};

export const repo = (
  id: string,
  name: string,
  type: SourceRepositoryType,
  description?: string,
  defaultBranch = 'main',
): SourceRepository => ({
  id,
  name,
  type,
  url: `https://git.corp.example/${name}`,
  defaultBranch,
  ...(description ? { description } : {}),
});

export const env = (
  id: string,
  type: EnvironmentType,
  host: string | null,
  status: EnvironmentStatus = 'available',
  region: string | null = 'eu-central',
  notes?: string,
): Environment => {
  const names: Record<EnvironmentType, string> = {
    development: 'Development',
    test: 'Test',
    uat: 'UAT',
    'pre-production': 'Pre-production',
    production: 'Production',
    'disaster-recovery': 'Disaster recovery',
  };
  return {
    id,
    type,
    name: names[type],
    url: host ? `https://${host}.corp.example` : null,
    status,
    region,
    ...(notes ? { notes } : {}),
  };
};

export const store = (
  id: string,
  name: string,
  technologyId: string,
  purpose: string,
  containsPersonalData = false,
): DataStore => ({ id, name, technologyId, purpose, containsPersonalData });

/** The standard dev → test → uat → prod (+ optional DR) environment ladder for an app slug. */
export function standardEnvironments(slug: string, options: { dr?: boolean } = {}): Environment[] {
  const list = [
    env(`${slug}-env-dev`, 'development', `${slug}.dev`),
    env(`${slug}-env-test`, 'test', `${slug}.test`),
    env(`${slug}-env-uat`, 'uat', `${slug}.uat`),
    env(`${slug}-env-prod`, 'production', slug),
  ];
  if (options.dr)
    list.push(env(`${slug}-env-dr`, 'disaster-recovery', `${slug}.dr`, 'available', 'eu-west'));
  return list;
}
