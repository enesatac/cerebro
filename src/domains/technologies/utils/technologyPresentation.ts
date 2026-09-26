import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type { TechnologyCategory, TechnologyStatus } from '../types';

export const TECHNOLOGY_CATEGORY_LABELS: Record<TechnologyCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Veritabanı',
  messaging: 'Mesajlaşma',
  infrastructure: 'Altyapı',
  devops: 'DevOps',
  monitoring: 'İzleme',
  testing: 'Test',
};

export const TECHNOLOGY_STATUS_PRESENTATION: Record<TechnologyStatus, StatusPresentation> = {
  preferred: { label: 'Tercih edilen', variant: 'success' },
  supported: { label: 'Destekleniyor', variant: 'info' },
  deprecated: { label: 'Kullanımdan kalkıyor', variant: 'warning' },
  retired: { label: 'Emekli', variant: 'danger' },
};
