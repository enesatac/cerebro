import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type {
  ApplicationLifecycle,
  ApplicationType,
  EnvironmentStatus,
  EnvironmentType,
  HostingModel,
  OperationalStatus,
  SourceRepositoryType,
} from '../types';

export const LIFECYCLE_PRESENTATION: Record<ApplicationLifecycle, StatusPresentation> = {
  planned: { label: 'Planned', variant: 'neutral' },
  development: { label: 'Development', variant: 'info' },
  active: { label: 'Active', variant: 'success' },
  maintenance: { label: 'Maintenance', variant: 'secondary' },
  deprecated: { label: 'Deprecated', variant: 'warning' },
  retired: { label: 'Retired', variant: 'dark' },
};

export const OPERATIONAL_STATUS_PRESENTATION: Record<OperationalStatus, StatusPresentation> = {
  operational: { label: 'Operational', variant: 'success' },
  degraded: { label: 'Degraded', variant: 'warning' },
  outage: { label: 'Outage', variant: 'danger' },
  'not-deployed': { label: 'Not deployed', variant: 'neutral' },
};

export const ENVIRONMENT_STATUS_PRESENTATION: Record<EnvironmentStatus, StatusPresentation> = {
  available: { label: 'Available', variant: 'success' },
  degraded: { label: 'Degraded', variant: 'warning' },
  unavailable: { label: 'Unavailable', variant: 'danger' },
  decommissioned: { label: 'Decommissioned', variant: 'neutral' },
};

export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  'web-application': 'Web application',
  'api-service': 'API service',
  'integration-platform': 'Integration platform',
  'data-platform': 'Data platform',
  'batch-processing': 'Batch processing',
  'mobile-backend': 'Mobile backend',
  'saas-product': 'SaaS product',
};

export const HOSTING_MODEL_LABELS: Record<HostingModel, string> = {
  'on-premises': 'On-premises',
  'private-cloud': 'Private cloud',
  'public-cloud': 'Public cloud',
  hybrid: 'Hybrid',
  saas: 'SaaS (vendor-hosted)',
};

export const ENVIRONMENT_TYPE_LABELS: Record<EnvironmentType, string> = {
  development: 'Development',
  test: 'Test',
  uat: 'UAT',
  'pre-production': 'Pre-production',
  production: 'Production',
  'disaster-recovery': 'Disaster recovery',
};

export const SOURCE_REPOSITORY_TYPE_LABELS: Record<SourceRepositoryType, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  infrastructure: 'Infrastructure',
  documentation: 'Documentation',
  library: 'Library',
  other: 'Other',
};
