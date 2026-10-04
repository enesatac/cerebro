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
