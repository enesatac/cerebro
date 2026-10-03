import { Button } from '@takeoff-ui/react-spar';
import { CalendarIconOutlinedRounded } from '@takeoff-icons/react/calendar';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { useBusinessUnitsById } from '@/domains/business-units/api/queries';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { formatDateRange } from '@/lib/dates';
import { formatDecimal } from '@/lib/format';
import type { Demand, DemandStatus } from '../types';
import { priorityScore } from '../utils/demandScoring';
import { quarterOf } from '../utils/quarters';
import type { RoadmapLane } from '../utils/roadmap';

interface DemandRoadmapProps {
  lanes: readonly RoadmapLane[];
  onAssess: (demand: Demand, status?: DemandStatus) => void;
}

function RoadmapCard({
  demand,
  lane,
  onAssess,
}: {
  demand: Demand;
  lane: RoadmapLane;
  onAssess: DemandRoadmapProps['onAssess'];
}) {
  const units = useBusinessUnitsById();
  const { plannedStart, plannedEnd, priority } = demand.assessment;
  const endQuarter = plannedEnd ? quarterOf(plannedEnd) : null;
  const continues = lane.quarter && endQuarter && endQuarter.id !== lane.quarter.id;
  return (
    <li className="c-roadmap-card">
      <div className="c-roadmap-card__badges">
        {priority ? (
          <MasterBadge list="demandPriorities" code={priority} context="Öncelik:" />
        ) : (
          <span className="c-muted">Öncelik yok</span>
        )}
        <span className="c-muted">Puan {formatDecimal(priorityScore(demand.assessment))}</span>
      </div>
      <EntityLink to={paths.demands.detail(demand.id)}>{demand.title}</EntityLink>
      <span className="c-muted c-roadmap-card__meta">
        {demand.code} · {units.data?.get(demand.businessUnitId)?.name}
        {demand.assessment.effort !== null && ` · Efor ${demand.assessment.effort}`}
      </span>
      {plannedStart && plannedEnd && (
        <span className="c-roadmap-card__dates">
          {formatDateRange(plannedStart, plannedEnd)}
          {continues && ` → ${endQuarter.label}`}
        </span>
      )}
      <Button
        size="small"
        variant="neutral"
        appearance="outlined"
        startContent={<CalendarIconOutlinedRounded aria-hidden="true" />}
        aria-label={`${lane.quarter ? 'Planı değiştir' : 'Takvime al'}: ${demand.code} ${demand.title}`}
        onClick={() => onAssess(demand, 'scheduled')}
      >
        {lane.quarter ? 'Planı değiştir' : 'Takvime al'}
      </Button>
    </li>
  );
}

/**
 * Quarter board: what is approved but not yet scheduled, and what starts in each of the coming
 * quarters. The effort total per lane shows how full a quarter already is.
 */
export function DemandRoadmap({ lanes, onAssess }: DemandRoadmapProps) {
  return (
    <div className="c-roadmap" role="region" aria-label="Yol haritası">
      {lanes.map((lane) => (
        <section
          key={lane.id}
          className={`c-roadmap__lane${lane.quarter ? '' : ' c-roadmap__lane--muted'}`}
          aria-labelledby={`lane-${lane.id}`}
        >
          <header className="c-roadmap__header">
            <h3 id={`lane-${lane.id}`} className="c-roadmap__title">
              {lane.label} <span className="c-tab-count">({lane.demands.length})</span>
            </h3>
            <span className="c-muted c-roadmap__description">{lane.description}</span>
            {lane.demands.length > 0 && (
              <span className="c-roadmap__effort">Toplam efor {lane.effort}</span>
            )}
          </header>
          {lane.demands.length === 0 ? (
            <p className="c-muted c-roadmap__empty">Talep yok</p>
          ) : (
            <ul className="c-roadmap__cards">
              {lane.demands.map((demand) => (
                <RoadmapCard key={demand.id} demand={demand} lane={lane} onAssess={onAssess} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
