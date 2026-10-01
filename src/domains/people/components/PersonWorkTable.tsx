import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { useMasterData } from '@/domains/master-data/context';
import type { MasterDataListKey } from '@/domains/master-data/types';
import type { PersonWorkItem } from '../types';

interface PersonWorkTableProps {
  kind: 'application' | 'project';
  items: readonly PersonWorkItem[];
  emptyTitle: string;
}

const COLUMNS: Record<
  PersonWorkTableProps['kind'],
  { label: string; status: MasterDataListKey; statusHeader: string; criticalityHeader: string }
> = {
  application: {
    label: 'Uygulama',
    status: 'applicationLifecycles',
    statusHeader: 'Yaşam döngüsü',
    criticalityHeader: 'Kritiklik',
  },
  project: {
    label: 'Proje',
    status: 'projectStatuses',
    statusHeader: 'Durum',
    criticalityHeader: 'Öncelik',
  },
};

/** Applications or projects a person works on, with how: their own role or their team's. */
export function PersonWorkTable({ kind, items, emptyTitle }: PersonWorkTableProps) {
  const masterData = useMasterData();
  const config = COLUMNS[kind];
  const detail = kind === 'application' ? paths.applications.detail : paths.projects.detail;
  const columns: TableColumnDef<PersonWorkItem>[] = [
    {
      id: 'name',
      header: config.label,
      accessor: 'name',
      sortable: true,
      width: 240,
      cell: ({ row }) => (
        <span className="c-cell-stack">
          <EntityLink to={detail(row.original.id)}>{row.original.name}</EntityLink>
          <span className="c-muted c-cell-stack__secondary">{row.original.code}</span>
        </span>
      ),
    },
    {
      id: 'involvement',
      header: 'Sorumluluğu',
      width: 260,
      cell: ({ row }) => (
        <ul className="c-plain-list">
          {row.original.roles.map((role) => (
            <li key={`role-${role}`}>
              <strong>{masterData.label('stakeholderRoles', role)}</strong>
            </li>
          ))}
          {row.original.viaTeams.map(({ team, responsibility }) => (
            <li key={`team-${team.id}-${responsibility}`} className="c-muted">
              <EntityLink to={paths.teams.detail(team.id)}>{team.name}</EntityLink> ekibiyle ·{' '}
              {masterData.label('teamResponsibilities', responsibility)}
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'status',
      header: config.statusHeader,
      width: 150,
      cell: ({ row }) => <MasterBadge list={config.status} code={row.original.status} />,
    },
    {
      id: 'criticality',
      header: config.criticalityHeader,
      width: 120,
      cell: ({ row }) => <MasterBadge list="criticalities" code={row.original.criticality} />,
    },
  ];
  return (
    <Table
      data={[...items]}
      columns={columns}
      getRowId={(row) => String(row.id)}
      emptyState={<EmptyState compact title={emptyTitle} />}
    />
  );
}
