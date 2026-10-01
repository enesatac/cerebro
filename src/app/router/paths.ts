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
    list: () => '/applications',
    detail: (applicationId: EntityId) => `/applications/${id(applicationId)}`,
    create: () => '/applications/new',
    edit: (applicationId: EntityId) => `/applications/${id(applicationId)}/edit`,
    /** The application's "Sorun anında" tab (its incident runbook). */
    runbook: (applicationId: EntityId) => `/applications/${id(applicationId)}?tab=runbook`,
    editRunbook: (applicationId: EntityId) => `/applications/${id(applicationId)}/runbook/edit`,
  },
  projects: {
    list: () => '/projects',
    detail: (projectId: EntityId) => `/projects/${id(projectId)}`,
    create: () => '/projects/new',
    edit: (projectId: EntityId) => `/projects/${id(projectId)}/edit`,
  },
  architecture: (applicationId?: EntityId) => withQuery('/architecture', { app: applicationId }),
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
  },
  search: (term?: string) => withQuery('/search', { q: term }),
} as const;
