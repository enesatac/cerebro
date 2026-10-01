import { Button, Popover } from '@takeoff-ui/react-spar';
import { EditIconOutlinedRounded } from '@takeoff-icons/react/edit';
import { useState, type CSSProperties, type MouseEvent } from 'react';
import { Link } from 'react-router';
import { paths } from '@/app/router/paths';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useMasterData } from '@/domains/master-data/context';
import type { LeaveRecord } from '@/domains/leaves/types';
import type { Person } from '@/domains/people/types';
import type { EntityId, EntityRef, IsoDate } from '@/domains/shared/types';
import { formatDateRange, formatMonthYear } from '@/lib/dates';
import { keepOpenForDialogs } from '@/lib/outsideInteraction';
import type { Allocation } from '../types';
import { describeLoad, LOAD_PRESENTATION } from '../utils/loadPresentation';
import {
  assignLanes,
  dateAt,
  dayOffset,
  loadLevel,
  loadOn,
  loadSegments,
  peakLoad,
  placeInPeriod,
  planScale,
  type PlanPeriod,
  type PlanRange,
} from '../utils/resourcePlan';
import { AllocationDeleteAction } from './AllocationDeleteAction';

/** Pixels per day for each zoom level: every view is roughly one screen wide. */
const DAY_PX: Record<PlanRange, number> = { '1m': 32, '3m': 11, '6m': 6, '12m': 3 };

export interface PlanRow {
  person: Person;
  allocations: Allocation[];
  leaves: LeaveRecord[];
}

interface ResourceTimelineProps {
  rows: readonly PlanRow[];
  period: PlanPeriod;
  range: PlanRange;
  today: IsoDate;
  projects: ReadonlyMap<EntityId, EntityRef & { code: string }>;
  /** Stable colour slot per project (colour follows the project, not its position on screen). */
  colorOf: (projectId: EntityId) => number;
  canEdit: boolean;
  onCreate: (personId: EntityId, date: IsoDate) => void;
  onEdit: (allocation: Allocation) => void;
}

const vars = (values: Record<string, number | string>) => values as CSSProperties;

function AllocationBar({
  allocation,
  person,
  project,
  color,
  period,
  range,
  lane,
  canEdit,
  onEdit,
}: {
  allocation: Allocation;
  person: Person;
  project: (EntityRef & { code: string }) | undefined;
  color: number;
  period: PlanPeriod;
  range: PlanRange;
  lane: number;
  canEdit: boolean;
  onEdit: (allocation: Allocation) => void;
}) {
  const masterData = useMasterData();
  const [open, setOpen] = useState(false);
  const place = placeInPeriod(allocation.startDate, allocation.endDate, period);
  if (!place) return null;
  const projectName = project?.name ?? 'Silinmiş proje';
  const role = masterData.label('stakeholderRoles', allocation.role);
  const dates = formatDateRange(allocation.startDate, allocation.endDate);
  const width = place.span * DAY_PX[range];
  // Wide bars carry the project and share; narrow ones the share only; tiny ones rely on the card.
  const text =
    width >= 110
      ? `${projectName} · %${allocation.percent}`
      : width >= 36
        ? `%${allocation.percent}`
        : null;
  const classes = [
    'c-plan__bar',
    `c-plan__bar--c${color}`,
    place.continuesBefore && 'c-plan__bar--from-before',
    place.continuesAfter && 'c-plan__bar--to-after',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={classes}
        style={vars({ '--o': place.offset, '--s': place.span, '--l': lane })}
        aria-label={`${person.fullName}: ${projectName}, ${role}, %${allocation.percent}, ${dates}`}
      >
        {text && <span className="c-plan__bar-text">{text}</span>}
      </Popover.Trigger>
      <Popover.Content
        align="start"
        className="c-leave-card"
        onInteractOutside={keepOpenForDialogs}
      >
        <div className="c-leave-card__head">
          {project ? (
            <Link className="c-link" to={paths.projects.detail(project.id)}>
              <strong>{projectName}</strong>
            </Link>
          ) : (
            <strong>{projectName}</strong>
          )}
          <span className="c-muted">
            {person.fullName} · {role}
          </span>
        </div>
        <div className="c-leave-card__row">
          <strong>%{allocation.percent}</strong>
          <span>{dates}</span>
        </div>
        {allocation.note && <p className="c-leave-card__meta">{allocation.note}</p>}
        {canEdit && (
          <div className="c-leave-card__actions">
            <Button
              size="small"
              variant="neutral"
              appearance="outlined"
              startContent={<EditIconOutlinedRounded aria-hidden="true" />}
              onClick={() => {
                setOpen(false);
                onEdit(allocation);
              }}
            >
              Düzenle
            </Button>
            <AllocationDeleteAction
              record={allocation}
              description={`${person.fullName} — ${projectName}`}
              compact
            />
          </div>
        )}
      </Popover.Content>
    </Popover>
  );
}

function PersonHeader({
  row,
  period,
  today,
}: {
  row: PlanRow;
  period: PlanPeriod;
  today: IsoDate;
}) {
  const now = loadOn(row.allocations, today);
  const peak = peakLoad(loadSegments(row.allocations, period));
  const nowLevel = LOAD_PRESENTATION[loadLevel(now.percent)];
  const showToday = today >= period.from && today <= period.to;
  return (
    <>
      <Link to={paths.people.detail(row.person.id)} className="c-plan__name">
        {row.person.fullName}
      </Link>
      <span className="c-plan__title">{row.person.jobTitle}</span>
      <span className="c-plan__load">
        {showToday && (
          <StatusBadge
            label={`Bugün: ${describeLoad(now.count, now.percent)}`}
            variant={nowLevel.variant}
          />
        )}
        {peak.percent > 100 && (
          <StatusBadge
            label={`En fazla %${peak.percent} · ${peak.count} paralel`}
            variant="danger"
          />
        )}
      </span>
    </>
  );
}

/**
 * People down the side, time across the top, every allocation a bar in its project's colour.
 * Parallel work stacks into lanes, so a row's height *is* how many things the person does at
 * once; the strip above the lanes is their daily load (green with room, red over 100 %).
 */
export function ResourceTimeline({
  rows,
  period,
  range,
  today,
  projects,
  colorOf,
  canEdit,
  onCreate,
  onEdit,
}: ResourceTimelineProps) {
  const scale = planScale(period, range);
  const todayOffset = dayOffset(period, today);
  const todayVisible = todayOffset >= 0 && todayOffset < scale.total;

  const createAt = (personId: EntityId) => (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const x = event.clientX - event.currentTarget.getBoundingClientRect().left;
    const offset = Math.min(scale.total - 1, Math.max(0, Math.floor(x / DAY_PX[range])));
    onCreate(personId, dateAt(period, offset));
  };

  return (
    <div
      className={`c-plan c-plan--${range}${canEdit ? ' c-plan--editable' : ''}`}
      style={vars({ '--c-plan-day': `${DAY_PX[range]}px`, '--c-plan-days': scale.total })}
      role="region"
      aria-label="Kaynak planı"
      tabIndex={0}
    >
      <table className="c-plan__table">
        <caption className="c-visually-hidden">
          {formatDateRange(period.from, period.to)} kaynak planı. Satırlar kişiler; her çubuk bir
          proje ataması.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="c-plan__corner">
              Kişi
            </th>
            <th scope="col" className="c-plan__scale">
              <span className="c-visually-hidden">Zaman çizelgesi</span>
              <div className="c-plan__months" aria-hidden="true">
                {scale.months.map((month) => (
                  <span
                    key={month.date}
                    className="c-plan__month"
                    style={vars({ '--o': month.offset, '--s': month.span })}
                  >
                    {range === '12m' && month.span < 31
                      ? formatMonthYear(month.date).split(' ')[0]
                      : formatMonthYear(month.date)}
                  </span>
                ))}
              </div>
              <div className="c-plan__ticks" aria-hidden="true">
                {scale.ticks.map((tick) => (
                  <span
                    key={tick.date}
                    className={`c-plan__tick${tick.weekend ? ' c-plan__tick--weekend' : ''}`}
                    style={vars({ '--o': tick.offset })}
                  >
                    {tick.label}
                  </span>
                ))}
                {todayVisible && (
                  <span className="c-plan__today-label" style={vars({ '--o': todayOffset })}>
                    Bugün
                  </span>
                )}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const { lanes, laneCount } = assignLanes(
              row.allocations.filter((a) => placeInPeriod(a.startDate, a.endDate, period)),
            );
            const segments = loadSegments(row.allocations, period);
            return (
              <tr key={row.person.id}>
                <th scope="row" className="c-plan__person">
                  <PersonHeader row={row} period={period} today={today} />
                </th>
                <td className="c-plan__cell">
                  <div
                    className="c-plan__track"
                    style={vars({ '--lanes': Math.max(1, laneCount) })}
                    onClick={canEdit ? createAt(row.person.id) : undefined}
                    title={canEdit ? 'Boş alana tıklayarak atama ekleyin' : undefined}
                  >
                    {scale.months.slice(1).map((month) => (
                      <span
                        key={month.date}
                        className="c-plan__gridline"
                        style={vars({ '--o': month.offset })}
                        aria-hidden="true"
                      />
                    ))}
                    {row.leaves.map((leave) => {
                      const place = placeInPeriod(leave.startDate, leave.endDate, period);
                      return place ? (
                        <span
                          key={`leave-${leave.id}`}
                          className="c-plan__leave"
                          style={vars({ '--o': place.offset, '--s': place.span })}
                          title={`İzin: ${formatDateRange(leave.startDate, leave.endDate)}`}
                          aria-hidden="true"
                        />
                      ) : null;
                    })}
                    {segments
                      .filter((s) => s.count > 0)
                      .map((s) => (
                        <span
                          key={`load-${s.offset}`}
                          className={`c-plan__load-strip c-plan__load-strip--${loadLevel(s.percent)}`}
                          style={vars({ '--o': s.offset, '--s': s.span })}
                          title={`${formatDateRange(dateAt(period, s.offset), dateAt(period, s.offset + s.span - 1))}: ${describeLoad(s.count, s.percent)}`}
                          aria-hidden="true"
                        />
                      ))}
                    {todayVisible && (
                      <span
                        className="c-plan__today"
                        style={vars({ '--o': todayOffset })}
                        aria-hidden="true"
                      />
                    )}
                    {row.allocations.map((allocation) => (
                      <AllocationBar
                        key={allocation.id}
                        allocation={allocation}
                        person={row.person}
                        project={projects.get(allocation.projectId)}
                        color={colorOf(allocation.projectId)}
                        period={period}
                        range={range}
                        lane={lanes.get(allocation.id) ?? 0}
                        canEdit={canEdit}
                        onEdit={onEdit}
                      />
                    ))}
                    {row.allocations.length === 0 && (
                      <span className="c-plan__empty">Bu dönemde ataması yok</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
