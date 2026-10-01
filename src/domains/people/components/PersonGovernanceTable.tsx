import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import type { MasterDataListKey } from '@/domains/master-data/types';
import { formatDate } from '@/lib/dates';
import type { PersonGovernanceItem } from '../types';

const INVOLVEMENT: Record<PersonGovernanceItem['involvement'][number], string> = {
  owner: 'Sahibi',
  raised: 'Açan',
  decider: 'Karar veren',
};

interface PersonGovernanceTableProps {
  items: readonly PersonGovernanceItem[];
  statusList: MasterDataListKey;
  dateHeader: string;
  emptyTitle: string;
}

/** Risks, escalations or decisions a person is involved in, with the records they concern. */
export function PersonGovernanceTable({
  items,
  statusList,
  dateHeader,
  emptyTitle,
}: PersonGovernanceTableProps) {
  const hasSeverity = items.some((item) => item.severity !== null);
  const columns: TableColumnDef<PersonGovernanceItem>[] = [
    { id: 'title', header: 'Başlık', accessor: 'title', sortable: true, width: 280 },
    {
      id: 'involvement',
      header: 'İlgisi',
      width: 130,
      cell: ({ row }) => row.original.involvement.map((i) => INVOLVEMENT[i]).join(', '),
    },
    ...(hasSeverity
      ? [
          {
            id: 'severity',
            header: 'Önem',
            width: 110,
            cell: ({ row }) =>
              row.original.severity ? (
                <MasterBadge list="criticalities" code={row.original.severity} />
              ) : (
                '—'
              ),
          } satisfies TableColumnDef<PersonGovernanceItem>,
        ]
      : []),
    {
      id: 'status',
      header: 'Durum',
      width: 140,
      cell: ({ row }) => <MasterBadge list={statusList} code={row.original.status} />,
    },
    {
      id: 'date',
      header: dateHeader,
      accessor: (row) => row.date ?? '',
      sortable: true,
      width: 120,
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      id: 'related',
      header: 'İlgili kayıtlar',
      cell: ({ row }) => {
        const { applications, projects } = row.original;
        if (applications.length === 0 && projects.length === 0) {
          return <span className="c-muted">Yok</span>;
        }
        return (
          <ul className="c-plain-list">
            {applications.map((ref) => (
              <li key={`application-${ref.id}`}>
                <EntityLink to={paths.applications.detail(ref.id)}>{ref.name}</EntityLink>
              </li>
            ))}
            {projects.map((ref) => (
              <li key={`project-${ref.id}`}>
                <EntityLink to={paths.projects.detail(ref.id)}>{ref.name}</EntityLink>
              </li>
            ))}
          </ul>
        );
      },
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
