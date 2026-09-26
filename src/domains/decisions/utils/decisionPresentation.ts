import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type { DecisionStatus } from '../types';

export const DECISION_STATUS_PRESENTATION: Record<DecisionStatus, StatusPresentation> = {
  proposed: { label: 'Önerildi', variant: 'info' },
  accepted: { label: 'Kabul edildi', variant: 'success' },
  rejected: { label: 'Reddedildi', variant: 'neutral' },
  superseded: { label: 'Yerini yenisi aldı', variant: 'warning' },
  deprecated: { label: 'Geçersiz', variant: 'warning' },
};
