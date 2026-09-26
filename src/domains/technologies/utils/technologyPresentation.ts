import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type { TechnologyCategory, TechnologyStatus } from '../types';

export const TECHNOLOGY_CATEGORY_LABELS: Record<TechnologyCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  messaging: 'Messaging',
  infrastructure: 'Infrastructure',
  devops: 'DevOps',
  monitoring: 'Monitoring',
  testing: 'Testing',
};

export const TECHNOLOGY_STATUS_PRESENTATION: Record<TechnologyStatus, StatusPresentation> = {
  preferred: { label: 'Preferred', variant: 'success' },
  supported: { label: 'Supported', variant: 'info' },
  deprecated: { label: 'Deprecated', variant: 'warning' },
  retired: { label: 'Retired', variant: 'danger' },
};
