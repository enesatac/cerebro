import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type {
  ApplicationLifecycle,
  ApplicationType,
  EnvironmentStatus,
  EnvironmentType,
  HostingModel,
  OperationalStatus,
  SourceRepositoryType,
} from '../types';

export const LIFECYCLE_PRESENTATION: Record<ApplicationLifecycle, StatusPresentation> = {
  planned: { label: 'Planlandı', variant: 'neutral' },
  development: { label: 'Geliştirmede', variant: 'info' },
  active: { label: 'Aktif', variant: 'success' },
  maintenance: { label: 'Bakımda', variant: 'secondary' },
  deprecated: { label: 'Kullanımdan kalkıyor', variant: 'warning' },
  retired: { label: 'Emekli', variant: 'dark' },
};

export const OPERATIONAL_STATUS_PRESENTATION: Record<OperationalStatus, StatusPresentation> = {
  operational: { label: 'Çalışıyor', variant: 'success' },
  degraded: { label: 'Kısmi kesinti', variant: 'warning' },
  outage: { label: 'Kesinti', variant: 'danger' },
  'not-deployed': { label: 'Kurulu değil', variant: 'neutral' },
};

export const ENVIRONMENT_STATUS_PRESENTATION: Record<EnvironmentStatus, StatusPresentation> = {
  available: { label: 'Erişilebilir', variant: 'success' },
  degraded: { label: 'Kısmi kesinti', variant: 'warning' },
  unavailable: { label: 'Erişilemiyor', variant: 'danger' },
  decommissioned: { label: 'Devreden çıkarıldı', variant: 'neutral' },
};

export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  'web-application': 'Web uygulaması',
  'api-service': 'API servisi',
  'integration-platform': 'Entegrasyon platformu',
  'data-platform': 'Veri platformu',
  'batch-processing': 'Toplu işleme',
  'mobile-backend': 'Mobil backend',
  'saas-product': 'SaaS ürünü',
};

export const HOSTING_MODEL_LABELS: Record<HostingModel, string> = {
  'on-premises': 'Şirket içi',
  'private-cloud': 'Özel bulut',
  'public-cloud': 'Genel bulut',
  hybrid: 'Hibrit',
  saas: 'SaaS (tedarikçi barındırmalı)',
};

export const ENVIRONMENT_TYPE_LABELS: Record<EnvironmentType, string> = {
  development: 'Geliştirme',
  test: 'Test',
  uat: 'UAT',
  'pre-production': 'Canlı öncesi',
  production: 'Canlı',
  'disaster-recovery': 'Felaket kurtarma',
};

export const SOURCE_REPOSITORY_TYPE_LABELS: Record<SourceRepositoryType, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  infrastructure: 'Altyapı',
  documentation: 'Dokümantasyon',
  library: 'Kütüphane',
  other: 'Diğer',
};
