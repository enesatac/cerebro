/**
 * URL builders for every route. Pure module — importable from any layer so no route string is
 * ever duplicated. Route *definitions* live in `routes.tsx`.
 */
import type { EntityId } from '@/domains/shared/types';

/** Record ids are numeric primary keys, so they are URL-safe as they are. */
const id = (value: EntityId) => String(value);
const withQuery = (path: string, query?: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `${path}?${text}` : path;
};

/** Pre-fill links for forms opened from a related record ("Add risk" on an application). */
export interface RelatedPrefill {
  application?: EntityId;
  project?: EntityId;
}

export const paths = {
  dashboard: () => '/',
  signIn: (redirectTo?: string) => withQuery('/sign-in', { redirect: redirectTo }),
  applications: {
    /** Optional filters use the list page's own URL parameters. */
    list: (filter?: {
      lifecycle?: string;
      criticality?: string;
      bu?: EntityId;
      technology?: EntityId;
    }) => withQuery('/applications', { ...filter }),
    detail: (applicationId: EntityId) => `/applications/${id(applicationId)}`,
    create: () => '/applications/new',
    edit: (applicationId: EntityId) => `/applications/${id(applicationId)}/edit`,
    /** The application's "Sorun anında" tab (its incident runbook). */
    runbook: (applicationId: EntityId) => `/applications/${id(applicationId)}?tab=runbook`,
    editRunbook: (applicationId: EntityId) => `/applications/${id(applicationId)}/runbook/edit`,
  },
  projects: {
    list: (filter?: { status?: string; health?: string }) => withQuery('/projects', { ...filter }),
    detail: (projectId: EntityId) => `/projects/${id(projectId)}`,
    create: () => '/projects/new',
    edit: (projectId: EntityId) => `/projects/${id(projectId)}/edit`,
  },
  contracts: {
    /** `tab`: `contracts` (default), `upcoming` or `vendors`. */
    list: (tab?: 'upcoming' | 'vendors') => withQuery('/contracts', { tab }),
    detail: (contractId: EntityId) => `/contracts/${id(contractId)}`,
    /** `project` pre-fills the project when opened from a project's purchases tab. */
    create: (project?: EntityId) => withQuery('/contracts/new', { project }),
    edit: (contractId: EntityId) => `/contracts/${id(contractId)}/edit`,
  },
  releases: {
    /** `tab`: `calendar` (default) or `list`; `rows`: `application` (default) or `project`. */
    list: (view?: { tab?: 'list'; rows?: 'project' }) =>
      withQuery('/releases', { tab: view?.tab, rows: view?.rows }),
    detail: (releaseId: EntityId) => `/releases/${id(releaseId)}`,
    /** Pre-fills the application, project and date (from a detail tab or a calendar day). */
    create: (prefill?: { application?: EntityId; project?: EntityId; date?: string }) =>
      withQuery('/releases/new', { ...prefill }),
    edit: (releaseId: EntityId) => `/releases/${id(releaseId)}/edit`,
  },
  procurement: {
    /** `tab`: `purchases` (default) or `deadlines`. */
    list: (tab?: 'deadlines') => withQuery('/procurement', { tab }),
    detail: (contractId: EntityId) => `/procurement/${id(contractId)}`,
    editSteps: (contractId: EntityId) => `/procurement/${id(contractId)}/steps`,
  },
  demands: {
    /** `tab`: `mine` (default) or `all`. */
    list: (tab?: 'all') => withQuery('/demands', { tab }),
    detail: (demandId: EntityId) => `/demands/${id(demandId)}`,
    create: () => '/demands/new',
    edit: (demandId: EntityId) => `/demands/${id(demandId)}/edit`,
    /** The portfolio office's screen; `tab`: `inbox` (default), `backlog` or `roadmap`. */
    manage: (tab?: 'backlog' | 'roadmap') => withQuery('/demands/manage', { tab }),
  },
  /** The connections screen; with an application it opens that application's impact analysis. */
  architecture: (applicationId?: EntityId) =>
    withQuery('/architecture', {
      tab: applicationId === undefined ? undefined : 'impact',
      app: applicationId,
    }),
  /** The portfolio map, optionally with an application or project selected (`a-3`, `p-2`). */
  portfolioMap: (focus?: string) => withQuery('/architecture', { focus }),
  dependencies: {
    create: (sourceApplicationId?: EntityId) =>
      withQuery('/architecture/dependencies/new', { source: sourceApplicationId }),
    edit: (dependencyId: EntityId) => `/architecture/dependencies/${id(dependencyId)}/edit`,
  },
  integrations: {
    create: (fromApplicationId?: EntityId) =>
      withQuery('/architecture/integrations/new', { from: fromApplicationId }),
    edit: (integrationId: EntityId) => `/architecture/integrations/${id(integrationId)}/edit`,
  },
  people: {
    detail: (personId: EntityId) => `/people/${id(personId)}`,
  },
  teams: {
    list: () => '/teams',
    detail: (teamId: EntityId) => `/teams/${id(teamId)}`,
    create: () => '/teams/new',
    edit: (teamId: EntityId) => `/teams/${id(teamId)}/edit`,
  },
  technologies: {
    list: () => '/technologies',
    detail: (technologyId: EntityId) => `/technologies/${id(technologyId)}`,
    create: () => '/technologies/new',
    edit: (technologyId: EntityId) => `/technologies/${id(technologyId)}/edit`,
  },
  risks: (tab?: 'risks' | 'escalations') => (tab === 'risks' ? '/risks?tab=risks' : '/risks'),
  riskForms: {
    create: (prefill?: RelatedPrefill) => withQuery('/risks/new', { ...prefill }),
    edit: (riskId: EntityId) => `/risks/${id(riskId)}/edit`,
  },
  escalationForms: {
    create: (prefill?: RelatedPrefill) => withQuery('/escalations/new', { ...prefill }),
    edit: (escalationId: EntityId) => `/escalations/${id(escalationId)}/edit`,
  },
  decisionForms: {
    create: (prefill?: RelatedPrefill) => withQuery('/decisions/new', { ...prefill }),
    edit: (decisionId: EntityId) => `/decisions/${id(decisionId)}/edit`,
  },
  reports: () => '/reports',
  leaves: () => '/leaves',
  /** `person` pre-fills the planner's search (a person's name). */
  resources: (person?: string) => withQuery('/resources', { q: person }),
  admin: {
    /** `section` is a master data list key, `business-units` or `people`. */
    masterData: (section?: string) =>
      section ? `/admin/master-data?section=${encodeURIComponent(section)}` : '/admin/master-data',
    users: () => '/admin/users',
    createUser: () => '/admin/users/new',
    editUser: (userId: EntityId) => `/admin/users/${id(userId)}/edit`,
    /** `tab`: `roles` (default), `matrix` or `catalog`. */
    roles: (tab?: 'matrix' | 'catalog') => withQuery('/admin/roles', { tab }),
    createRole: () => '/admin/roles/new',
    editRole: (roleId: EntityId) => `/admin/roles/${id(roleId)}/edit`,
  },
  search: (term?: string) => withQuery('/search', { q: term }),
} as const;
