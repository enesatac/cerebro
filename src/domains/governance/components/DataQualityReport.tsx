import { Button, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { ArrowDownloadIconOutlinedRounded } from '@takeoff-icons/react/arrow-download';
import { useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { StatTile } from '@/components/data-display/StatTile';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FilterSelect } from '@/components/forms/FilterSelect';
import { FilterSummary } from '@/components/layout/FilterSummary';
import { Toolbar } from '@/components/layout/Toolbar';
import { PercentMeter } from '@/components/data-display/PercentMeter';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { downloadCsv, toCsv } from '@/lib/csv';
import { toIsoDate } from '@/lib/dates';
import { pluralize } from '@/lib/format';
import { oneOf } from '@/lib/urlParams';
import type { ApplicationHealthRow } from '../types';
import { reviewStateLabel, reviewStatePresentation } from '../utils/reviewPresentation';

/** Scores below this are flagged; tuned so one missing required rule falls under it. */
export const COMPLETENESS_TARGET = 90;

const GAP_FILTERS = ['incomplete', 'no-owner', 'review-overdue'] as const;
type GapFilter = (typeof GAP_FILTERS)[number];
const GAP_LABELS: Record<GapFilter, string> = {
  incomplete: `Below ${COMPLETENESS_TARGET}% complete`,
  'no-owner': 'No technical owner',
  'review-overdue': 'Review overdue',
};

const matchesGap = (row: ApplicationHealthRow, gap: GapFilter | null) =>
  gap === null ||
  (gap === 'incomplete' && row.completenessScore < COMPLETENESS_TARGET) ||
  (gap === 'no-owner' && row.technicalOwner === null) ||
  (gap === 'review-overdue' && row.reviewState.kind !== 'current');

const columns: TableColumnDef<ApplicationHealthRow>[] = [
  {
    id: 'name',
    header: 'Application',
    accessor: 'name',
    sortable: true,
    width: 230,
    cell: ({ row }) => (
      <span className="c-cell-stack">
        <EntityLink to={paths.applications.detail(row.original.id)}>{row.original.name}</EntityLink>
        <span className="c-muted c-cell-stack__secondary">{row.original.code}</span>
      </span>
    ),
  },
  {
    id: 'criticality',
    header: 'Criticality',
    width: 110,
    cell: ({ row }) => <StatusBadge {...CRITICALITY_PRESENTATION[row.original.criticality]} />,
  },
  {
    id: 'completeness',
    header: 'Completeness',
    accessor: 'completenessScore',
    sortable: true,
    width: 150,
    cell: ({ row }) => (
      <PercentMeter
        value={row.original.completenessScore}
        label={`${row.original.name} completeness`}
      />
    ),
  },
  {
    id: 'missing',
    header: 'Missing',
    cell: ({ row }) => (
      <span className="c-cell-stack">
        {row.original.missingRequired.length > 0 && (
          <span className="c-text-warning">{row.original.missingRequired.join(', ')}</span>
        )}
        {row.original.missingRecommended.length > 0 && (
          <span className="c-muted c-cell-stack__secondary">
            {row.original.missingRecommended.join(', ')}
          </span>
        )}
        {row.original.missingRequired.length + row.original.missingRecommended.length === 0 && (
          <span className="c-muted">Nothing</span>
        )}
      </span>
    ),
  },
  {
    id: 'owner',
    header: 'Technical owner',
    width: 150,
    cell: ({ row }) =>
      row.original.technicalOwner?.name ?? <span className="c-text-warning">Unassigned</span>,
  },
  {
    id: 'review',
    header: 'Review',
    width: 150,
    cell: ({ row }) => <StatusBadge {...reviewStatePresentation(row.original.reviewState)} />,
  },
];

function exportCsv(rows: readonly ApplicationHealthRow[]) {
  const csv = toCsv(rows, [
    { header: 'Code', value: (r) => r.code },
    { header: 'Application', value: (r) => r.name },
    { header: 'Lifecycle', value: (r) => r.lifecycle },
    { header: 'Criticality', value: (r) => r.criticality },
    { header: 'Business unit', value: (r) => r.businessUnit?.name },
    { header: 'Technical owner', value: (r) => r.technicalOwner?.name },
    { header: 'Completeness %', value: (r) => r.completenessScore },
    { header: 'Missing (required)', value: (r) => r.missingRequired.join('; ') },
    { header: 'Missing (recommended)', value: (r) => r.missingRecommended.join('; ') },
    { header: 'Review', value: (r) => reviewStateLabel(r.reviewState) },
    {
      header: 'Outdated technologies',
      value: (r) => r.outdatedTechnologies.map((t) => t.name).join('; '),
    },
  ]);
  downloadCsv(`cerebro-data-quality-${toIsoDate(new Date())}.csv`, csv);
}

export function DataQualityReport({ rows }: { rows: ApplicationHealthRow[] }) {
  const [params, setParams] = useSearchParams();
  const gap = oneOf(GAP_FILTERS, params.get('gap'));
  const setGap = (value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set('gap', value);
    else next.delete('gap');
    setParams(next, { replace: true });
  };

  const live = rows.filter((row) => row.lifecycle !== 'retired');
  const average = live.length
    ? Math.round(live.reduce((sum, r) => sum + r.completenessScore, 0) / live.length)
    : 100;
  const visible = rows.filter((row) => matchesGap(row, gap));

  return (
    <div className="c-stack">
      <div className="c-stat-grid">
        <StatTile
          label="Average completeness"
          value={`${average}%`}
          detail={`across ${pluralize(live.length, 'live application')}`}
        />
        <StatTile
          label={`Below ${COMPLETENESS_TARGET}%`}
          value={live.filter((r) => r.completenessScore < COMPLETENESS_TARGET).length}
          tone="warning"
          detail="applications to complete"
        />
        <StatTile
          label="No technical owner"
          value={live.filter((r) => r.technicalOwner === null).length}
          tone="warning"
        />
        <StatTile
          label="Review overdue"
          value={live.filter((r) => r.reviewState.kind !== 'current').length}
          tone="warning"
        />
      </div>
      <Toolbar
        label="Filter report"
        end={
          <>
            <FilterSummary
              summary={pluralize(visible.length, 'application')}
              activeFilterCount={gap ? 1 : 0}
              onReset={() => setGap(null)}
            />
            <Button
              size="small"
              variant="neutral"
              appearance="outlined"
              startContent={<ArrowDownloadIconOutlinedRounded aria-hidden="true" />}
              onClick={() => exportCsv(visible)}
            >
              Export CSV
            </Button>
          </>
        }
      >
        <FilterSelect
          label="Show"
          allLabel="All applications"
          value={gap}
          options={GAP_FILTERS.map((value) => ({ value, label: GAP_LABELS[value] }))}
          onChange={setGap}
        />
      </Toolbar>
      <Table
        data={visible}
        columns={columns}
        getRowId={(row) => row.id}
        sorting={{ defaultValue: [{ id: 'completeness', desc: false }] }}
        pagination={{ pageSize: 25, pageSizeOptions: [25, 50, 100] }}
        emptyState={
          <EmptyState
            compact
            title="No applications have this gap"
            description="Nothing to fix here."
          />
        }
      />
    </div>
  );
}
