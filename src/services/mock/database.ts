import { applications } from './data/applications';
import { businessUnits } from './data/businessUnits';
import { allocations } from './data/allocations';
import { leaves } from './data/leaves';
import { dependencies, integrations } from './data/connections';
import { masterData } from './data/masterData';
import { decisions, escalations, risks } from './data/operations';
import { people } from './data/people';
import { projects } from './data/projects';
import { teams } from './data/teams';
import { technologies } from './data/technologies';
import { users } from './data/users';

/** Raw seed tables. Treated as immutable; repositories work on a per-instance deep copy. */
export const seedTables = {
  applications,
  projects,
  dependencies,
  integrations,
  people,
  teams,
  technologies,
  businessUnits,
  risks,
  escalations,
  decisions,
  users,
  masterData,
  leaves,
  allocations,
};

/**
 * One sequence per table, as in the database (`docs/database-schema.sql`). Child rows that live
 * inside an aggregate here (environments, milestones…) are separate tables there.
 */
export const SEQUENCES = [
  'applications',
  'projects',
  'dependencies',
  'integrations',
  'people',
  'teams',
  'technologies',
  'businessUnits',
  'risks',
  'escalations',
  'decisions',
  'users',
  'masterDataItems',
  'roleAssignments',
  'teamAssignments',
  'technologyUsages',
  'dataStores',
  'repositories',
  'environments',
  'documentationLinks',
  'milestones',
  'applicationImpacts',
  'leaves',
  'allocations',
] as const;
export type SequenceName = (typeof SEQUENCES)[number];

/** Last value handed out by each sequence (`SELECT last_value FROM …_id_seq`). */
export type Sequences = Record<SequenceName, number>;

export type MockDatabase = typeof seedTables & { sequences: Sequences };

type Rows = readonly { id: number }[];
const maxId = (rows: Rows) => rows.reduce((max, row) => Math.max(max, row.id), 0);

/** Current sequence values derived from the rows (what a restore does with `setval`). */
export function sequencesOf(tables: typeof seedTables): Sequences {
  const portfolio = [...tables.applications, ...tables.projects];
  return {
    applications: maxId(tables.applications),
    projects: maxId(tables.projects),
    dependencies: maxId(tables.dependencies),
    integrations: maxId(tables.integrations),
    people: maxId(tables.people),
    teams: maxId(tables.teams),
    technologies: maxId(tables.technologies),
    businessUnits: maxId(tables.businessUnits),
    risks: maxId(tables.risks),
    escalations: maxId(tables.escalations),
    decisions: maxId(tables.decisions),
    users: maxId(tables.users),
    masterDataItems: maxId(tables.masterData.flatMap((list) => list.items)),
    roleAssignments: maxId(portfolio.flatMap((row) => row.roles)),
    teamAssignments: maxId(portfolio.flatMap((row) => row.teams)),
    technologyUsages: maxId(tables.applications.flatMap((a) => a.technologies)),
    dataStores: maxId(tables.applications.flatMap((a) => a.dataStores)),
    repositories: maxId(tables.applications.flatMap((a) => a.repositories)),
    environments: maxId(tables.applications.flatMap((a) => a.environments)),
    documentationLinks: maxId(portfolio.flatMap((row) => row.documentation)),
    milestones: maxId(tables.projects.flatMap((p) => p.milestones)),
    applicationImpacts: maxId(tables.projects.flatMap((p) => p.applicationImpacts)),
    leaves: maxId(tables.leaves),
    allocations: maxId(tables.allocations),
  };
}

export function createMockDatabase(): MockDatabase {
  const tables = structuredClone(seedTables);
  return { ...tables, sequences: sequencesOf(tables) };
}
