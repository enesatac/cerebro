import { Button, Popover } from '@takeoff-ui/react-spar';
import { EditIconOutlinedRounded } from '@takeoff-icons/react/edit';
import { useState, type CSSProperties } from 'react';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { useMasterData } from '@/domains/master-data/context';
import type { Person } from '@/domains/people/types';
import type { EntityId, IsoDate } from '@/domains/shared/types';
import { formatDateLong, formatDateRange, formatMonthYear, formatWeekdayShort } from '@/lib/dates';
import type { LeaveRecord } from '../types';
import {
  leaveSegments,
  timelineCells,
  workingDays,
  type CalendarDay,
  type CalendarMonth,
  type CalendarPeriod,
  type CalendarRange,
  type LeaveSegment,
} from '../utils/leaveCalendar';
import { LeaveDeleteAction } from './LeaveDeleteAction';

export interface TimelineRow {
  person: Person;
  leaves: LeaveRecord[];
}

interface LeaveTimelineProps {
  rows: readonly TimelineRow[];
  period: CalendarPeriod;
  range: CalendarRange;
  days: readonly CalendarDay[];
  months: readonly CalendarMonth[];
  /** People on leave today (dot next to their name). */
  awayToday: ReadonlySet<EntityId>;
  canEdit: boolean;
  onCreate: (personId: EntityId, date: IsoDate) => void;
  onEdit: (leave: LeaveRecord) => void;
}

const dayClass = (day: CalendarDay, base: string) =>
  [
    base,
    day.weekend && `${base}--weekend`,
    day.today && `${base}--today`,
    day.monthStart && `${base}--month-start`,
  ]
    .filter(Boolean)
    .join(' ');

/**
 * The card's delete confirmation is a dialog portalled outside the popover. Without this guard the
 * popover treats clicks in that dialog as outside clicks and closes, unmounting the confirmation
 * mid-click, so the leave is never deleted and the click falls through to the calendar.
 */
function keepOpenForDialogs(event: PointerEvent | FocusEvent) {
  if (
    event.target instanceof Element &&
    event.target.closest('.tk-dialog-panel, .tk-dialog-overlay')
  ) {
    event.preventDefault();
  }
}

function LeaveBar({
  segment,
  person,
  range,
  canEdit,
  onEdit,
}: {
  segment: LeaveSegment;
  person: Person;
  range: CalendarRange;
  canEdit: boolean;
  onEdit: (leave: LeaveRecord) => void;
}) {
  const masterData = useMasterData();
  const [open, setOpen] = useState(false);
  const { leave } = segment;
  const { label, variant } = masterData.badge('leaveTypes', leave.type);
  const days = workingDays(leave.startDate, leave.endDate);
  const dates = formatDateRange(leave.startDate, leave.endDate);
  // Wide enough bars carry text; narrow ones rely on colour + the popover (and the list view).
  const text =
    range === '2w'
      ? segment.span >= 2
        ? `${label} · ${days} gün`
        : label
      : range === '1m' && segment.span >= 3
        ? label
        : null;
  const classes = [
    'c-leave',
    `c-leave--${variant}`,
    segment.continuesBefore && 'c-leave--from-before',
    segment.continuesAfter && 'c-leave--to-after',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={classes}
        aria-label={`${person.fullName}: ${label}, ${dates}, ${days} iş günü`}
      >
        {text && <span className="c-leave__text">{text}</span>}
      </Popover.Trigger>
      <Popover.Content
        align="start"
        className="c-leave-card"
        onInteractOutside={keepOpenForDialogs}
      >
        <div className="c-leave-card__head">
          <strong>{person.fullName}</strong>
          <span className="c-muted">{person.jobTitle}</span>
        </div>
        <div className="c-leave-card__row">
          <MasterBadge list="leaveTypes" code={leave.type} />
          <span>{dates}</span>
        </div>
        <p className="c-leave-card__meta">
          {days} iş günü
          {leave.note && <> · {leave.note}</>}
        </p>
        {canEdit && (
          <div className="c-leave-card__actions">
            <Button
              size="small"
              variant="neutral"
              appearance="outlined"
              startContent={<EditIconOutlinedRounded aria-hidden="true" />}
              onClick={() => {
                setOpen(false);
                onEdit(leave);
              }}
            >
              Düzenle
            </Button>
            <LeaveDeleteAction record={leave} personName={person.fullName} compact />
          </div>
        )}
      </Popover.Content>
    </Popover>
  );
}

/**
 * People down the side, days across the top, each leave a coloured bar over its days — a table,
 * so screen readers get row and column headers. Administrators click a free day to add a leave.
 */
export function LeaveTimeline({
  rows,
  period,
  range,
  days,
  months,
  awayToday,
  canEdit,
  onCreate,
  onEdit,
}: LeaveTimelineProps) {
  return (
    <div
      className={`c-timeline c-timeline--${range}${canEdit ? ' c-timeline--editable' : ''}`}
      role="region"
      aria-label="İzin takvimi"
      tabIndex={0}
    >
      <table
        className="c-timeline__table"
        style={{ '--c-timeline-days': days.length } as CSSProperties}
      >
        <caption className="c-visually-hidden">
          {formatDateRange(period.from, period.to)} izin takvimi. Satırlar kişiler, sütunlar
          günlerdir.
        </caption>
        {/* Fixed layout takes widths from here, so every day is the same width. */}
        <colgroup>
          <col className="c-timeline__col-person" />
          {days.map((day) => (
            <col key={day.date} className="c-timeline__col-day" />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={2} scope="col" className="c-timeline__corner">
              Kişi
            </th>
            {months.map((month) => (
              <th
                key={month.firstDay}
                colSpan={month.span}
                scope="colgroup"
                className="c-timeline__month"
              >
                <span className="c-timeline__month-label">{formatMonthYear(month.firstDay)}</span>
              </th>
            ))}
          </tr>
          <tr>
            {days.map((day) => (
              <th
                key={day.date}
                scope="col"
                className={dayClass(day, 'c-timeline__day')}
                aria-label={formatDateLong(day.date)}
              >
                <span className="c-timeline__weekday" aria-hidden="true">
                  {formatWeekdayShort(day.date)}
                </span>
                <span className="c-timeline__date" aria-hidden="true">
                  {day.dayOfMonth}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ person, leaves }) => (
            <tr key={person.id}>
              <th scope="row" className="c-timeline__person">
                <span className="c-timeline__name">
                  {person.fullName}
                  {awayToday.has(person.id) && (
                    <span className="c-timeline__away" title="Bugün izinli">
                      <span className="c-visually-hidden"> (bugün izinli)</span>
                    </span>
                  )}
                </span>
                <span className="c-timeline__title">{person.jobTitle}</span>
              </th>
              {timelineCells(leaveSegments(leaves, period), days.length).map((cell) => {
                if (cell.kind === 'leave') {
                  const first = days[cell.segment.start];
                  return (
                    <td
                      key={`leave-${cell.segment.leave.id}`}
                      colSpan={cell.segment.span}
                      className="c-timeline__cell c-timeline__cell--leave"
                      data-first-day={first?.date}
                    >
                      <LeaveBar
                        segment={cell.segment}
                        person={person}
                        range={range}
                        canEdit={canEdit}
                        onEdit={onEdit}
                      />
                    </td>
                  );
                }
                const day = days[cell.index];
                if (!day) return null;
                return (
                  <td
                    key={day.date}
                    className={dayClass(day, 'c-timeline__cell')}
                    // Mouse shortcut for administrators; "İzin ekle" and the list are the
                    // keyboard route to the same form.
                    onClick={canEdit ? () => onCreate(person.id, day.date) : undefined}
                    title={
                      canEdit
                        ? `${person.fullName} için ${formatDateLong(day.date)} izin ekle`
                        : undefined
                    }
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
