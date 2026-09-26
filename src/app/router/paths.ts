/**
 * URL builders for every route. Pure module — importable from any layer so no route string is
 * ever duplicated. Route *definitions* live in `routes.tsx`.
 */
const id = (value: string) => encodeURIComponent(value);
const withQuery = (path: string, query?: Record<string, string | undefined>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) if (value) params.set(key, value);
  const text = params.toString();
  return text ? `${path}?${text}` : path;
};

/** Pre-fill links for forms opened from a related record ("Add risk" on an application). */
export interface RelatedPrefill {
  application?: string;
  project?: string;
}

export const paths = {
  dashboard: () => '/',
  signIn: (redirectTo?: string) => withQuery('/sign-in', { redirect: redirectTo }),
  applications: {
    list: () => '/applications',
    detail: (applicationId: string) => `/applications/${id(applicationId)}`,
    create: () => '/applications/new',
    edit: (applicationId: string) => `/applications/${id(applicationId)}/edit`,
  },
  projects: {
    list: () => '/projects',
    detail: (projectId: string) => `/projects/${id(projectId)}`,
    create: () => '/projects/new',
    edit: (projectId: string) => `/projects/${id(projectId)}/edit`,
  },
  architecture: (applicationId?: string) => withQuery('/architecture', { app: applicationId }),
  dependencies: {
    create: (sourceApplicationId?: string) =>
      withQuery('/architecture/dependencies/new', { source: sourceApplicationId }),
    edit: (dependencyId: string) => `/architecture/dependencies/${id(dependencyId)}/edit`,
  },
  integrations: {
    create: (fromApplicationId?: string) =>
      withQuery('/architecture/integrations/new', { from: fromApplicationId }),
    edit: (integrationId: string) => `/architecture/integrations/${id(integrationId)}/edit`,
  },
  teams: {
    list: () => '/teams',
    detail: (teamId: string) => `/teams/${id(teamId)}`,
    create: () => '/teams/new',
    edit: (teamId: string) => `/teams/${id(teamId)}/edit`,
  },
  technologies: {
    list: () => '/technologies',
    detail: (technologyId: string) => `/technologies/${id(technologyId)}`,
    create: () => '/technologies/new',
    edit: (technologyId: string) => `/technologies/${id(technologyId)}/edit`,
  },
  risks: (tab?: 'risks' | 'escalations') => (tab === 'risks' ? '/risks?tab=risks' : '/risks'),
  riskForms: {
    create: (prefill?: RelatedPrefill) => withQuery('/risks/new', { ...prefill }),
    edit: (riskId: string) => `/risks/${id(riskId)}/edit`,
  },
  escalationForms: {
    create: (prefill?: RelatedPrefill) => withQuery('/escalations/new', { ...prefill }),
    edit: (escalationId: string) => `/escalations/${id(escalationId)}/edit`,
  },
  decisionForms: {
    create: (prefill?: RelatedPrefill) => withQuery('/decisions/new', { ...prefill }),
    edit: (decisionId: string) => `/decisions/${id(decisionId)}/edit`,
  },
  reports: () => '/reports',
  admin: {
    users: () => '/admin/users',
    createUser: () => '/admin/users/new',
    editUser: (userId: string) => `/admin/users/${id(userId)}/edit`,
  },
  search: (term?: string) => withQuery('/search', { q: term }),
} as const;
