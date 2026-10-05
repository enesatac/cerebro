import { Button } from '@takeoff-ui/react-spar';
import { ChevronLeftIconOutlinedRounded } from '@takeoff-icons/react/chevron-left';
import { ChevronRightIconOutlinedRounded } from '@takeoff-icons/react/chevron-right';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { StatTile } from '@/components/data-display/StatTile';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { FilterSelect } from '@/components/forms/FilterSelect';
import { SearchField } from '@/components/forms/SearchField';
import { DetailTabs } from '@/components/layout/DetailTabs';
import { FilterSummary } from '@/components/layout/FilterSummary';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { Toolbar } from '@/components/layout/Toolbar';
import { useApplicationOptions, useApplicationRefs } from '@/domains/applications/api/queries';
import { usePrivilege } from '@/domains/auth/api/queries';
import { CreateAction } from '@/domains/auth/components/RecordActions';
import {
  calendarDays,
  calendarMonths,
  CALENDAR_RANGES,
  periodFor,
  shiftAnchor,
  type CalendarPeriod,
  type CalendarRange,
} from '@/domains/leaves/utils/leaveCalendar';
import { useMasterData } from '@/domains/master-data/context';
import { usePeopleById } from '@/domains/people/api/queries';
import { useProjectOptions, useProjectRefs } from '@/domains/projects/api/queries';
import { useTabParam } from '@/hooks/useTabParam';
import { formatDateRange, formatMonthYear, toIsoDate } from '@/lib/dates';
import { includesFolded } from '@/lib/search';
import { parseId } from '@/lib/urlParams';
import { describeFilters } from '@/lib/xlsxTypes';
import { useReleases } from '../api/queries';
import { ReleaseLegend } from '../components/ReleaseLegend';
import { ReleaseTable } from '../components/ReleaseTable';
import { ReleaseTimeline } from '../components/ReleaseTimeline';
import { calendarRows, releaseMetrics, ROW_MODES, type RowMode } from '../utils/releaseCalendar';
import { releaseSheet } from '../utils/releaseExport';
import {
  countReleaseFilters,
  parseReleaseParams,
  serializeReleaseParams,
  type ReleaseViewState,
} from '../utils/releaseParams';

const VIEWS = [
  { id: 'calendar', label: 'Takvim' },
  { id: 'list', label: 'Liste' },
] as const;
const VIEW_IDS = VIEWS.map((view) => view.id);

const RANGE_LABELS: Record<CalendarRange, string> = { '2w': '2 hafta', '1m': 'Ay', '3m': '3 ay' };
const ROW_LABELS: Record<RowMode, string> = { application: 'Uygulamalar', project: 'Projeler' };

function periodTitle(range: CalendarRange, period: CalendarPeriod): string {
  if (range === '1m') return formatMonthYear(period.from);
  if (range === '3m') return `${formatMonthYear(period.from)} – ${formatMonthYear(period.to)}`;
  return formatDateRange(period.from, period.to);
}

/**
 * Production releases of every application and project on one horizontal calendar: what goes
 * live when, in which state, and what was rolled back. Editors record releases from here, from a
 * calendar day or from an application's or project's own tab.
 */
export default function ReleaseCalendarPage() {
  const today = toIsoDate(new Date());
  const [params, setParams] = useSearchParams();
  const [view, selectView] = useTabParam(VIEW_IDS);
  const state = parseReleaseParams(params, today);
  const update = (patch: Partial<ReleaseViewState>) =>
    setParams(
      serializeReleaseParams({ ...state, ...patch }, today, view === 'calendar' ? null : view),
      { replace: true },
    );

  const canEdit = usePrivilege('releases:edit');
  const masterData = useMasterData();
  const applications = useApplicationRefs();
  const projects = useProjectRefs();
  const applicationOptions = useApplicationOptions();
  const projectOptions = useProjectOptions();
  const people = usePeopleById();

  const period = useMemo(() => periodFor(state.range, state.anchor), [state.range, state.anchor]);
  const releases = useReleases(period);
  const days = useMemo(() => calendarDays(period, today), [period, today]);
  const months = useMemo(() => calendarMonths(days), [days]);

  const appName = (id: number) => applications.data?.get(id)?.name ?? `#${id}`;
  const projectName = (id: number) => projects.data?.get(id)?.name ?? `#${id}`;
  const shown = (releases.data ?? []).filter(
    (r) =>
      (state.applicationId === null || r.applicationId === state.applicationId) &&
      (state.projectId === null || r.projectId === state.projectId) &&
      (!state.status || r.status === state.status) &&
      (!state.type || r.type === state.type) &&
      (!state.search ||
        [r.releaseNumber, r.title, r.version, appName(r.applicationId)].some((text) =>
          includesFolded(text, state.search),
        )),
  );
  const rows = calendarRows(
    shown,
    state.rows,
    state.rows === 'application' ? appName : projectName,
  );
  const metrics = releaseMetrics(shown, today);
  const activeFilters = countReleaseFilters(state);
  const resetFilters = () =>
    update({ search: '', applicationId: null, projectId: null, status: null, type: null });

  const panel = () => {
    if (releases.isPending) return <LoadingState label="Canlı geçişler yükleniyor" rows={8} />;
    if (releases.isError) {
      return (
        <ErrorState title="Canlı geçişler yüklenemedi" onRetry={() => void releases.refetch()} />
      );
    }
    const empty = (
      <EmptyState
        title={
          activeFilters > 0 ? 'Bu filtrelere uyan geçiş yok' : 'Bu dönemde planlanmış geçiş yok'
        }
        description={
          activeFilters > 0
            ? 'Bir filtreyi kaldırın veya dönemi değiştirin.'
            : 'Önceki veya sonraki döneme bakın ya da yeni bir geçiş kaydedin.'
        }
        action={
          activeFilters > 0 ? (
            <Button variant="neutral" appearance="outlined" onClick={resetFilters}>
              Filtreleri temizle
            </Button>
          ) : undefined
        }
      />
    );
    if (view === 'list') return <ReleaseTable releases={shown} emptyState={empty} />;
    if (rows.length === 0) return empty;
    return (
      <ReleaseTimeline
        rows={rows}
        mode={state.rows}
        period={period}
        range={state.range}
        days={days}
        months={months}
        canEdit={canEdit}
      />
    );
  };

  return (
    <div className="c-stack">
      <PageHeader
        title="Canlı geçişler"
        subtitle="Uygulama ve projelerin canlıya geçişleri tek takvimde: ne, ne zaman, hangi durumda; kesintili geçişler ve geri alınanlar."
        actions={
          <CreateAction to={paths.releases.create()} label="Geçiş ekle" privilege="releases:edit" />
        }
      />

      <div className="c-stat-grid" role="group" aria-label="Canlı geçiş özeti">
        <StatTile label="Önümüzdeki 7 gün" value={metrics.nextSevenDays} detail="planlı geçiş" />
        <StatTile
          label="Dönemde planlı"
          value={metrics.upcoming}
          detail={
            metrics.withInterruption > 0
              ? `${metrics.withInterruption} tanesi kesintili`
              : 'kesintili geçiş yok'
          }
        />
        <StatTile label="Tamamlanan" value={metrics.completed} detail="dönemde" />
        <StatTile
          label="Geri alınan"
          value={metrics.rolledBack}
          tone={metrics.rolledBack > 0 ? 'warning' : 'default'}
          detail="dönemde"
        />
        <StatTile
          label="Sonucu girilmedi"
          value={metrics.awaitingOutcome}
          tone={metrics.awaitingOutcome > 0 ? 'warning' : 'default'}
          detail="tarihi geçmiş, durumu güncellenmemiş"
        />
      </div>

      <SectionCard
        title={periodTitle(state.range, period)}
        description={`${formatDateRange(period.from, period.to)} · ${shown.length} geçiş`}
        actions={
          <div className="c-period-nav" role="group" aria-label="Dönem">
            <Button
              size="small"
              variant="neutral"
              appearance="outlined"
              startContent={<ChevronLeftIconOutlinedRounded aria-hidden="true" />}
              aria-label="Önceki dönem"
              onClick={() => update({ anchor: shiftAnchor(state.range, state.anchor, -1) })}
            />
            <Button
              size="small"
              variant="neutral"
              appearance="outlined"
              onClick={() => update({ anchor: today })}
              disabled={state.anchor === today}
            >
              Bugün
            </Button>
            <Button
              size="small"
              variant="neutral"
              appearance="outlined"
              startContent={<ChevronRightIconOutlinedRounded aria-hidden="true" />}
              aria-label="Sonraki dönem"
              onClick={() => update({ anchor: shiftAnchor(state.range, state.anchor, 1) })}
            />
            <span className="c-period-nav__divider" aria-hidden="true" />
            <div className="c-segmented" role="group" aria-label="Görünen aralık">
              {CALENDAR_RANGES.map((range) => (
                <Button
                  key={range}
                  size="small"
                  variant={state.range === range ? 'primary' : 'neutral'}
                  appearance={state.range === range ? 'filled' : 'outlined'}
                  aria-pressed={state.range === range}
                  onClick={() => update({ range })}
                >
                  {RANGE_LABELS[range]}
                </Button>
              ))}
            </div>
            <span className="c-period-nav__divider" aria-hidden="true" />
            <div className="c-segmented" role="group" aria-label="Satırlar">
              {ROW_MODES.map((mode) => (
                <Button
                  key={mode}
                  size="small"
                  variant={state.rows === mode ? 'primary' : 'neutral'}
                  appearance={state.rows === mode ? 'filled' : 'outlined'}
                  aria-pressed={state.rows === mode}
                  onClick={() => update({ rows: mode })}
                >
                  {ROW_LABELS[mode]}
                </Button>
              ))}
            </div>
          </div>
        }
      >
        <div className="c-stack c-stack--s">
          <Toolbar
            label="Geçişleri filtrele"
            end={
              <>
                <FilterSummary
                  summary={`${shown.length} geçiş`}
                  activeFilterCount={activeFilters}
                  onReset={resetFilters}
                />
                <ExcelExportButton
                  title={`Canlı geçişler — ${periodTitle(state.range, period)}`}
                  disabled={shown.length === 0}
                  build={() => [
                    releaseSheet(
                      shown,
                      masterData,
                      {
                        application: appName,
                        project: (id) => (id === null ? undefined : projectName(id)),
                        person: (id) => (id === null ? undefined : people.data?.get(id)?.fullName),
                      },
                      {
                        title: `Canlı geçişler — ${periodTitle(state.range, period)}`,
                        subtitle: describeFilters([
                          ['Dönem', formatDateRange(period.from, period.to)],
                          ['Arama', state.search],
                          [
                            'Uygulama',
                            state.applicationId !== null ? appName(state.applicationId) : null,
                          ],
                          ['Proje', state.projectId !== null ? projectName(state.projectId) : null],
                          [
                            'Durum',
                            state.status && masterData.label('releaseStatuses', state.status),
                          ],
                          ['Tür', state.type && masterData.label('releaseTypes', state.type)],
                        ]),
                      },
                    ),
                  ]}
                />
              </>
            }
          >
            <SearchField
              label="Geçiş ara"
              placeholder="Geçiş no, başlık, sürüm veya uygulama"
              value={state.search}
              onCommit={(search) => update({ search })}
            />
            <FilterSelect
              label="Uygulama"
              allLabel="Tüm uygulamalar"
              value={state.applicationId}
              options={applicationOptions}
              onChange={(value) => update({ applicationId: parseId(value) })}
            />
            <FilterSelect
              label="Proje"
              allLabel="Tüm projeler"
              value={state.projectId}
              options={projectOptions}
              onChange={(value) => update({ projectId: parseId(value) })}
            />
            <FilterSelect
              label="Durum"
              allLabel="Tüm durumlar"
              value={state.status}
              options={masterData.options('releaseStatuses', state.status)}
              onChange={(status) => update({ status })}
            />
            <FilterSelect
              label="Tür"
              allLabel="Tüm türler"
              value={state.type}
              options={masterData.options('releaseTypes', state.type)}
              onChange={(type) => update({ type })}
            />
          </Toolbar>
          <ReleaseLegend />
          <DetailTabs
            label="Canlı geçiş görünümleri"
            tabs={VIEWS.map((tab) => ({ ...tab, count: tab.id === 'list' ? shown.length : null }))}
            active={view}
            onSelect={selectView}
            renderPanel={panel}
          />
        </div>
      </SectionCard>
    </div>
  );
}
