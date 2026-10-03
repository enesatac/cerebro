import { lazy, type ReactNode } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { RequirePrivilege } from '@/domains/auth/components/RequirePrivilege';
import { PRIVILEGE_MODULES, type Privilege } from '@/domains/auth/types';
import { AppShell } from '../layout/AppShell';
import { paths } from './paths';
import { HomeRoute } from './HomeRoute';
import { RouteErrorPage } from './RouteErrorPage';

const page = (loader: Parameters<typeof lazy>[0]) => lazy(loader);

const SignInPage = page(() => import('@/domains/auth/pages/SignInPage'));
const DashboardPage = page(() => import('@/domains/governance/pages/DashboardPage'));
const ApplicationsListPage = page(
  () => import('@/domains/applications/pages/ApplicationsListPage'),
);
const ApplicationDetailPage = page(
  () => import('@/domains/applications/pages/ApplicationDetailPage'),
);
const ApplicationFormPage = page(() => import('@/domains/applications/pages/ApplicationFormPage'));
const ProjectsListPage = page(() => import('@/domains/projects/pages/ProjectsListPage'));
const ProjectDetailPage = page(() => import('@/domains/projects/pages/ProjectDetailPage'));
const ProjectFormPage = page(() => import('@/domains/projects/pages/ProjectFormPage'));
const DemandsPage = page(() => import('@/domains/demands/pages/DemandsPage'));
const DemandDetailPage = page(() => import('@/domains/demands/pages/DemandDetailPage'));
const DemandFormPage = page(() => import('@/domains/demands/pages/DemandFormPage'));
const DemandManagementPage = page(() => import('@/domains/demands/pages/DemandManagementPage'));
const ConnectionsPage = page(() => import('@/domains/connections/pages/ConnectionsPage'));
const DependencyFormPage = page(() => import('@/domains/connections/pages/DependencyFormPage'));
const IntegrationFormPage = page(() => import('@/domains/connections/pages/IntegrationFormPage'));
const TeamsListPage = page(() => import('@/domains/teams/pages/TeamsListPage'));
const TeamDetailPage = page(() => import('@/domains/teams/pages/TeamDetailPage'));
const TeamFormPage = page(() => import('@/domains/teams/pages/TeamFormPage'));
const TechnologiesListPage = page(
  () => import('@/domains/technologies/pages/TechnologiesListPage'),
);
const TechnologyDetailPage = page(
  () => import('@/domains/technologies/pages/TechnologyDetailPage'),
);
const TechnologyFormPage = page(() => import('@/domains/technologies/pages/TechnologyFormPage'));
const RisksAndEscalationsPage = page(() => import('@/domains/risks/pages/RisksAndEscalationsPage'));
const RiskFormPage = page(() => import('@/domains/risks/pages/RiskFormPage'));
const EscalationFormPage = page(() => import('@/domains/escalations/pages/EscalationFormPage'));
const DecisionFormPage = page(() => import('@/domains/decisions/pages/DecisionFormPage'));
const ReportsPage = page(() => import('@/domains/governance/pages/ReportsPage'));
const PersonDetailPage = page(() => import('@/domains/people/pages/PersonDetailPage'));
const RunbookFormPage = page(() => import('@/domains/runbooks/pages/RunbookFormPage'));
const ResourcePlanPage = page(() => import('@/domains/resources/pages/ResourcePlanPage'));
const LeavesPage = page(() => import('@/domains/leaves/pages/LeavesPage'));
const MasterDataPage = page(() => import('@/domains/master-data/pages/MasterDataPage'));
const UsersListPage = page(() => import('@/domains/auth/pages/UsersListPage'));
const UserFormPage = page(() => import('@/domains/auth/pages/UserFormPage'));
const SearchPage = page(() => import('@/domains/search/pages/SearchPage'));
const NotFoundPage = page(() => import('./NotFoundPage'));

const RolesPage = page(() => import('@/domains/auth/pages/RolesPage'));
const RoleFormPage = page(() => import('@/domains/auth/pages/RoleFormPage'));

const MODULE_LABELS = new Map<string, string>(PRIVILEGE_MODULES.map((m) => [m.id, m.label]));

/**
 * Wraps a page so only roles holding `privilege` (or any of several) can open it. The repository
 * enforces the same privilege on every write.
 */
function guarded(element: ReactNode, privilege: Privilege | readonly Privilege[]) {
  const first = typeof privilege === 'string' ? privilege : (privilege[0] as Privilege);
  const [module, level] = first.split(':');
  const screen = MODULE_LABELS.get(module ?? '') ?? '';
  return (
    <RequirePrivilege
      privilege={privilege}
      action={
        level === 'view' ? `${screen} ekranını görüntüleme` : `${screen} ekranında değişiklik`
      }
      backTo={paths.dashboard()}
      backLabel="Ana sayfaya git"
    >
      {element}
    </RequirePrivilege>
  );
}

export const routes: RouteObject[] = [
  { path: 'sign-in', element: <SignInPage />, errorElement: <RouteErrorPage /> },
  {
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomeRoute dashboard={<DashboardPage />} /> },
      { path: 'applications', element: guarded(<ApplicationsListPage />, 'applications:view') },
      { path: 'applications/new', element: guarded(<ApplicationFormPage />, 'applications:edit') },
      {
        path: 'applications/:applicationId',
        element: guarded(<ApplicationDetailPage />, 'applications:view'),
      },
      {
        path: 'applications/:applicationId/edit',
        element: guarded(<ApplicationFormPage />, 'applications:edit'),
      },
      {
        path: 'applications/:applicationId/runbook/edit',
        element: guarded(<RunbookFormPage />, 'applications:edit'),
      },
      { path: 'projects', element: guarded(<ProjectsListPage />, 'projects:view') },
      { path: 'projects/new', element: guarded(<ProjectFormPage />, 'projects:edit') },
      { path: 'projects/:projectId', element: guarded(<ProjectDetailPage />, 'projects:view') },
      { path: 'projects/:projectId/edit', element: guarded(<ProjectFormPage />, 'projects:edit') },
      { path: 'demands', element: guarded(<DemandsPage />, 'demands:view') },
      { path: 'demands/new', element: guarded(<DemandFormPage />, 'demands:edit') },
      {
        path: 'demands/manage',
        element: guarded(<DemandManagementPage />, 'demandManagement:view'),
      },
      { path: 'demands/:demandId', element: guarded(<DemandDetailPage />, 'demands:view') },
      {
        path: 'demands/:demandId/edit',
        element: guarded(<DemandFormPage />, ['demands:edit', 'demandManagement:edit']),
      },
      { path: 'architecture', element: guarded(<ConnectionsPage />, 'connections:view') },
      {
        path: 'architecture/dependencies/new',
        element: guarded(<DependencyFormPage />, 'connections:edit'),
      },
      {
        path: 'architecture/dependencies/:dependencyId/edit',
        element: guarded(<DependencyFormPage />, 'connections:edit'),
      },
      {
        path: 'architecture/integrations/new',
        element: guarded(<IntegrationFormPage />, 'connections:edit'),
      },
      {
        path: 'architecture/integrations/:integrationId/edit',
        element: guarded(<IntegrationFormPage />, 'connections:edit'),
      },
      { path: 'people/:personId', element: guarded(<PersonDetailPage />, 'people:view') },
      { path: 'teams', element: guarded(<TeamsListPage />, 'teams:view') },
      { path: 'teams/new', element: guarded(<TeamFormPage />, 'teams:edit') },
      { path: 'teams/:teamId', element: guarded(<TeamDetailPage />, 'teams:view') },
      { path: 'teams/:teamId/edit', element: guarded(<TeamFormPage />, 'teams:edit') },
      { path: 'technologies', element: guarded(<TechnologiesListPage />, 'technologies:view') },
      {
        path: 'technologies/new',
        element: guarded(<TechnologyFormPage />, 'technologies:edit'),
      },
      {
        path: 'technologies/:technologyId',
        element: guarded(<TechnologyDetailPage />, 'technologies:view'),
      },
      {
        path: 'technologies/:technologyId/edit',
        element: guarded(<TechnologyFormPage />, 'technologies:edit'),
      },
      { path: 'risks', element: guarded(<RisksAndEscalationsPage />, 'risks:view') },
      { path: 'risks/new', element: guarded(<RiskFormPage />, 'risks:edit') },
      { path: 'risks/:riskId/edit', element: guarded(<RiskFormPage />, 'risks:edit') },
      { path: 'escalations/new', element: guarded(<EscalationFormPage />, 'risks:edit') },
      {
        path: 'escalations/:escalationId/edit',
        element: guarded(<EscalationFormPage />, 'risks:edit'),
      },
      { path: 'decisions/new', element: guarded(<DecisionFormPage />, 'risks:edit') },
      { path: 'decisions/:decisionId/edit', element: guarded(<DecisionFormPage />, 'risks:edit') },
      { path: 'reports', element: guarded(<ReportsPage />, 'reports:view') },
      { path: 'leaves', element: guarded(<LeavesPage />, 'leaves:view') },
      { path: 'resources', element: guarded(<ResourcePlanPage />, 'resources:view') },
      { path: 'admin/master-data', element: guarded(<MasterDataPage />, 'masterData:view') },
      { path: 'admin/users', element: guarded(<UsersListPage />, 'users:view') },
      { path: 'admin/users/new', element: guarded(<UserFormPage />, 'users:edit') },
      { path: 'admin/users/:userId/edit', element: guarded(<UserFormPage />, 'users:edit') },
      { path: 'admin/roles', element: guarded(<RolesPage />, 'roles:view') },
      { path: 'admin/roles/new', element: guarded(<RoleFormPage />, 'roles:edit') },
      { path: 'admin/roles/:roleId/edit', element: guarded(<RoleFormPage />, 'roles:edit') },
      { path: 'search', element: <SearchPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
