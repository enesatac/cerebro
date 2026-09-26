import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type { EscalationStatus } from '../types';

export const ESCALATION_STATUS_PRESENTATION: Record<EscalationStatus, StatusPresentation> = {
  open: { label: 'Open', variant: 'danger' },
  'in-progress': { label: 'In progress', variant: 'warning' },
  resolved: { label: 'Resolved', variant: 'success' },
  closed: { label: 'Closed', variant: 'neutral' },
};

export function isActiveEscalation(status: EscalationStatus): boolean {
  return status === 'open' || status === 'in-progress';
}
