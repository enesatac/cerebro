import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type {
  ApplicationImpactType,
  ConfidentialityLevel,
  MilestoneStatus,
  ProjectHealth,
  ProjectPhase,
  ProjectStatus,
  ProjectType,
} from '../types';

export const PROJECT_STATUS_PRESENTATION: Record<ProjectStatus, StatusPresentation> = {
  proposed: { label: 'Önerildi', variant: 'neutral' },
  approved: { label: 'Onaylandı', variant: 'info' },
  'in-progress': { label: 'Devam ediyor', variant: 'primary' },
  'on-hold': { label: 'Beklemede', variant: 'warning' },
  completed: { label: 'Tamamlandı', variant: 'success' },
  cancelled: { label: 'İptal edildi', variant: 'dark' },
};

export const PROJECT_HEALTH_PRESENTATION: Record<ProjectHealth, StatusPresentation> = {
  'on-track': { label: 'Yolunda', variant: 'success' },
  'at-risk': { label: 'Riskli', variant: 'warning' },
  critical: { label: 'Kritik', variant: 'danger' },
  completed: { label: 'Tamamlandı', variant: 'neutral' },
};

export const APPLICATION_IMPACT_LABELS: Record<ApplicationImpactType, string> = {
  creates: 'Oluşturur',
  modifies: 'Değiştirir',
  'integrates-with': 'Entegre olur',
  decommissions: 'Devreden çıkarır',
};

export const PROJECT_PHASE_LABELS: Record<ProjectPhase, string> = {
  initiation: 'Başlatma',
  analysis: 'Analiz',
  design: 'Tasarım',
  build: 'Geliştirme',
  test: 'Test',
  deployment: 'Dağıtım',
  hypercare: 'Yoğun destek',
  closure: 'Kapanış',
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  'new-product': 'Yeni ürün',
  modernisation: 'Modernizasyon',
  integration: 'Entegrasyon',
  regulatory: 'Mevzuat',
  infrastructure: 'Altyapı',
  decommissioning: 'Devreden çıkarma',
};

export const CONFIDENTIALITY_LABELS: Record<ConfidentialityLevel, string> = {
  public: 'Herkese açık',
  internal: 'Kurum içi',
  confidential: 'Gizli',
  restricted: 'Kısıtlı',
};

export const MILESTONE_STATUS_PRESENTATION: Record<MilestoneStatus, StatusPresentation> = {
  planned: { label: 'Planlandı', variant: 'neutral' },
  'in-progress': { label: 'Devam ediyor', variant: 'info' },
  completed: { label: 'Tamamlandı', variant: 'success' },
  'at-risk': { label: 'Riskli', variant: 'warning' },
  missed: { label: 'Kaçırıldı', variant: 'danger' },
};
