import type {
  AuditMetadata,
  Criticality,
  DocumentationLink,
  EntityId,
  EntityRef,
  IsoDateTime,
  PageRequest,
  RoleAssignment,
  SortSpec,
  TeamAssignment,
  TeamId,
  TeamResponsibility,
} from '@/domains/shared/types';
import type { BusinessUnitId } from '@/domains/business-units/types';
import type { TechnologyId, TechnologyLayer } from '@/domains/technologies/types';

export type ApplicationId = EntityId;

export const APPLICATION_LIFECYCLES = [
  'planned',
  'development',
  'active',
  'maintenance',
  'deprecated',
  'retired',
] as const;
export type ApplicationLifecycle = (typeof APPLICATION_LIFECYCLES)[number];

export const APPLICATION_TYPES = [
  'web-application',
  'api-service',
  'integration-platform',
  'data-platform',
  'batch-processing',
  'mobile-backend',
  'saas-product',
] as const;
export type ApplicationType = (typeof APPLICATION_TYPES)[number];

/** Current operational condition — independent of lifecycle. */
export const OPERATIONAL_STATUSES = ['operational', 'degraded', 'outage', 'not-deployed'] as const;
export type OperationalStatus = (typeof OPERATIONAL_STATUSES)[number];

export const HOSTING_MODELS = [
  'on-premises',
  'private-cloud',
  'public-cloud',
  'hybrid',
  'saas',
] as const;
export type HostingModel = (typeof HOSTING_MODELS)[number];

export interface Hosting {
  model: HostingModel;
  /** Only meaningful for public/hybrid cloud hosting. */
  cloudProvider: string | null;
  notes?: string;
}

/** How an application uses a catalogued technology. */
export interface TechnologyUsage {
  technologyId: TechnologyId;
  layer: TechnologyLayer;
  version?: string;
}

export interface DataStore {
  id: EntityId;
  name: string;
  technologyId: TechnologyId;
  purpose: string;
  containsPersonalData: boolean;
}

export const SOURCE_REPOSITORY_TYPES = [
  'frontend',
  'backend',
  'infrastructure',
  'documentation',
  'library',
  'other',
] as const;
export type SourceRepositoryType = (typeof SOURCE_REPOSITORY_TYPES)[number];

export interface SourceRepository {
  id: EntityId;
  name: string;
  type: SourceRepositoryType;
  url: string;
  defaultBranch: string;
  description?: string;
}

export const ENVIRONMENT_TYPES = [
  'development',
  'test',
  'uat',
  'pre-production',
  'production',
  'disaster-recovery',
] as const;
export type EnvironmentType = (typeof ENVIRONMENT_TYPES)[number];

export const ENVIRONMENT_STATUSES = [
  'available',
  'degraded',
  'unavailable',
  'decommissioned',
] as const;
export type EnvironmentStatus = (typeof ENVIRONMENT_STATUSES)[number];

/** A deployment environment. Never holds credentials — URLs and notes only. */
export interface Environment {
  id: EntityId;
  type: EnvironmentType;
  name: string;
  url: string | null;
  status: EnvironmentStatus;
  region: string | null;
  notes?: string;
}

export interface Application {
  id: ApplicationId;
  code: string;
  name: string;
  shortDescription: string;
  detailedDescription: string;
  businessPurpose: string;

  type: ApplicationType;
  lifecycle: ApplicationLifecycle;
  criticality: Criticality;
  operationalStatus: OperationalStatus;
  tags: string[];

  businessUnitId: BusinessUnitId | null;
  businessProcesses: string[];
  userGroups: string[];
  estimatedUserCount: number | null;

  roles: RoleAssignment[];
  teams: TeamAssignment[];

  technologies: TechnologyUsage[];
  dataStores: DataStore[];
  hosting: Hosting;

  repositories: SourceRepository[];
  environments: Environment[];
  documentation: DocumentationLink[];

  audit: AuditMetadata;
}

/** Denormalised row for list views; built by the repository so sorting/filtering can run server-side. */
export interface ApplicationListItem {
  id: ApplicationId;
  code: string;
  name: string;
  shortDescription: string;
  lifecycle: ApplicationLifecycle;
  criticality: Criticality;
  operationalStatus: OperationalStatus;
  businessUnit: EntityRef | null;
  technicalOwner: EntityRef | null;
  teams: ApplicationTeamRef[];
  updatedAt: IsoDateTime;
}

export interface ApplicationTeamRef extends EntityRef {
  responsibility: TeamResponsibility;
}

export const APPLICATION_SORT_FIELDS = [
  'name',
  'code',
  'lifecycle',
  'criticality',
  'businessUnit',
  'technicalOwner',
  'updatedAt',
] as const;
export type ApplicationSortField = (typeof APPLICATION_SORT_FIELDS)[number];

export interface ApplicationFilters {
  /** Case-insensitive match on name, code, description and tags. */
  search?: string;
  lifecycles?: ApplicationLifecycle[];
  criticalities?: Criticality[];
  teamId?: TeamId;
  technologyId?: TechnologyId;
  businessUnitId?: BusinessUnitId;
}

export interface ApplicationListQuery extends ApplicationFilters, PageRequest {
  sort?: SortSpec<ApplicationSortField>;
}

/** Writable fields; `id` and `audit` are assigned by the server. */
export type ApplicationInput = Omit<Application, 'id' | 'audit'>;
