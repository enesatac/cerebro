import type { ApplicationId } from '@/domains/applications/types';
import type { AuditMetadata, Criticality, EntityId } from '@/domains/shared/types';

export const DEPENDENCY_TYPES = [
  'runtime',
  'authentication',
  'data',
  'messaging',
  'batch',
  'build',
] as const;
/** Code from an administrable master data list; `DEPENDENCY_TYPES` are the system values. */
export type DependencyType = string;

/** `sourceApplicationId` depends on `targetApplicationId`. */
export interface ApplicationDependency {
  id: EntityId;
  sourceApplicationId: ApplicationId;
  targetApplicationId: ApplicationId;
  type: DependencyType;
  /** How severely the source is affected if the target is unavailable. */
  criticality: Criticality;
  description: string;
  audit: AuditMetadata;
}

export const INTEGRATION_TYPES = [
  'rest-api',
  'soap',
  'graphql',
  'kafka',
  'rabbitmq',
  'database',
  'file-transfer',
  'batch',
  'event',
  'other',
] as const;
/** Code from an administrable master data list; `INTEGRATION_TYPES` are the system values. */
export type IntegrationType = string;

export const INTEGRATION_FREQUENCIES = [
  'real-time',
  'near-real-time',
  'hourly',
  'daily',
  'on-demand',
] as const;
/** Code from an administrable master data list; `INTEGRATION_FREQUENCIES` are the system values. */
export type IntegrationFrequency = string;

/**
 * A concrete technical interface. `fromApplicationId` initiates or produces; the receiver is
 * either another catalogued application (`toApplicationId`) or an external party.
 */
export interface Integration {
  id: EntityId;
  name: string;
  type: IntegrationType;
  fromApplicationId: ApplicationId;
  toApplicationId: ApplicationId | null;
  externalPartyName: string | null;
  frequency: IntegrationFrequency;
  description: string;
  dataExchanged: string;
  audit: AuditMetadata;
}

export type DependencyDirection = 'outgoing' | 'incoming';
export type IntegrationDirection = 'outbound' | 'inbound';

/** Dependencies of one application, split by direction. */
export interface ApplicationDependencies {
  /** This application depends on the target. */
  outgoing: ApplicationDependency[];
  /** Other applications depend on this one. */
  incoming: ApplicationDependency[];
}

export interface ApplicationIntegrations {
  outbound: Integration[];
  inbound: Integration[];
}

export type DependencyInput = Omit<ApplicationDependency, 'id' | 'audit'>;
export type IntegrationInput = Omit<Integration, 'id' | 'audit'>;

/** An application on the portfolio map. */
export interface MapApplication {
  id: ApplicationId;
  code: string;
  name: string;
  /** `applicationLifecycles` code. */
  lifecycle: string;
  /** `criticalities` code. */
  criticality: string;
  businessUnitId: EntityId | null;
}

/** A project on the portfolio map. */
export interface MapProject {
  id: EntityId;
  code: string;
  name: string;
  /** `projectStatuses` code. */
  status: string;
  /** `projectHealths` code. */
  health: string;
  businessUnitId: EntityId | null;
}

/**
 * One line on the map. Dependencies and integrations join applications (integrations with an
 * external party are left out); impacts join a project to an application it changes.
 */
export type MapLink =
  | {
      kind: 'dependency';
      id: EntityId;
      fromApplicationId: ApplicationId;
      toApplicationId: ApplicationId;
      /** `dependencyTypes` code. */
      type: string;
      /** `criticalities` code. */
      criticality: string;
    }
  | {
      kind: 'integration';
      id: EntityId;
      fromApplicationId: ApplicationId;
      toApplicationId: ApplicationId;
      name: string;
      /** `integrationTypes` code. */
      type: string;
    }
  | {
      kind: 'impact';
      id: EntityId;
      projectId: EntityId;
      applicationId: ApplicationId;
      /** `applicationImpactTypes` code. */
      type: string;
    };

/**
 * Every application and project with the links between them, in one read: the portfolio map. Small
 * by design (ids, names and the codes the map colours by), so the whole portfolio fits.
 */
export interface PortfolioMap {
  applications: MapApplication[];
  projects: MapProject[];
  /** Dependencies, then integrations, then impacts, each in id order. */
  links: MapLink[];
}
