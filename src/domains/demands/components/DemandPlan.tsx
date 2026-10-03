import type { Demand } from '../types';
import { formatDateRange } from '@/lib/dates';
import { formatQuarterRange } from '../utils/quarters';

/** When the demand is planned: quarters on top, exact dates underneath; "Takvimsiz" otherwise. */
export function DemandPlan({ demand }: { demand: Demand }) {
  const { plannedStart, plannedEnd } = demand.assessment;
  if (!plannedStart || !plannedEnd) return <span className="c-muted">Takvimsiz</span>;
  return (
    <span className="c-cell-stack">
      <span>{formatQuarterRange(plannedStart, plannedEnd)}</span>
      <span className="c-muted c-cell-stack__secondary">
        {formatDateRange(plannedStart, plannedEnd)}
      </span>
    </span>
  );
}
