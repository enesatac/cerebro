import type { RiskStatus } from '../types';

/** Risks that still need attention (not yet mitigated, accepted or closed). */
export function isActiveRisk(status: RiskStatus): boolean {
  return status === 'open' || status === 'monitoring';
}
