import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type {
  ApplicationImpactType,
  ConfidentialityLevel,
  MilestoneStatus,
  ProjectHealth,
  ProjectPhase,
  ProjectStatus,
  ProjectType,
} from '../types';

export const PROJECT_STATUS_PRESENTATION: Record<ProjectStatus, StatusPresentation> = {
  proposed: { label: 'Proposed', variant: 'neutral' },
  approved: { label: 'Approved', variant: 'info' },
  'in-progress': { label: 'In progress', variant: 'primary' },
  'on-hold': { label: 'On hold', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'dark' },
};

export const PROJECT_HEALTH_PRESENTATION: Record<ProjectHealth, StatusPresentation> = {
  'on-track': { label: 'On track', variant: 'success' },
  'at-risk': { label: 'At risk', variant: 'warning' },
  critical: { label: 'Critical', variant: 'danger' },
  completed: { label: 'Completed', variant: 'neutral' },
};

export const APPLICATION_IMPACT_LABELS: Record<ApplicationImpactType, string> = {
  creates: 'Creates',
  modifies: 'Modifies',
  'integrates-with': 'Integrates with',
  decommissions: 'Decommissions',
};

export const PROJECT_PHASE_LABELS: Record<ProjectPhase, string> = {
  initiation: 'Initiation',
  analysis: 'Analysis',
  design: 'Design',
  build: 'Build',
  test: 'Test',
  deployment: 'Deployment',
  hypercare: 'Hypercare',
  closure: 'Closure',
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  'new-product': 'New product',
  modernisation: 'Modernisation',
  integration: 'Integration',
  regulatory: 'Regulatory',
  infrastructure: 'Infrastructure',
  decommissioning: 'Decommissioning',
};

export const CONFIDENTIALITY_LABELS: Record<ConfidentialityLevel, string> = {
  public: 'Public',
  internal: 'Internal',
  confidential: 'Confidential',
  restricted: 'Restricted',
};

export const MILESTONE_STATUS_PRESENTATION: Record<MilestoneStatus, StatusPresentation> = {
  planned: { label: 'Planned', variant: 'neutral' },
  'in-progress': { label: 'In progress', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  'at-risk': { label: 'At risk', variant: 'warning' },
  missed: { label: 'Missed', variant: 'danger' },
};
