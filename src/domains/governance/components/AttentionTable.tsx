import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { EntityLink } from '@/components/data-display/EntityLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { formatDate } from '@/lib/dates';
import type { AttentionItem } from '../types';
import {
  ATTENTION_KIND_LABELS,
  ATTENTION_SUBJECT_LABELS,
  attentionHref,
} from '../utils/attentionPresentation';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';

/** "Application · Ownership gap"; risks and escalations are already named by their kind. */
function subtitle(item: AttentionItem): string {
  const subject = ATTENTION_SUBJECT_LABELS[item.subject.kind];
  return item.subject.kind === 'risk' || item.subject.kind === 'escalation'
    ? subject
    : `${subject} · ${ATTENTION_KIND_LABELS[item.kind]}`;
}

const columns: TableColumnDef<AttentionItem>[] = [
  {
    id: 'severity',
    header: 'Önem derecesi',
    width: 105,
    cell: ({ row }) => <MasterBadge list="criticalities" code={row.original.severity} />,
  },
  {
    id: 'subject',
    header: 'Kayıt',
    width: 300,
    cell: ({ row }) => (
      <span className="c-cell-stack">
        <EntityLink to={attentionHref(row.original)}>{row.original.subject.name}</EntityLink>
        <span className="c-muted c-cell-stack__secondary">{subtitle(row.original)}</span>
      </span>
    ),
  },
  { id: 'reason', header: 'Neden', accessor: 'reason' },
  {
    id: 'date',
    header: 'Tarih',
    align: 'end',
    width: 120,
    cell: ({ row }) => formatDate(row.original.date, ''),
  },
];

export function AttentionTable({ items }: { items: AttentionItem[] }) {
  return (
    <Table
      data={items}
      columns={columns}
      getRowId={(row) => row.id}
      pagination={{ pageSize: 10, pageSizeOptions: [10, 25, 50] }}
      emptyState={
        <EmptyState
          compact
          title="Şu anda ilgilenilmesi gereken bir şey yok"
          description="Sahipler atanmış, gözden geçirmeler güncel ve açık ciddi bir sorun yok."
        />
      }
    />
  );
}
