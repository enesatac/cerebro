export const APPLICATION_DETAIL_TABS = [
  { id: 'overview', label: 'Genel bakış' },
  { id: 'runbook', label: 'Sorun anında' },
  { id: 'technical', label: 'Teknik' },
  { id: 'dependencies', label: 'Bağımlılıklar' },
  { id: 'integrations', label: 'Entegrasyonlar' },
  { id: 'environments', label: 'Ortamlar' },
  { id: 'repositories', label: 'Kod depoları' },
  { id: 'documentation', label: 'Dokümantasyon' },
  { id: 'projects', label: 'Projeler' },
  { id: 'risks', label: 'Riskler ve Eskalasyonlar' },
  { id: 'history', label: 'Geçmiş' },
] as const;

export type ApplicationDetailTab = (typeof APPLICATION_DETAIL_TABS)[number]['id'];

export const APPLICATION_DETAIL_TAB_IDS = APPLICATION_DETAIL_TABS.map((tab) => tab.id);
