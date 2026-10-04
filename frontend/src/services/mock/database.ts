import { applications } from './data/applications';
import { businessUnits } from './data/businessUnits';
import { allocations } from './data/allocations';
import { runbooks } from './data/runbooks';
import { attachments } from './data/attachments';
import { demands } from './data/demands';
import { contracts } from './data/contracts';
import { vendors } from './data/vendors';
import { leaves } from './data/leaves';
import { dependencies, integrations } from './data/connections';
import { masterData } from './data/masterData';
import { decisionHistory, escalationHistory, riskHistory } from './data/history';
import { decisions, escalations, risks } from './data/operations';
import { people } from './data/people';
import { projects } from './data/projects';
import { teams } from './data/teams';
import { technologies } from './data/technologies';
import { users } from './data/users';
import { roles } from './data/roles';

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
  risks: [...risks, ...riskHistory],
  escalations: [...escalations, ...escalationHistory],
  decisions: [...decisions, ...decisionHistory],
  users,
  roles,
  masterData,
  leaves,
  allocations,
  runbooks,
  attachments,
  demands,
  vendors,
  contracts,
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
  'roles',
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
  'runbooks',
  'runbookSteps',
  'runbookLinks',
  'runbookContacts',
  'runbookScenarios',
  'attachments',
  'demands',
  'demandEvents',
  'vendors',
  'contracts',
  'contractPayments',
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
    roles: maxId(tables.roles),
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
    runbooks: maxId(tables.runbooks),
    runbookSteps: maxId(
      tables.runbooks.flatMap((r) => [...r.firstResponse, ...r.scenarios.flatMap((s) => s.steps)]),
    ),
    runbookLinks: maxId(tables.runbooks.flatMap((r) => r.links)),
    runbookContacts: maxId(tables.runbooks.flatMap((r) => r.contacts)),
    runbookScenarios: maxId(tables.runbooks.flatMap((r) => r.scenarios)),
    attachments: maxId(tables.attachments),
    demands: maxId(tables.demands),
    demandEvents: maxId(tables.demands.flatMap((d) => d.history)),
    vendors: maxId(tables.vendors),
    contracts: maxId(tables.contracts),
    contractPayments: maxId(tables.contracts.flatMap((c) => c.payments)),
  };
}

export function createMockDatabase(): MockDatabase {
  const tables = structuredClone(seedTables);
  return { ...tables, sequences: sequencesOf(tables) };
}
