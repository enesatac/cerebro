import type { AuthRepository, UserRepository } from '@/domains/auth/api/AuthRepository';
import type { ApplicationRepository } from '@/domains/applications/api/ApplicationRepository';
import type { BusinessUnitRepository } from '@/domains/business-units/api/BusinessUnitRepository';
import type { ConnectionRepository } from '@/domains/connections/api/ConnectionRepository';
import type { DecisionRepository } from '@/domains/decisions/api/DecisionRepository';
import type { LeaveRepository } from '@/domains/leaves/api/LeaveRepository';
import type { AllocationRepository } from '@/domains/resources/api/AllocationRepository';
import type { MasterDataRepository } from '@/domains/master-data/api/MasterDataRepository';
import type { GovernanceRepository } from '@/domains/governance/api/GovernanceRepository';
import type { EscalationRepository } from '@/domains/escalations/api/EscalationRepository';
import type { PersonRepository } from '@/domains/people/api/PersonRepository';
import type { ProjectRepository } from '@/domains/projects/api/ProjectRepository';
import type { RiskRepository } from '@/domains/risks/api/RiskRepository';
import type { SearchRepository } from '@/domains/search/api/SearchRepository';
import type { TeamRepository } from '@/domains/teams/api/TeamRepository';
import type { TechnologyRepository } from '@/domains/technologies/api/TechnologyRepository';
import { createMockRepositories } from './mock';
import { createBrowserDatabaseStore } from './mock/persistence';
import { createBrowserSessionStore } from './mock/session';

/** Every data-access contract the UI depends on. Implementations are swapped as a whole. */
export interface Repositories {
  applications: ApplicationRepository;
  projects: ProjectRepository;
  connections: ConnectionRepository;
  people: PersonRepository;
  teams: TeamRepository;
  technologies: TechnologyRepository;
  businessUnits: BusinessUnitRepository;
  risks: RiskRepository;
  escalations: EscalationRepository;
  decisions: DecisionRepository;
  search: SearchRepository;
  governance: GovernanceRepository;
  auth: AuthRepository;
  users: UserRepository;
  masterData: MasterDataRepository;
  leaves: LeaveRepository;
  allocations: AllocationRepository;
}

/**
 * Builds the repositories for the running app. There is no backend yet, so this returns the
 * in-memory implementation; an `createHttpRepositories(baseUrl)` will slot in here.
 */
export function createRepositories(): Repositories {
  return createMockRepositories({
    latencyMs: import.meta.env.MODE === 'test' ? 0 : 250,
    session: createBrowserSessionStore(),
    store: createBrowserDatabaseStore(),
  });
}
