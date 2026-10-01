import { lazy, type ReactNode } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { RequirePermission } from '@/domains/auth/components/RequirePermission';
import type { Permission } from '@/domains/auth/types';
import { AppShell } from '../layout/AppShell';
import { paths } from './paths';
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
const LeavesPage = page(() => import('@/domains/leaves/pages/LeavesPage'));
const MasterDataPage = page(() => import('@/domains/master-data/pages/MasterDataPage'));
const UsersListPage = page(() => import('@/domains/auth/pages/UsersListPage'));
const UserFormPage = page(() => import('@/domains/auth/pages/UserFormPage'));
const SearchPage = page(() => import('@/domains/search/pages/SearchPage'));
const NotFoundPage = page(() => import('./NotFoundPage'));

/** Wraps a create/edit page so only roles with `portfolio:edit` can open it. */
function guarded(
  element: ReactNode,
  permission: Permission = 'portfolio:edit',
  action = 'kayıt oluşturma veya düzenleme',
) {
  return (
    <RequirePermission
      permission={permission}
      action={action}
      backTo={paths.dashboard()}
      backLabel="Gösterge paneline git"
    >
      {element}
    </RequirePermission>
  );
}

export const routes: RouteObject[] = [
  { path: 'sign-in', element: <SignInPage />, errorElement: <RouteErrorPage /> },
  {
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'applications', element: <ApplicationsListPage /> },
      { path: 'applications/new', element: guarded(<ApplicationFormPage />) },
      { path: 'applications/:applicationId', element: <ApplicationDetailPage /> },
      { path: 'applications/:applicationId/edit', element: guarded(<ApplicationFormPage />) },
      { path: 'projects', element: <ProjectsListPage /> },
      { path: 'projects/new', element: guarded(<ProjectFormPage />) },
      { path: 'projects/:projectId', element: <ProjectDetailPage /> },
      { path: 'projects/:projectId/edit', element: guarded(<ProjectFormPage />) },
      { path: 'architecture', element: <ConnectionsPage /> },
      { path: 'architecture/dependencies/new', element: guarded(<DependencyFormPage />) },
      {
        path: 'architecture/dependencies/:dependencyId/edit',
        element: guarded(<DependencyFormPage />),
      },
      { path: 'architecture/integrations/new', element: guarded(<IntegrationFormPage />) },
      {
        path: 'architecture/integrations/:integrationId/edit',
        element: guarded(<IntegrationFormPage />),
      },
      { path: 'people/:personId', element: <PersonDetailPage /> },
      { path: 'teams', element: <TeamsListPage /> },
      { path: 'teams/new', element: guarded(<TeamFormPage />) },
      { path: 'teams/:teamId', element: <TeamDetailPage /> },
      { path: 'teams/:teamId/edit', element: guarded(<TeamFormPage />) },
      { path: 'technologies', element: <TechnologiesListPage /> },
      { path: 'technologies/new', element: guarded(<TechnologyFormPage />) },
      { path: 'technologies/:technologyId', element: <TechnologyDetailPage /> },
      { path: 'technologies/:technologyId/edit', element: guarded(<TechnologyFormPage />) },
      { path: 'risks', element: <RisksAndEscalationsPage /> },
      { path: 'risks/new', element: guarded(<RiskFormPage />) },
      { path: 'risks/:riskId/edit', element: guarded(<RiskFormPage />) },
      { path: 'escalations/new', element: guarded(<EscalationFormPage />) },
      { path: 'escalations/:escalationId/edit', element: guarded(<EscalationFormPage />) },
      { path: 'decisions/new', element: guarded(<DecisionFormPage />) },
      { path: 'decisions/:decisionId/edit', element: guarded(<DecisionFormPage />) },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'leaves', element: <LeavesPage /> },
      {
        path: 'admin/master-data',
        element: guarded(<MasterDataPage />, 'masterData:manage', 'ana veri yönetimi'),
      },
      {
        path: 'admin/users',
        element: guarded(<UsersListPage />, 'users:manage', 'kullanıcı yönetimi'),
      },
      {
        path: 'admin/users/new',
        element: guarded(<UserFormPage />, 'users:manage', 'kullanıcı yönetimi'),
      },
      {
        path: 'admin/users/:userId/edit',
        element: guarded(<UserFormPage />, 'users:manage', 'kullanıcı yönetimi'),
      },
      { path: 'search', element: <SearchPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
