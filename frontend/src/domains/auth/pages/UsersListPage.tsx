import { Link } from 'react-router';
import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { sheet } from '@/lib/xlsxTypes';
import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { AddIconOutlinedRounded } from '@takeoff-icons/react/add';
import { paths } from '@/app/router/paths';
import { ButtonLink } from '@/components/actions/ButtonLink';
import { EntityLink } from '@/components/data-display/EntityLink';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { PageHeader } from '@/components/layout/PageHeader';
import { usePeopleById } from '@/domains/people/api/queries';
import { formatRelative } from '@/lib/dates';
import { useCurrentUser, useRoles, useUserAccounts } from '../api/queries';
import type { UserAccount } from '../types';
import { ACCOUNT_STATUS_PRESENTATION } from '../utils/rolePresentation';
import { Can } from '../components/Can';
import { RoleBadges } from '../components/RoleBadges';
import { UserDeleteAction } from '../components/UserDeleteAction';

export default function UsersListPage() {
  const query = useUserAccounts();
  const people = usePeopleById();
  const me = useCurrentUser();
  const roles = useRoles();
  const roleNames = (user: UserAccount) =>
    user.roleIds.map((id) => roles.data?.find((role) => role.id === id)?.name ?? `#${id}`);

  const columns: TableColumnDef<UserAccount>[] = [
    {
      id: 'name',
      header: 'Kullanıcı',
      accessor: 'displayName',
      sortable: true,
      width: 260,
      cell: ({ row }) => (
        <span className="c-cell-stack">
          <EntityLink to={paths.admin.editUser(row.original.id)}>
            {row.original.displayName}
            {row.original.id === me?.id && ' (siz)'}
          </EntityLink>
          <span className="c-muted c-cell-stack__secondary">{row.original.email}</span>
        </span>
      ),
    },
    {
      id: 'roles',
      header: 'Roller',
      width: 280,
      cell: ({ row }) => <RoleBadges names={roleNames(row.original)} />,
    },
    {
      id: 'status',
      header: 'Durum',
      width: 120,
      cell: ({ row }) => (
        <StatusBadge
          {...ACCOUNT_STATUS_PRESENTATION[row.original.active ? 'active' : 'inactive']}
        />
      ),
    },
    {
      id: 'person',
      header: 'Bağlı kişi',
      cell: ({ row }) =>
        row.original.personId ? (
          (people.data?.get(row.original.personId)?.jobTitle ?? row.original.personId)
        ) : (
          <span className="c-muted">Bağlı değil</span>
        ),
    },
    {
      id: 'lastSignIn',
      header: 'Son giriş',
      align: 'end',
      width: 140,
      cell: ({ row }) => formatRelative(row.original.lastSignInAt, new Date(), 'Hiç'),
    },
    {
      id: 'actions',
      header: <span className="c-visually-hidden">İşlemler</span>,
      align: 'end',
      width: 90,
      // Your own account cannot be deleted, so no action is offered for it.
      cell: ({ row }) =>
        row.original.id === me?.id ? null : <UserDeleteAction record={row.original} compact />,
    },
  ];

  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[{ label: 'Yönetim' }, { label: 'Kullanıcılar' }]}
        title="Kullanıcılar"
        subtitle={
          <>
            Cerebro'ya kimlerin giriş yapabileceği ve hangi rollere sahip olduğu. Rollerin hangi
            ekranlarda ne yapabildiği{' '}
            <Link className="c-link" to={paths.admin.roles()}>
              Roller ve yetkiler
            </Link>{' '}
            sayfasında.
          </>
        }
        actions={
          <>
            <ExcelExportButton
              title="Kullanıcılar"
              disabled={!query.data?.length}
              build={() => [
                sheet<UserAccount>({
                  name: 'Kullanıcılar',
                  title: 'Kullanıcılar',
                  rows: [...(query.data ?? [])].sort((a, b) =>
                    a.displayName.localeCompare(b.displayName, 'tr'),
                  ),
                  columns: [
                    { header: 'Ad', value: (u) => u.displayName },
                    { header: 'E-posta', value: (u) => u.email },
                    { header: 'Roller', value: (u) => roleNames(u).join('\n') },
                    {
                      header: 'Bağlı kişi',
                      value: (u) => (u.personId ? people.data?.get(u.personId)?.fullName : null),
                    },
                    { header: 'Durum', value: (u) => (u.active ? 'Aktif' : 'Devre dışı') },
                    { header: 'Son giriş', value: (u) => u.lastSignInAt, type: 'date' },
                  ],
                }),
              ]}
            />
            <Can privilege="users:edit">
              <ButtonLink
                to={paths.admin.createUser()}
                startContent={<AddIconOutlinedRounded aria-hidden="true" />}
              >
                Kullanıcı ekle
              </ButtonLink>
            </Can>
          </>
        }
      />
      <QueryView
        query={query}
        loadingLabel="Kullanıcılar yükleniyor"
        errorTitle="Kullanıcılar yüklenemedi"
      >
        {(users) => (
          <Table
            data={users}
            columns={columns}
            getRowId={(row) => String(row.id)}
            sorting={{ defaultValue: [{ id: 'name', desc: false }] }}
            emptyState={<EmptyState compact title="Henüz kullanıcı hesabı yok" />}
          />
        )}
      </QueryView>
    </div>
  );
}
