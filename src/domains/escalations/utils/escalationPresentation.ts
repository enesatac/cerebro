import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type { EscalationStatus } from '../types';

export const ESCALATION_STATUS_PRESENTATION: Record<EscalationStatus, StatusPresentation> = {
  open: { label: 'Açık', variant: 'danger' },
  'in-progress': { label: 'Devam ediyor', variant: 'warning' },
  resolved: { label: 'Çözüldü', variant: 'success' },
  closed: { label: 'Kapatıldı', variant: 'neutral' },
};

export function isActiveEscalation(status: EscalationStatus): boolean {
  return status === 'open' || status === 'in-progress';
}
