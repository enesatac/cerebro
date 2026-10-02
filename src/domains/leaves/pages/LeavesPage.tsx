import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import type { Person } from '@/domains/people/types';
import { describeFilters, sheet } from '@/lib/xlsxTypes';
import { foldForSearch } from '@/lib/search';
import { Button, Field, Switch } from '@takeoff-ui/react-spar';
import { AddIconOutlinedRounded } from '@takeoff-icons/react/add';
import { ChevronLeftIconOutlinedRounded } from '@takeoff-icons/react/chevron-left';
import { ChevronRightIconOutlinedRounded } from '@takeoff-icons/react/chevron-right';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
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
import { usePermission } from '@/domains/auth/api/queries';
import { useBusinessUnits } from '@/domains/business-units/api/queries';
import { useMasterData } from '@/domains/master-data/context';
import { usePeopleById } from '@/domains/people/api/queries';
import type { EntityId, IsoDate } from '@/domains/shared/types';
import { useTeams } from '@/domains/teams/api/queries';
import { useTabParam } from '@/hooks/useTabParam';
import { formatDateRange, formatMonthYear, toIsoDate } from '@/lib/dates';
import { parseId } from '@/lib/urlParams';
import { useLeaves } from '../api/queries';
import { LeaveDialog } from '../components/LeaveDialog';
import { LeaveLegend } from '../components/LeaveLegend';
import { LeaveList } from '../components/LeaveList';
import { LeaveTimeline, type TimelineRow } from '../components/LeaveTimeline';
import type { LeaveRecord } from '../types';
import {
  calendarDays,
  calendarMonths,
  CALENDAR_RANGES,
  overlaps,
  peopleOnLeave,
  periodFor,
  shiftAnchor,
  workingDays,
  type CalendarPeriod,
  weekOf,
  type CalendarRange,
} from '../utils/leaveCalendar';
import {
  countLeaveFilters,
  parseLeaveParams,
  serializeLeaveParams,
  type LeaveViewState,
} from '../utils/leaveParams';

const VIEWS = [
  { id: 'calendar', label: 'Takvim' },
  { id: 'list', label: 'Liste' },
] as const;
const VIEW_IDS = VIEWS.map((view) => view.id);

const RANGE_LABELS: Record<CalendarRange, string> = { '2w': '2 hafta', '1m': 'Ay', '3m': '3 ay' };

const normalise = foldForSearch;

function periodTitle(range: CalendarRange, period: CalendarPeriod): string {
  if (range === '1m') return formatMonthYear(period.from);
  if (range === '3m') return `${formatMonthYear(period.from)} – ${formatMonthYear(period.to)}`;
  return formatDateRange(period.from, period.to);
}

type Editing = { leave: LeaveRecord | null; prefill?: { personId?: EntityId; date?: IsoDate } };

/**
 * Leave management: who is away when. People run down the page, days across the top, and each
 * leave is a bar in its type's colour. Administrators add and edit leaves; everyone can read.
 */
export default function LeavesPage() {
  const today = toIsoDate(new Date());
  const [params, setParams] = useSearchParams();
  const [view, selectView] = useTabParam(VIEW_IDS);
  const state = parseLeaveParams(params, today);
  const update = (patch: Partial<LeaveViewState>) =>
    setParams(
      serializeLeaveParams({ ...state, ...patch }, today, view === 'calendar' ? null : view),
      {
        replace: true,
      },
    );

  const canEdit = usePermission('leaves:manage');
  const masterData = useMasterData();
  const people = usePeopleById();
  const teams = useTeams();
  const businessUnits = useBusinessUnits();
  const [editing, setEditing] = useState<Editing | null>(null);

  const period = useMemo(() => periodFor(state.range, state.anchor), [state.range, state.anchor]);
  const leaves = useLeaves(period);
  const currentWeekLeaves = useLeaves(weekOf(today));

  const days = useMemo(() => calendarDays(period, today), [period, today]);
  const months = useMemo(() => calendarMonths(days), [days]);

  const rows = useMemo<TimelineRow[]>(() => {
    if (!people.data) return [];
    const team = state.teamId !== null ? teams.data?.find((t) => t.id === state.teamId) : undefined;
    const term = normalise(state.search);
    const byPerson = new Map<EntityId, LeaveRecord[]>();
    for (const leave of leaves.data ?? []) {
      if (state.type && leave.type !== state.type) continue;
      byPerson.set(leave.personId, [...(byPerson.get(leave.personId) ?? []), leave]);
    }
    return [...people.data.values()]
      .filter(
        (person) =>
          (!term ||
            normalise(person.fullName).includes(term) ||
            normalise(person.jobTitle).includes(term)) &&
          (state.businessUnitId === null || person.businessUnitId === state.businessUnitId) &&
          (!team || team.memberIds.includes(person.id) || team.managerId === person.id) &&
          (!state.awayOnly || byPerson.has(person.id)),
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'))
      .map((person) => ({ person, leaves: byPerson.get(person.id) ?? [] }));
  }, [
    people.data,
    teams.data,
    leaves.data,
    state.search,
    state.businessUnitId,
    state.teamId,
    state.type,
    state.awayOnly,
  ]);

  const awayToday = peopleOnLeave(currentWeekLeaves.data ?? [], today);
  const awayThisWeek = new Set((currentWeekLeaves.data ?? []).map((leave) => leave.personId));
  const usedDays = rows.reduce(
    (sum, row) =>
      sum +
      row.leaves
        .filter((leave) => overlaps({ from: leave.startDate, to: leave.endDate }, period))
        .reduce((total, leave) => {
          const from = leave.startDate < period.from ? period.from : leave.startDate;
          const to = leave.endDate > period.to ? period.to : leave.endDate;
          return total + workingDays(from, to);
        }, 0),
    0,
  );
  const peopleWithLeave = rows.filter((row) => row.leaves.length > 0).length;
  const activeFilters = countLeaveFilters(state);

  const loading = people.isPending || leaves.isPending;
  const failed = people.isError || leaves.isError;

  const panel = () => {
    if (loading) return <LoadingState label="İzin takvimi yükleniyor" rows={8} />;
    if (failed) {
      return (
        <ErrorState
          title="İzinler yüklenemedi"
          onRetry={() => {
            void people.refetch();
            void leaves.refetch();
          }}
        />
      );
    }
    if (rows.length === 0) {
      return (
        <EmptyState
          title="Bu filtrelere uyan kişi yok"
          description="Aramayı genişletin veya bir filtreyi kaldırın."
          action={
            activeFilters > 0 ? (
              <Button variant="neutral" appearance="outlined" onClick={resetFilters}>
                Filtreleri temizle
              </Button>
            ) : undefined
          }
        />
      );
    }
    return view === 'calendar' ? (
      <LeaveTimeline
        rows={rows}
        period={period}
        range={state.range}
        days={days}
        months={months}
        awayToday={awayToday}
        canEdit={canEdit}
        onCreate={(personId, date) => setEditing({ leave: null, prefill: { personId, date } })}
        onEdit={(leave) => setEditing({ leave })}
      />
    ) : (
      <LeaveList rows={rows} canEdit={canEdit} onEdit={(leave) => setEditing({ leave })} />
    );
  };

  function resetFilters() {
    update({ search: '', businessUnitId: null, teamId: null, type: null, awayOnly: false });
  }

  return (
    <div className="c-stack">
      <PageHeader
        title="İzin takvimi"
        subtitle="Kim, ne zaman izinde? Kişiler aşağı doğru, günler yukarıda; her izin türü kendi renginde."
        actions={
          canEdit ? (
            <Button
              startContent={<AddIconOutlinedRounded aria-hidden="true" />}
              onClick={() => setEditing({ leave: null })}
            >
              İzin ekle
            </Button>
          ) : undefined
        }
      />

      <div className="c-stat-grid" role="group" aria-label="İzin özeti">
        <StatTile label="Bugün izinli" value={awayToday.size} detail="kişi" />
        <StatTile label="Bu hafta izinli" value={awayThisWeek.size} detail="kişi" />
        <StatTile
          label="Dönemde izinli"
          value={peopleWithLeave}
          detail={`${rows.length} kişiden`}
        />
        <StatTile label="Dönemde izin günü" value={usedDays} detail="iş günü (hafta sonu hariç)" />
      </div>

      <SectionCard
        title={periodTitle(state.range, period)}
        description={`${formatDateRange(period.from, period.to)} · ${rows.length} kişi`}
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
          </div>
        }
      >
        <div className="c-stack c-stack--s">
          <Toolbar
            label="İzinleri filtrele"
            end={
              <>
                <FilterSummary
                  summary={`${peopleWithLeave} kişi izinli`}
                  activeFilterCount={activeFilters}
                  onReset={resetFilters}
                />
                <ExcelExportButton
                  title={`İzinler — ${periodTitle(state.range, period)}`}
                  disabled={rows.length === 0}
                  build={() => {
                    const context = describeFilters([
                      ['Dönem', formatDateRange(period.from, period.to)],
                      ['Arama', state.search],
                      [
                        'İş birimi',
                        businessUnits.data?.find((u) => u.id === state.businessUnitId)?.name,
                      ],
                      ['Ekip', teams.data?.find((t) => t.id === state.teamId)?.name],
                      ['İzin türü', state.type && masterData.label('leaveTypes', state.type)],
                    ]);
                    const leaves = rows.flatMap((row) =>
                      row.leaves.map((leave) => ({ person: row.person, leave })),
                    );
                    const inPeriod = (leave: LeaveRecord) =>
                      workingDays(
                        leave.startDate < period.from ? period.from : leave.startDate,
                        leave.endDate > period.to ? period.to : leave.endDate,
                      );
                    return [
                      sheet<{ person: Person; leave: LeaveRecord }>({
                        name: 'İzinler',
                        title: `İzinler — ${periodTitle(state.range, period)}`,
                        subtitle: context,
                        rows: leaves,
                        columns: [
                          { header: 'Kişi', value: (r) => r.person.fullName },
                          { header: 'Unvan', value: (r) => r.person.jobTitle },
                          {
                            header: 'İzin türü',
                            value: (r) => masterData.label('leaveTypes', r.leave.type),
                          },
                          { header: 'Başlangıç', value: (r) => r.leave.startDate, type: 'date' },
                          { header: 'Bitiş', value: (r) => r.leave.endDate, type: 'date' },
                          {
                            header: 'Toplam iş günü',
                            value: (r) => workingDays(r.leave.startDate, r.leave.endDate),
                            type: 'integer',
                          },
                          {
                            header: 'Dönemdeki iş günü',
                            value: (r) => inPeriod(r.leave),
                            type: 'integer',
                          },
                          { header: 'Not', value: (r) => r.leave.note, width: 40 },
                        ],
                      }),
                      sheet<TimelineRow>({
                        name: 'Kişi özeti',
                        title: 'Kişi bazında izin özeti',
                        subtitle: context,
                        rows,
                        columns: [
                          { header: 'Kişi', value: (r) => r.person.fullName },
                          { header: 'Unvan', value: (r) => r.person.jobTitle },
                          { header: 'İzin sayısı', value: (r) => r.leaves.length, type: 'integer' },
                          {
                            header: 'Dönemdeki iş günü',
                            value: (r) => r.leaves.reduce((sum, l) => sum + inPeriod(l), 0),
                            type: 'integer',
                          },
                          { header: 'Bugün izinli', value: (r) => awayToday.has(r.person.id) },
                        ],
                      }),
                    ];
                  }}
                />
              </>
            }
          >
            <SearchField
              label="Kişi ara"
              placeholder="Ad veya unvan"
              value={state.search}
              onCommit={(search) => update({ search })}
            />
            <FilterSelect
              label="İş birimi"
              allLabel="Tüm iş birimleri"
              value={state.businessUnitId}
              options={(businessUnits.data ?? []).map((unit) => ({
                value: String(unit.id),
                label: unit.name,
              }))}
              onChange={(value) => update({ businessUnitId: parseId(value) })}
            />
            <FilterSelect
              label="Ekip"
              allLabel="Tüm ekipler"
              value={state.teamId}
              options={(teams.data ?? []).map((team) => ({
                value: String(team.id),
                label: team.name,
              }))}
              onChange={(value) => update({ teamId: parseId(value) })}
            />
            <FilterSelect
              label="İzin türü"
              allLabel="Tüm türler"
              value={state.type}
              options={masterData.options('leaveTypes', state.type)}
              onChange={(type) => update({ type })}
            />
            <Field className="c-filter-switch">
              <Field.Label>Yalnızca izinliler</Field.Label>
              <Switch
                checked={state.awayOnly}
                onChange={(awayOnly: boolean) => update({ awayOnly })}
              >
                <Switch.Indicator />
              </Switch>
            </Field>
          </Toolbar>
          <LeaveLegend />
          <DetailTabs
            label="İzin görünümleri"
            tabs={VIEWS.map((tab) => ({ ...tab, count: null }))}
            active={view}
            onSelect={selectView}
            renderPanel={panel}
          />
        </div>
      </SectionCard>

      {editing && (
        <LeaveDialog
          key={editing.leave?.id ?? `new-${editing.prefill?.personId}-${editing.prefill?.date}`}
          leave={editing.leave}
          prefill={editing.prefill}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
