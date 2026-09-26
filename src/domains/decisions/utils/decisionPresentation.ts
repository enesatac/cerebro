import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type { DecisionStatus } from '../types';

export const DECISION_STATUS_PRESENTATION: Record<DecisionStatus, StatusPresentation> = {
  proposed: { label: 'Proposed', variant: 'info' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'neutral' },
  superseded: { label: 'Superseded', variant: 'warning' },
  deprecated: { label: 'Deprecated', variant: 'warning' },
};
