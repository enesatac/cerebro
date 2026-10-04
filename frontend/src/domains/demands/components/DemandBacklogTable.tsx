import { Button, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useMemo, type ReactNode } from 'react';
import { useBusinessUnitsById } from '@/domains/business-units/api/queries';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { usePeopleById } from '@/domains/people/api/queries';
import { daysSince, formatDate } from '@/lib/dates';
import { formatDecimal } from '@/lib/format';
import type { Demand, DemandStatus } from '../types';
import { priorityScore } from '../utils/demandScoring';
import { DemandPlan } from './DemandPlan';
import { DemandTitleCell } from './DemandTitleCell';

export type BacklogMode = 'inbox' | 'backlog' | 'closed';

const COLUMNS: Record<BacklogMode, readonly string[]> = {
  inbox: ['title', 'unit', 'waiting', 'urgency', 'score', 'status', 'actions'],
  backlog: ['rank', 'title', 'unit', 'score', 'priority', 'status', 'plan', 'actions'],
  closed: ['title', 'unit', 'submitted', 'status', 'decision', 'actions'],
};

interface DemandBacklogTableProps {
  demands: readonly Demand[];
  mode: BacklogMode;
  /** Opens the assessment, optionally with a status preselected. */
  onAssess: (demand: Demand, status?: DemandStatus) => void;
  emptyState: ReactNode;
}

/**
 * The portfolio office's working list. `inbox`: what waits for a decision, oldest first;
 * `backlog`: open demands in priority order, numbered; `closed`: decided and withdrawn demands.
 */
export function DemandBacklogTable({
  demands,
  mode,
  onAssess,
  emptyState,
}: DemandBacklogTableProps) {
  const people = usePeopleById();
  const units = useBusinessUnitsById();

  // Stable renderers keep row dialogs (delete confirmation) open across data refreshes.
  const columns = useMemo<TableColumnDef<Demand>[]>(() => {
    const all: TableColumnDef<Demand>[] = [
      {
        id: 'rank',
        header: '#',
        width: 56,
        align: 'end',
        cell: ({ row }) => <span className="c-rank">{row.index + 1}</span>,
      },
      {
        id: 'title',
        header: 'Talep',
        width: 320,
        cell: ({ row }) => <DemandTitleCell demand={row.original} />,
      },
      {
        id: 'unit',
        header: 'İş birimi',
        width: 200,
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <span>{units.data?.get(row.original.businessUnitId)?.name ?? '—'}</span>
            <span className="c-muted c-cell-stack__secondary">
              {people.data?.get(row.original.requesterId)?.fullName}
            </span>
          </span>
        ),
      },
      {
        id: 'waiting',
        header: 'Bekleme',
        width: 130,
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <span>{daysSince(row.original.submittedAt)} gün</span>
            <span className="c-muted c-cell-stack__secondary">
              {formatDate(row.original.submittedAt)}
            </span>
          </span>
        ),
      },
      {
        id: 'submitted',
        header: 'Gönderim',
        width: 120,
        cell: ({ row }) => formatDate(row.original.submittedAt),
      },
      {
        id: 'urgency',
        header: 'Aciliyet',
        width: 120,
        cell: ({ row }) => (
          <MasterBadge list="criticalities" code={row.original.urgency} context="Aciliyet:" />
        ),
      },
      {
        id: 'score',
        header: 'Puan',
        width: 90,
        align: 'end',
        cell: ({ row }) => {
          const score = priorityScore(row.original.assessment);
          return score === null ? (
            <span className="c-muted">Puanlanmadı</span>
          ) : (
            <strong>{formatDecimal(score)}</strong>
          );
        },
      },
      {
        id: 'priority',
        header: 'Öncelik',
        width: 140,
        cell: ({ row }) =>
          row.original.assessment.priority ? (
            <MasterBadge
              list="demandPriorities"
              code={row.original.assessment.priority}
              context="Öncelik:"
            />
          ) : (
            <span className="c-muted">Belirlenmedi</span>
          ),
      },
      {
        id: 'status',
        header: 'Durum',
        width: 160,
        cell: ({ row }) => (
          <MasterBadge list="demandStatuses" code={row.original.status} context="Durum:" />
        ),
      },
      {
        id: 'plan',
        header: 'Plan',
        width: 170,
        cell: ({ row }) => <DemandPlan demand={row.original} />,
      },
      {
        id: 'decision',
        header: 'Karar notu',
        width: 300,
        cell: ({ row }) => row.original.assessment.decisionNote || '—',
      },
      {
        id: 'actions',
        header: <span className="c-visually-hidden">İşlemler</span>,
        align: 'end',
        width: 130,
        cell: ({ row }) => (
          <Button
            size="small"
            variant={mode === 'inbox' ? 'primary' : 'neutral'}
            appearance={mode === 'inbox' ? 'filled' : 'outlined'}
            aria-label={`Değerlendir: ${row.original.code} ${row.original.title}`}
            onClick={() => onAssess(row.original)}
          >
            Değerlendir
          </Button>
        ),
      },
    ];
    return COLUMNS[mode].flatMap((id) => all.filter((column) => column.id === id));
    // `onAssess` only opens page state; leaving it out keeps the renderers stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, people.data, units.data]);

  return (
    <Table
      data={[...demands]}
      columns={columns}
      getRowId={(row) => String(row.id)}
      emptyState={emptyState}
    />
  );
}
