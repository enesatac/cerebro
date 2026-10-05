import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useMemo, type ReactNode } from 'react';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { PercentMeter } from '@/components/data-display/PercentMeter';
import { useBusinessUnitsById } from '@/domains/business-units/api/queries';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { useProjectRefs } from '@/domains/projects/api/queries';
import type { IsoDate } from '@/domains/shared/types';
import { formatDate } from '@/lib/dates';
import type { ProcurementSummary } from '../types';
import { currentStep, isLateStep, processState, progress } from '../utils/processState';
import { ProcessStateBadge } from './ProcessStateBadge';
import { PurchaseTitleCell } from './PurchaseTitleCell';

interface ProcurementTableProps {
  purchases: readonly ProcurementSummary[];
  today: IsoDate;
  emptyState: ReactNode;
}

/** Every purchase with where its process stands: current step, progress, next date, state. */
export function ProcurementTable({ purchases, today, emptyState }: ProcurementTableProps) {
  const projects = useProjectRefs();
  const units = useBusinessUnitsById();
  const columns = useMemo<TableColumnDef<ProcurementSummary>[]>(
    () => [
      {
        id: 'title',
        header: 'Satın alma',
        width: 300,
        cell: ({ row }) => <PurchaseTitleCell purchase={row.original} />,
      },
      {
        id: 'project',
        header: 'Proje',
        width: 210,
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <EntityLink to={paths.projects.detail(row.original.projectId)}>
              {projects.data?.get(row.original.projectId)?.name ?? `#${row.original.projectId}`}
            </EntityLink>
            <span className="c-muted c-cell-stack__secondary">
              {row.original.businessUnitId !== null
                ? (units.data?.get(row.original.businessUnitId)?.name ?? '—')
                : 'İş birimi yok'}
            </span>
          </span>
        ),
      },
      {
        id: 'step',
        header: 'Güncel adım',
        width: 210,
        cell: ({ row }) => {
          const step = currentStep(row.original.steps);
          if (!step) return <span className="c-muted">—</span>;
          return (
            <span className="c-cell-stack">
              <MasterLabel list="procurementSteps" code={step.type} />
              <span className="c-muted c-cell-stack__secondary">
                <MasterLabel list="procurementStepStatuses" code={step.status} />
              </span>
            </span>
          );
        },
      },
      {
        id: 'progress',
        header: 'İlerleme',
        width: 150,
        cell: ({ row }) => {
          const { closed, total } = progress(row.original.steps);
          return total === 0 ? (
            <span className="c-muted">—</span>
          ) : (
            <PercentMeter
              value={Math.round((closed / total) * 100)}
              label={`${row.original.code} tamamlanan adımlar (${closed}/${total})`}
            />
          );
        },
      },
      {
        id: 'due',
        header: 'Hedef tarih',
        width: 140,
        cell: ({ row }) => {
          const step = currentStep(row.original.steps);
          if (!step?.plannedEnd) return <span className="c-muted">—</span>;
          return (
            <span className={isLateStep(step, today) ? 'c-text-warning' : undefined}>
              {formatDate(step.plannedEnd)}
            </span>
          );
        },
      },
      {
        id: 'state',
        header: 'Durum',
        width: 170,
        cell: ({ row }) => <ProcessStateBadge state={processState(row.original.steps, today)} />,
      },
    ],
    [projects.data, units.data, today],
  );
  return (
    <Table
      data={[...purchases]}
      columns={columns}
      getRowId={(row) => String(row.contractId)}
      emptyState={emptyState}
    />
  );
}
