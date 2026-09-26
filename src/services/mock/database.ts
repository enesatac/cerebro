import { applications } from './data/applications';
import { businessUnits } from './data/businessUnits';
import { masterData } from './data/masterData';
import { dependencies, integrations } from './data/connections';
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
};

export type MockDatabase = typeof seedTables;

export function createMockDatabase(): MockDatabase {
  return structuredClone(seedTables);
}
