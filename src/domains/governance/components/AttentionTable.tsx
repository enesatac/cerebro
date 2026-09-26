import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { EntityLink } from '@/components/data-display/EntityLink';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { formatDate } from '@/lib/dates';
import type { AttentionItem } from '../types';
import {
  ATTENTION_KIND_LABELS,
  ATTENTION_SUBJECT_LABELS,
  attentionHref,
} from '../utils/attentionPresentation';

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
    header: 'Severity',
    width: 105,
    cell: ({ row }) => <StatusBadge {...CRITICALITY_PRESENTATION[row.original.severity]} />,
  },
  {
    id: 'subject',
    header: 'Item',
    width: 300,
    cell: ({ row }) => (
      <span className="c-cell-stack">
        <EntityLink to={attentionHref(row.original)}>{row.original.subject.name}</EntityLink>
        <span className="c-muted c-cell-stack__secondary">{subtitle(row.original)}</span>
      </span>
    ),
  },
  { id: 'reason', header: 'Why', accessor: 'reason' },
  {
    id: 'date',
    header: 'Date',
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
          title="Nothing needs attention right now"
          description="Owners are assigned, reviews are current and no severe issue is open."
        />
      }
    />
  );
}
