import type { Application, ApplicationListItem } from '@/domains/applications/types';
import type { Attachment, AttachmentOwnerType } from '@/domains/attachments/types';
import type { Role, SessionUser, UserAccount } from '@/domains/auth/types';
import type { BusinessUnit } from '@/domains/business-units/types';
import type {
  ApplicationDependencies,
  ApplicationDependency,
  ApplicationIntegrations,
  Integration,
  PortfolioMap,
} from '@/domains/connections/types';
import type { Contract, Vendor } from '@/domains/contracts/types';
import type { Decision } from '@/domains/decisions/types';
import type { Demand } from '@/domains/demands/types';
import type { Escalation } from '@/domains/escalations/types';
import type {
  ApplicationHealthRow,
  PortfolioOverview,
  PortfolioTrends,
} from '@/domains/governance/types';
import type { LeaveRecord } from '@/domains/leaves/types';
import type {
  ProcurementNote,
  ProcurementProcess,
  ProcurementSummary,
} from '@/domains/procurement/types';
import type { MasterDataList, MasterDataUsage } from '@/domains/master-data/types';
import type { Person, PersonWorkload } from '@/domains/people/types';
import type { ApplicationProjectLink, Project, ProjectListItem } from '@/domains/projects/types';
import type { Allocation } from '@/domains/resources/types';
import type { Release } from '@/domains/releases/types';
import type { RelatedEntityFilter, Risk } from '@/domains/risks/types';
import type { Runbook } from '@/domains/runbooks/types';
import type { SearchResult } from '@/domains/search/types';
import type { DeletionImpact, EntityId, PagedResult } from '@/domains/shared/types';
import type { Team, TeamListItem } from '@/domains/teams/types';
import type { Technology, TechnologyListItem } from '@/domains/technologies/types';
import type { Repositories } from '../repositories';
import type { HttpClient } from './client';

/** Optional id filters travel as one comma-separated value (empty = "none of them"). */
const idList = (ids: readonly EntityId[] | undefined) =>
  ids === undefined ? undefined : ids.join(',');

const related = (filter: RelatedEntityFilter = {}) => ({
  applicationId: filter.applicationId,
  projectId: filter.projectId,
});

interface SignInOptions {
  accounts: SessionUser[];
  singleSignOnUrl: string | null;
}

/**
 * Standard create / update / remove / deletion impact on a REST collection, e.g. `/api/teams`:
 * `POST /api/teams`, `PUT /api/teams/{id}`, `DELETE /api/teams/{id}`,
 * `GET /api/teams/{id}/deletion-impact`.
 */
function writes<T, I>(http: HttpClient, base: string) {
  return {
    create: (input: I) => http.post<T>(base, input),
    update: (id: EntityId, input: I) => http.put<T>(`${base}/${id}`, input),
    remove: (id: EntityId) => http.delete(`${base}/${id}`),
    getDeletionImpact: (id: EntityId) => http.get<DeletionImpact>(`${base}/${id}/deletion-impact`),
  };
}

/** Every repository backed by the Cerebro API (../backend). Same contracts as the mock. */
export function createHttpRepositories(http: HttpClient): Repositories {
  return {
    auth: {
      getSession: () => http.get<SessionUser | null>('/api/auth/session'),
      listSignInAccounts: async () =>
        (await http.get<SignInOptions>('/api/auth/sign-in-options')).accounts,
      getSingleSignOnUrl: async () =>
        (await http.get<SignInOptions>('/api/auth/sign-in-options')).singleSignOnUrl,
      signIn: (accountId) => http.post<SessionUser>('/api/auth/sign-in', { accountId }),
      signOut: async () => void (await http.post<null>('/api/auth/sign-out')),
    },
    users: {
      list: () => http.get<UserAccount[]>('/api/users'),
      getById: (id) => http.get<UserAccount>(`/api/users/${id}`),
      ...writes<UserAccount, Parameters<Repositories['users']['create']>[0]>(http, '/api/users'),
    },
    roles: {
      list: () => http.get<Role[]>('/api/roles'),
      getById: (id) => http.get<Role>(`/api/roles/${id}`),
      ...writes<Role, Parameters<Repositories['roles']['create']>[0]>(http, '/api/roles'),
    },
    masterData: {
      listAll: () => http.get<MasterDataList[]>('/api/master-data'),
      getUsage: (key) => http.get<MasterDataUsage>(`/api/master-data/${key}/usage`),
      update: (key, items) => http.put<MasterDataList>(`/api/master-data/${key}`, items),
    },
    businessUnits: {
      list: () => http.get<BusinessUnit[]>('/api/business-units'),
      ...writes<BusinessUnit, Parameters<Repositories['businessUnits']['create']>[0]>(
        http,
        '/api/business-units',
      ),
    },
    people: {
      list: () => http.get<Person[]>('/api/people'),
      getById: (id) => http.get<Person>(`/api/people/${id}`),
      getWorkload: (id, today) => http.get<PersonWorkload>(`/api/people/${id}/workload`, { today }),
      ...writes<Person, Parameters<Repositories['people']['create']>[0]>(http, '/api/people'),
    },
    teams: {
      list: () => http.get<Team[]>('/api/teams'),
      listSummaries: () => http.get<TeamListItem[]>('/api/teams/summaries'),
      getById: (id) => http.get<Team>(`/api/teams/${id}`),
      ...writes<Team, Parameters<Repositories['teams']['create']>[0]>(http, '/api/teams'),
    },
    technologies: {
      list: () => http.get<Technology[]>('/api/technologies'),
      listSummaries: () => http.get<TechnologyListItem[]>('/api/technologies/summaries'),
      getById: (id) => http.get<Technology>(`/api/technologies/${id}`),
      ...writes<Technology, Parameters<Repositories['technologies']['create']>[0]>(
        http,
        '/api/technologies',
      ),
    },
    applications: {
      list: ({ sort, ...query }) =>
        http.get<PagedResult<ApplicationListItem>>('/api/applications', {
          ...query,
          sort: sort?.field,
          direction: sort?.direction,
        }),
      getById: (id) => http.get<Application>(`/api/applications/${id}`),
      listRefs: () =>
        http.get<{ id: EntityId; name: string; code: string }[]>('/api/applications/refs'),
      ...writes<Application, Parameters<Repositories['applications']['create']>[0]>(
        http,
        '/api/applications',
      ),
    },
    projects: {
      list: ({ sort, ...query }) =>
        http.get<PagedResult<ProjectListItem>>('/api/projects', {
          ...query,
          sort: sort?.field,
          direction: sort?.direction,
        }),
      getById: (id) => http.get<Project>(`/api/projects/${id}`),
      listRefs: () =>
        http.get<{ id: EntityId; name: string; code: string }[]>('/api/projects/refs'),
      listByApplication: (applicationId) =>
        http.get<ApplicationProjectLink[]>(`/api/applications/${applicationId}/projects`),
      ...writes<Project, Parameters<Repositories['projects']['create']>[0]>(http, '/api/projects'),
    },
    connections: {
      getApplicationDependencies: (id) =>
        http.get<ApplicationDependencies>(`/api/applications/${id}/dependencies`),
      getApplicationIntegrations: (id) =>
        http.get<ApplicationIntegrations>(`/api/applications/${id}/integrations`),
      listDependencies: () => http.get<ApplicationDependency[]>('/api/dependencies'),
      listIntegrations: () => http.get<Integration[]>('/api/integrations'),
      getPortfolioMap: () => http.get<PortfolioMap>('/api/portfolio-map'),
      dependencies: {
        getById: (id) => http.get<ApplicationDependency>(`/api/dependencies/${id}`),
        ...writes<
          ApplicationDependency,
          Parameters<Repositories['connections']['dependencies']['create']>[0]
        >(http, '/api/dependencies'),
      },
      integrations: {
        getById: (id) => http.get<Integration>(`/api/integrations/${id}`),
        ...writes<
          Integration,
          Parameters<Repositories['connections']['integrations']['create']>[0]
        >(http, '/api/integrations'),
      },
    },
    risks: {
      list: (filter) => http.get<Risk[]>('/api/risks', related(filter)),
      getById: (id) => http.get<Risk>(`/api/risks/${id}`),
      ...writes<Risk, Parameters<Repositories['risks']['create']>[0]>(http, '/api/risks'),
    },
    escalations: {
      list: (filter) => http.get<Escalation[]>('/api/escalations', related(filter)),
      getById: (id) => http.get<Escalation>(`/api/escalations/${id}`),
      ...writes<Escalation, Parameters<Repositories['escalations']['create']>[0]>(
        http,
        '/api/escalations',
      ),
    },
    decisions: {
      list: (filter) => http.get<Decision[]>('/api/decisions', related(filter)),
      getById: (id) => http.get<Decision>(`/api/decisions/${id}`),
      ...writes<Decision, Parameters<Repositories['decisions']['create']>[0]>(
        http,
        '/api/decisions',
      ),
    },
    governance: {
      getPortfolioOverview: () => http.get<PortfolioOverview>('/api/governance/overview'),
      getApplicationHealthReport: () =>
        http.get<ApplicationHealthRow[]>('/api/governance/application-health'),
      getTrends: (period, today) =>
        http.get<PortfolioTrends>('/api/governance/trends', { ...period, today }),
    },
    search: {
      search: ({ term, kinds, limit }) =>
        http.get<SearchResult[]>('/api/search', { term, kinds, limit }),
    },
    leaves: {
      list: ({ from, to, personIds }) =>
        http.get<LeaveRecord[]>('/api/leaves', { from, to, personIds: idList(personIds) }),
      getById: (id) => http.get<LeaveRecord>(`/api/leaves/${id}`),
      ...writes<LeaveRecord, Parameters<Repositories['leaves']['create']>[0]>(http, '/api/leaves'),
    },
    allocations: {
      list: ({ from, to, personIds, projectIds }) =>
        http.get<Allocation[]>('/api/allocations', {
          from,
          to,
          personIds: idList(personIds),
          projectIds: idList(projectIds),
        }),
      getById: (id) => http.get<Allocation>(`/api/allocations/${id}`),
      ...writes<Allocation, Parameters<Repositories['allocations']['create']>[0]>(
        http,
        '/api/allocations',
      ),
    },
    runbooks: {
      getByApplication: (applicationId) =>
        http.get<Runbook | null>(`/api/applications/${applicationId}/runbook`),
      ...writes<Runbook, Parameters<Repositories['runbooks']['create']>[0]>(http, '/api/runbooks'),
    },
    attachments: {
      list: (owner) =>
        http.get<Attachment[]>('/api/attachments', { ownerType: owner.type, ownerId: owner.id }),
      async countByOwner(type: AttachmentOwnerType) {
        const counts = await http.get<Record<string, number>>('/api/attachments/counts', {
          ownerType: type,
        });
        return new Map(Object.entries(counts).map(([id, count]) => [Number(id), count]));
      },
      upload({ owner, documentType, description, file, fileName }) {
        const form = new FormData();
        form.append('ownerType', owner.type);
        form.append('ownerId', String(owner.id));
        form.append('documentType', documentType);
        form.append('description', description);
        form.append('fileName', fileName);
        form.append('file', file, fileName);
        return http.postForm<Attachment>('/api/attachments', form);
      },
      update: (id, input) => http.put<Attachment>(`/api/attachments/${id}`, input),
      remove: (id) => http.delete(`/api/attachments/${id}`),
      getDeletionImpact: (id) => http.get<DeletionImpact>(`/api/attachments/${id}/deletion-impact`),
      download: (id) => http.blob(`/api/attachments/${id}/content`),
    },
    demands: {
      list: () => http.get<Demand[]>('/api/demands'),
      getById: (id) => http.get<Demand>(`/api/demands/${id}`),
      create: (input) => http.post<Demand>('/api/demands', input),
      update: (id, input) => http.put<Demand>(`/api/demands/${id}`, input),
      assess: (id, input) => http.post<Demand>(`/api/demands/${id}/assessment`, input),
      withdraw: (id, note) => http.post<Demand>(`/api/demands/${id}/withdrawal`, { note }),
      remove: (id) => http.delete(`/api/demands/${id}`),
      getDeletionImpact: (id) => http.get<DeletionImpact>(`/api/demands/${id}/deletion-impact`),
    },
    contracts: {
      list: (query = {}) =>
        http.get<Contract[]>('/api/contracts', {
          projectId: query.projectId,
          vendorId: query.vendorId,
        }),
      getById: (id) => http.get<Contract>(`/api/contracts/${id}`),
      ...writes<Contract, Parameters<Repositories['contracts']['create']>[0]>(
        http,
        '/api/contracts',
      ),
    },
    procurement: {
      list: () => http.get<ProcurementSummary[]>('/api/procurement'),
      getById: (contractId) => http.get<ProcurementProcess>(`/api/procurement/${contractId}`),
      saveSteps: (contractId, steps) =>
        http.put<ProcurementProcess>(`/api/procurement/${contractId}/steps`, steps),
      addNote: (contractId, input) =>
        http.post<ProcurementNote>(`/api/procurement/${contractId}/notes`, input),
      removeNote: (noteId) => http.delete(`/api/procurement/notes/${noteId}`),
    },
    releases: {
      list: ({ from, to, applicationId, projectId } = {}) =>
        http.get<Release[]>('/api/releases', { from, to, applicationId, projectId }),
      getById: (id) => http.get<Release>(`/api/releases/${id}`),
      ...writes<Release, Parameters<Repositories['releases']['create']>[0]>(http, '/api/releases'),
    },
    vendors: {
      list: () => http.get<Vendor[]>('/api/vendors'),
      ...writes<Vendor, Parameters<Repositories['vendors']['create']>[0]>(http, '/api/vendors'),
    },
  };
}
