import type { IsoDate } from '@/domains/shared/types';
import type { Demand } from '../types';
import { compareBacklog } from './demandScoring';
import { quarterOf, quartersFrom, type Quarter } from './quarters';

export interface RoadmapLane {
  id: string;
  label: string;
  description: string;
  demands: Demand[];
  /** Sum of the effort scores of the demands in the lane (unscored ones count as 0). */
  effort: number;
  quarter: Quarter | null;
}

const effortOf = (demands: readonly Demand[]) =>
  demands.reduce((sum, demand) => sum + (demand.assessment.effort ?? 0), 0);

/**
 * The roadmap board: approved demands waiting for a slot, then one lane per quarter for scheduled
 * demands by their planned start (demands already running sit in the current quarter), then
 * everything planned further out. Each lane is in backlog order.
 */
export function buildRoadmap(
  demands: readonly Demand[],
  today: IsoDate,
  quarterCount: number,
): RoadmapLane[] {
  const quarters = quartersFrom(today, quarterCount);
  const first = quarters[0];
  const last = quarters.at(-1);
  if (!first || !last) return [];
  const scheduled = demands.filter(
    (d) =>
      d.status === 'scheduled' &&
      d.assessment.plannedStart &&
      d.assessment.plannedEnd &&
      d.assessment.plannedEnd >= first.start,
  );
  const lane = (
    id: string,
    label: string,
    description: string,
    rows: Demand[],
    quarter: Quarter | null = null,
  ): RoadmapLane => {
    const sorted = [...rows].sort(compareBacklog);
    return { id, label, description, demands: sorted, effort: effortOf(sorted), quarter };
  };
  const startQuarter = (d: Demand) => {
    const start = d.assessment.plannedStart ?? first.start;
    return start < first.start ? first.id : quarterOf(start).id;
  };
  return [
    lane(
      'unscheduled',
      'Takvim bekleyen',
      'Onaylandı, henüz takvime alınmadı',
      demands.filter((d) => d.status === 'approved'),
    ),
    ...quarters.map((quarter, index) =>
      lane(
        quarter.id,
        quarter.label,
        index === 0 ? 'Bu çeyrek' : `${quarter.start.slice(0, 4)} yılı ${quarter.quarter}. çeyrek`,
        scheduled.filter((d) => startQuarter(d) === quarter.id),
        quarter,
      ),
    ),
    lane(
      'later',
      'Daha sonra',
      `${last.label} sonrasında başlayacaklar`,
      scheduled.filter((d) => (d.assessment.plannedStart ?? '') > last.end),
    ),
  ];
}
