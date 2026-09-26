export const APPLICATION_DETAIL_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'technical', label: 'Technical' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'environments', label: 'Environments' },
  { id: 'repositories', label: 'Repositories' },
  { id: 'documentation', label: 'Documentation' },
  { id: 'projects', label: 'Projects' },
  { id: 'risks', label: 'Risks & Escalations' },
  { id: 'history', label: 'History' },
] as const;

export type ApplicationDetailTab = (typeof APPLICATION_DETAIL_TABS)[number]['id'];

export const APPLICATION_DETAIL_TAB_IDS = APPLICATION_DETAIL_TABS.map((tab) => tab.id);
