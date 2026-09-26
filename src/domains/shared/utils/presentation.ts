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
  low: { label: 'Düşük', variant: 'neutral' },
  medium: { label: 'Orta', variant: 'info' },
  high: { label: 'Yüksek', variant: 'warning' },
  critical: { label: 'Kritik', variant: 'danger' },
};

export const STAKEHOLDER_ROLE_LABELS: Record<StakeholderRole, string> = {
  'business-owner': 'İş sahibi',
  'technical-owner': 'Teknik sahip',
  'product-owner': 'Ürün sahibi',
  sponsor: 'Sponsor',
  'project-manager': 'Proje yöneticisi',
  'technical-lead': 'Teknik lider',
  'analyst-lead': 'Analist lideri',
  analyst: 'Analist',
  architect: 'Mimar',
  developer: 'Geliştirici',
  support: 'Destek',
  stakeholder: 'Paydaş',
};

export const TEAM_RESPONSIBILITY_LABELS: Record<TeamResponsibility, string> = {
  development: 'Geliştirme',
  support: 'Destek',
  operations: 'Operasyon',
  delivery: 'Teslimat',
};

export const DOCUMENTATION_LINK_TYPE_LABELS: Record<DocumentationLinkType, string> = {
  confluence: 'Confluence',
  jira: 'Jira',
  repository: 'Kod deposu',
  architecture: 'Mimari',
  analysis: 'Analiz',
  design: 'Tasarım',
  testing: 'Test',
  deployment: 'Dağıtım',
  runbook: 'Runbook',
  monitoring: 'İzleme',
  dashboard: 'Gösterge paneli',
  other: 'Diğer',
};
