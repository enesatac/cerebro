import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type { RiskCategory, RiskStatus } from '../types';

export const RISK_STATUS_PRESENTATION: Record<RiskStatus, StatusPresentation> = {
  open: { label: 'Açık', variant: 'danger' },
  monitoring: { label: 'İzleniyor', variant: 'warning' },
  mitigated: { label: 'Azaltıldı', variant: 'info' },
  accepted: { label: 'Kabul edildi', variant: 'neutral' },
  closed: { label: 'Kapatıldı', variant: 'success' },
};

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  technical: 'Teknik',
  security: 'Güvenlik',
  operational: 'Operasyonel',
  compliance: 'Uyum',
  delivery: 'Teslimat',
  financial: 'Finansal',
  vendor: 'Tedarikçi',
};

/** Risks that still need attention (not yet mitigated, accepted or closed). */
export function isActiveRisk(status: RiskStatus): boolean {
  return status === 'open' || status === 'monitoring';
}
