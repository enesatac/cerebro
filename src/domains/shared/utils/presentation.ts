import type { BadgeVariant } from '@takeoff-ui/react-spar';
import type {
  Criticality,
  DocumentationLinkType,
  StakeholderRole,
  TeamResponsibility,
} from '../types';

/** Label + Takeoff Badge variant for an enumerated value. Text is always shown with the colour. */
export interface StatusPresentation {
  label: string;
  variant: BadgeVariant;
}

export const CRITICALITY_PRESENTATION: Record<Criticality, StatusPresentation> = {
  low: { label: 'Low', variant: 'neutral' },
  medium: { label: 'Medium', variant: 'info' },
  high: { label: 'High', variant: 'warning' },
  critical: { label: 'Critical', variant: 'danger' },
};

export const STAKEHOLDER_ROLE_LABELS: Record<StakeholderRole, string> = {
  'business-owner': 'Business owner',
  'technical-owner': 'Technical owner',
  'product-owner': 'Product owner',
  sponsor: 'Sponsor',
  'project-manager': 'Project manager',
  'technical-lead': 'Technical lead',
  'analyst-lead': 'Analyst lead',
  analyst: 'Analyst',
  architect: 'Architect',
  developer: 'Developer',
  support: 'Support',
  stakeholder: 'Stakeholder',
};

export const TEAM_RESPONSIBILITY_LABELS: Record<TeamResponsibility, string> = {
  development: 'Development',
  support: 'Support',
  operations: 'Operations',
  delivery: 'Delivery',
};

export const DOCUMENTATION_LINK_TYPE_LABELS: Record<DocumentationLinkType, string> = {
  confluence: 'Confluence',
  jira: 'Jira',
  repository: 'Repository',
  architecture: 'Architecture',
  analysis: 'Analysis',
  design: 'Design',
  testing: 'Testing',
  deployment: 'Deployment',
  runbook: 'Runbook',
  monitoring: 'Monitoring',
  dashboard: 'Dashboard',
  other: 'Other',
};
