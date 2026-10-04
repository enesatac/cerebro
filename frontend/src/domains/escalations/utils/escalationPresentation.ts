import type { EscalationStatus } from '../types';

export function isActiveEscalation(status: EscalationStatus): boolean {
  return status === 'open' || status === 'in-progress';
}
