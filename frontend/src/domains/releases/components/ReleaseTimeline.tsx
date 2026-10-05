import { Popover } from '@takeoff-ui/react-spar';
import { useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router';
import { paths } from '@/app/router/paths';
import { ButtonLink } from '@/components/actions/ButtonLink';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useApplicationRefs } from '@/domains/applications/api/queries';
import type {
  CalendarDay,
  CalendarMonth,
  CalendarPeriod,
  CalendarRange,
} from '@/domains/leaves/utils/leaveCalendar';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { useMasterData } from '@/domains/master-data/context';
import { usePeopleById } from '@/domains/people/api/queries';
import { useProjectRefs } from '@/domains/projects/api/queries';
import { formatDateLong, formatDateRange, formatMonthYear, formatWeekdayShort } from '@/lib/dates';
import { keepOpenForDialogs } from '@/lib/outsideInteraction';
import type { Release } from '../types';
import { releaseWindow, type CalendarRow, type RowMode } from '../utils/releaseCalendar';

interface ReleaseTimelineProps {
  rows: readonly CalendarRow[];
  mode: RowMode;
  period: CalendarPeriod;
  range: CalendarRange;
  days: readonly CalendarDay[];
  months: readonly CalendarMonth[];
  canEdit: boolean;
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

function ReleaseChip({
  release,
  range,
  canEdit,
}: {
  release: Release;
  range: CalendarRange;
  canEdit: boolean;
}) {
  const masterData = useMasterData();
  const applications = useApplicationRefs();
  const projects = useProjectRefs();
  const people = usePeopleById();
  const [open, setOpen] = useState(false);
  const { label: status, variant } = masterData.badge('releaseStatuses', release.status);
  const application = applications.data?.get(release.applicationId)?.name ?? '';
  const window = releaseWindow(release);
  // Only the two-week view has room for text; elsewhere colour + the popover (and the list).
  const text = range === '2w' ? release.startTime || release.releaseNumber : null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={`c-leave c-leave--${variant} c-release-chip${
          release.serviceInterruption ? ' c-release-chip--interruption' : ''
        }`}
        aria-label={`${release.releaseNumber} ${release.title}, ${application}, ${formatDateLong(release.plannedDate)} ${window}, ${status}`}
      >
        {text && <span className="c-leave__text">{text}</span>}
      </Popover.Trigger>
      <Popover.Content
        align="start"
        className="c-leave-card"
        onInteractOutside={keepOpenForDialogs}
      >
        <div className="c-leave-card__head">
          <strong>{release.title}</strong>
          <span className="c-muted">
            {release.releaseNumber}
            {release.version && ` · v${release.version}`}
          </span>
        </div>
        <div className="c-leave-card__row">
          <MasterBadge list="releaseStatuses" code={release.status} context="Durum:" />
          <span>
            <MasterLabel list="releaseTypes" code={release.type} />
          </span>
          {release.serviceInterruption && <StatusBadge label="Kesinti var" variant="danger" />}
        </div>
        <p className="c-leave-card__meta">
          {formatDateLong(release.plannedDate)} · {window}
        </p>
        <p className="c-leave-card__meta">
          {application}
          {release.projectId !== null && ` · ${projects.data?.get(release.projectId)?.name ?? ''}`}
          {release.ownerId !== null &&
            ` · Sorumlu: ${people.data?.get(release.ownerId)?.fullName ?? ''}`}
        </p>
        <div className="c-leave-card__actions">
          <ButtonLink
            to={paths.releases.detail(release.id)}
            size="small"
            variant="neutral"
            appearance="outlined"
          >
            Ayrıntılar
          </ButtonLink>
          {canEdit && (
            <ButtonLink
              to={paths.releases.edit(release.id)}
              size="small"
              variant="neutral"
              appearance="outlined"
            >
              Düzenle
            </ButtonLink>
          )}
        </div>
      </Popover.Content>
    </Popover>
  );
}

/**
 * Applications (or projects) down the side, days across the top, each release a mark on its day
 * in its status colour — a table, so screen readers get row and column headers. Editors click a
 * free spot of a row to record a release there.
 */
export function ReleaseTimeline({
  rows,
  mode,
  period,
  range,
  days,
  months,
  canEdit,
}: ReleaseTimelineProps) {
  const navigate = useNavigate();
  const rowLink = (row: CalendarRow) =>
    row.id === null
      ? null
      : mode === 'application'
        ? paths.applications.detail(row.id)
        : paths.projects.detail(row.id);
  return (
    <div
      className={`c-timeline c-timeline--${range}${canEdit ? ' c-timeline--editable' : ''}`}
      role="region"
      aria-label="Canlı geçiş takvimi"
      tabIndex={0}
    >
      <table
        className="c-timeline__table"
        style={{ '--c-timeline-days': days.length } as CSSProperties}
      >
        <caption className="c-visually-hidden">
          {formatDateRange(period.from, period.to)} canlı geçiş takvimi. Satırlar{' '}
          {mode === 'application' ? 'uygulamalar' : 'projeler'}, sütunlar günlerdir.
        </caption>
        <colgroup>
          <col className="c-timeline__col-person" />
          {days.map((day) => (
            <col key={day.date} className="c-timeline__col-day" />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={2} scope="col" className="c-timeline__corner">
              {mode === 'application' ? 'Uygulama' : 'Proje'}
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
          {rows.map((row) => {
            const link = rowLink(row);
            return (
              <tr key={row.key}>
                <th scope="row" className="c-timeline__person">
                  <span className="c-timeline__name">
                    {link ? (
                      <Link to={link} className="c-timeline__link">
                        {row.name}
                      </Link>
                    ) : (
                      row.name
                    )}
                  </span>
                  <span className="c-timeline__title">{row.count} geçiş</span>
                </th>
                {days.map((day) => {
                  const releases = row.byDay.get(day.date) ?? [];
                  const prefill =
                    row.id === null
                      ? { date: day.date }
                      : mode === 'application'
                        ? { application: row.id, date: day.date }
                        : { project: row.id, date: day.date };
                  return (
                    <td
                      key={day.date}
                      className={`${dayClass(day, 'c-timeline__cell')}${
                        releases.length > 0 ? ' c-timeline__cell--leave' : ''
                      }`}
                      // Mouse shortcut for editors; "Geçiş ekle" is the keyboard route.
                      onClick={
                        canEdit
                          ? (event) => {
                              if (event.target === event.currentTarget) {
                                void navigate(paths.releases.create(prefill));
                              }
                            }
                          : undefined
                      }
                      title={
                        canEdit && releases.length === 0
                          ? `${row.name} için ${formatDateLong(day.date)} geçiş ekle`
                          : undefined
                      }
                    >
                      {releases.length > 0 && (
                        <div className="c-release-stack">
                          {releases.map((release) => (
                            <ReleaseChip
                              key={release.id}
                              release={release}
                              range={range}
                              canEdit={canEdit}
                            />
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
