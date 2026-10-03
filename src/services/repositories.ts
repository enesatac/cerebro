import type {
  AuthRepository,
  RoleRepository,
  UserRepository,
} from '@/domains/auth/api/AuthRepository';
import type { ApplicationRepository } from '@/domains/applications/api/ApplicationRepository';
import type { BusinessUnitRepository } from '@/domains/business-units/api/BusinessUnitRepository';
import type { ConnectionRepository } from '@/domains/connections/api/ConnectionRepository';
import type { DecisionRepository } from '@/domains/decisions/api/DecisionRepository';
import type { DemandRepository } from '@/domains/demands/api/DemandRepository';
import type {
  ContractRepository,
  VendorRepository,
} from '@/domains/contracts/api/ContractRepository';
import type { LeaveRepository } from '@/domains/leaves/api/LeaveRepository';
import type { AttachmentRepository } from '@/domains/attachments/api/AttachmentRepository';
import type { RunbookRepository } from '@/domains/runbooks/api/RunbookRepository';
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
import { createHttpClient } from './http/client';
import { createHttpRepositories } from './http/httpRepositories';
import { createMockRepositories } from './mock';
import { createIndexedDbBlobStore } from './mock/blobStore';
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
  roles: RoleRepository;
  masterData: MasterDataRepository;
  leaves: LeaveRepository;
  allocations: AllocationRepository;
  runbooks: RunbookRepository;
  attachments: AttachmentRepository;
  demands: DemandRepository;
  contracts: ContractRepository;
  vendors: VendorRepository;
}

/**
 * Builds the repositories for the running app: the Cerebro API when `VITE_DATA_SOURCE=http`
 * (development against cerebro-api, and production), otherwise the in-browser demo data.
 */
export function createRepositories(): Repositories {
  if (import.meta.env.VITE_DATA_SOURCE === 'http') {
    return createHttpRepositories(
      createHttpClient({ baseUrl: import.meta.env.VITE_API_BASE_URL ?? '' }),
    );
  }
  return createMockRepositories({
    latencyMs: import.meta.env.MODE === 'test' ? 0 : 250,
    session: createBrowserSessionStore(),
    store: createBrowserDatabaseStore(),
    blobs: createIndexedDbBlobStore(),
  });
}
