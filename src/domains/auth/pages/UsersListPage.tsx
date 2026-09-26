import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { AddIconOutlinedRounded } from '@takeoff-icons/react/add';
import { paths } from '@/app/router/paths';
import { ButtonLink } from '@/components/actions/ButtonLink';
import { EntityLink } from '@/components/data-display/EntityLink';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { usePeopleById } from '@/domains/people/api/queries';
import { formatRelative } from '@/lib/dates';
import { useCurrentUser, useUserAccounts } from '../api/queries';
import { USER_ROLES, type UserAccount } from '../types';
import { ACCOUNT_STATUS_PRESENTATION, ROLE_PRESENTATION } from '../utils/rolePresentation';

export default function UsersListPage() {
  const query = useUserAccounts();
  const people = usePeopleById();
  const me = useCurrentUser();

  const columns: TableColumnDef<UserAccount>[] = [
    {
      id: 'name',
      header: 'User',
      accessor: 'displayName',
      sortable: true,
      width: 260,
      cell: ({ row }) => (
        <span className="c-cell-stack">
          <EntityLink to={paths.admin.editUser(row.original.id)}>
            {row.original.displayName}
            {row.original.id === me?.id && ' (you)'}
          </EntityLink>
          <span className="c-muted c-cell-stack__secondary">{row.original.email}</span>
        </span>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      accessor: 'role',
      sortable: true,
      width: 110,
      cell: ({ row }) => <StatusBadge {...ROLE_PRESENTATION[row.original.role]} />,
    },
    {
      id: 'status',
      header: 'Status',
      width: 120,
      cell: ({ row }) => (
        <StatusBadge
          {...ACCOUNT_STATUS_PRESENTATION[row.original.active ? 'active' : 'inactive']}
        />
      ),
    },
    {
      id: 'person',
      header: 'Linked person',
      cell: ({ row }) =>
        row.original.personId ? (
          (people.data?.get(row.original.personId)?.jobTitle ?? row.original.personId)
        ) : (
          <span className="c-muted">Not linked</span>
        ),
    },
    {
      id: 'lastSignIn',
      header: 'Last sign-in',
      align: 'end',
      width: 140,
      cell: ({ row }) => formatRelative(row.original.lastSignInAt, new Date(), 'Never'),
    },
  ];

  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[{ label: 'Administration' }, { label: 'Users & roles' }]}
        title="Users & roles"
        subtitle="Who can sign in to Cerebro and what they may do."
        actions={
          <ButtonLink
            to={paths.admin.createUser()}
            startContent={<AddIconOutlinedRounded aria-hidden="true" />}
          >
            Add user
          </ButtonLink>
        }
      />
      <SectionCard title="Roles">
        <dl className="c-role-legend">
          {USER_ROLES.map((role) => (
            <div key={role} className="c-role-legend__item">
              <dt>
                <StatusBadge {...ROLE_PRESENTATION[role]} />
              </dt>
              <dd>{ROLE_PRESENTATION[role].description}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>
      <QueryView query={query} loadingLabel="Loading users" errorTitle="Users could not be loaded">
        {(users) => (
          <Table
            data={users}
            columns={columns}
            getRowId={(row) => row.id}
            sorting={{ defaultValue: [{ id: 'name', desc: false }] }}
            emptyState={<EmptyState compact title="No user accounts exist yet" />}
          />
        )}
      </QueryView>
    </div>
  );
}
