import type { ApplicationId } from '@/domains/applications/types';
import type { EntityId, WriteRepository } from '@/domains/shared/types';
import type {
  ApplicationDependencies,
  ApplicationDependency,
  ApplicationIntegrations,
  DependencyInput,
  Integration,
  IntegrationInput,
  PortfolioMap,
} from '../types';

export interface DependencyRepository extends WriteRepository<
  ApplicationDependency,
  DependencyInput
> {
  /** @throws NotFoundError */
  getById(id: EntityId): Promise<ApplicationDependency>;
}

export interface IntegrationRepository extends WriteRepository<Integration, IntegrationInput> {
  /** @throws NotFoundError */
  getById(id: EntityId): Promise<Integration>;
}

export interface ConnectionRepository {
  getApplicationDependencies(applicationId: ApplicationId): Promise<ApplicationDependencies>;
  getApplicationIntegrations(applicationId: ApplicationId): Promise<ApplicationIntegrations>;
  /** Every dependency in the portfolio (bounded by the number of relationships, used for impact analysis). */
  listDependencies(): Promise<ApplicationDependency[]>;
  listIntegrations(): Promise<Integration[]>;
  /** Applications, projects and every link between them (the portfolio map). */
  getPortfolioMap(): Promise<PortfolioMap>;
  dependencies: DependencyRepository;
  integrations: IntegrationRepository;
}
