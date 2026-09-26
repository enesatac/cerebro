import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type { RiskCategory, RiskStatus } from '../types';

export const RISK_STATUS_PRESENTATION: Record<RiskStatus, StatusPresentation> = {
  open: { label: 'Open', variant: 'danger' },
  monitoring: { label: 'Monitoring', variant: 'warning' },
  mitigated: { label: 'Mitigated', variant: 'info' },
  accepted: { label: 'Accepted', variant: 'neutral' },
  closed: { label: 'Closed', variant: 'success' },
};

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  technical: 'Technical',
  security: 'Security',
  operational: 'Operational',
  compliance: 'Compliance',
  delivery: 'Delivery',
  financial: 'Financial',
  vendor: 'Vendor',
};

/** Risks that still need attention (not yet mitigated, accepted or closed). */
export function isActiveRisk(status: RiskStatus): boolean {
  return status === 'open' || status === 'monitoring';
}
