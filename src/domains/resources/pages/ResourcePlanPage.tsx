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
import { useLeaves } from '@/domains/leaves/api/queries';
import type { LeaveRecord } from '@/domains/leaves/types';
import { usePeopleById } from '@/domains/people/api/queries';
import { useProjectRefs } from '@/domains/projects/api/queries';
import type { EntityId } from '@/domains/shared/types';
import { useTeams } from '@/domains/teams/api/queries';
import { useTabParam } from '@/hooks/useTabParam';
import { formatDateRange, formatMonthYear, toIsoDate } from '@/lib/dates';
import { parseId } from '@/lib/urlParams';
import { useAllocations } from '../api/queries';
import { AllocationDialog } from '../components/AllocationDialog';
import { AllocationList } from '../components/AllocationList';
import { PlanLegend } from '../components/PlanLegend';
import { ResourceTimeline, type PlanRow } from '../components/ResourceTimeline';
import type { AllocationPrefill } from '../schemas/allocationForm';
import { FULL_LOAD, type Allocation } from '../types';
import {
  countPlanFilters,
  parsePlanParams,
  serializePlanParams,
  type PlanViewState,
} from '../utils/planParams';
import {
  loadOn,
  loadSegments,
  peakLoad,
  PLAN_RANGES,
  planPeriod,
  shiftPlanAnchor,
  type PlanRange,
} from '../utils/resourcePlan';

const VIEWS = [
  { id: 'calendar', label: 'Zaman çizelgesi' },
  { id: 'list', label: 'Liste' },
] as const;
const VIEW_IDS = VIEWS.map((view) => view.id);

const RANGE_LABELS: Record<PlanRange, string> = {
  '1m': 'Ay',
  '3m': '3 ay',
  '6m': '6 ay',
  '12m': 'Yıl',
};
/** Bar colour slots (see `.c-plan__bar--c<n>` in global.css). */
const COLOR_SLOTS = 8;

const normalise = foldForSearch;

type Editing = { allocation: Allocation | null; prefill?: AllocationPrefill };

/**
 * Resource planning: who works on which project, when, and how much. People run down the page,
 * time across; parallel work stacks into lanes and a load strip shows when someone is over 100 %.
 * Administrators plan, move and remove allocations; everyone can read.
 */
export default function ResourcePlanPage() {
  const today = toIsoDate(new Date());
  const [params, setParams] = useSearchParams();
  const [view, selectView] = useTabParam(VIEW_IDS);
  const state = parsePlanParams(params, today);
  const update = (patch: Partial<PlanViewState>) =>
    setParams(
      serializePlanParams({ ...state, ...patch }, today, view === 'calendar' ? null : view),
      { replace: true },
    );

  const canEdit = usePermission('resources:manage');
  const people = usePeopleById();
  const teams = useTeams();
  const businessUnits = useBusinessUnits();
  const projectRefs = useProjectRefs();
  const [editing, setEditing] = useState<Editing | null>(null);

  const period = useMemo(() => planPeriod(state.range, state.anchor), [state.range, state.anchor]);
  const allocations = useAllocations(period);
  const leaves = useLeaves(period);

  const colorOf = useMemo(() => {
    const ids = [...(projectRefs.data?.keys() ?? [])].sort((a, b) => a - b);
    return (projectId: EntityId) => Math.max(0, ids.indexOf(projectId)) % COLOR_SLOTS;
  }, [projectRefs.data]);

  const rows = useMemo<PlanRow[]>(() => {
    if (!people.data) return [];
    const team = state.teamId !== null ? teams.data?.find((t) => t.id === state.teamId) : undefined;
    const term = normalise(state.search);
    const byPerson = new Map<EntityId, Allocation[]>();
    for (const allocation of allocations.data ?? []) {
      byPerson.set(allocation.personId, [...(byPerson.get(allocation.personId) ?? []), allocation]);
    }
    const leavesByPerson = new Map<EntityId, LeaveRecord[]>();
    for (const leave of leaves.data ?? []) {
      leavesByPerson.set(leave.personId, [...(leavesByPerson.get(leave.personId) ?? []), leave]);
    }
    return (
      [...people.data.values()]
        .map((person) => ({
          person,
          allocations: byPerson.get(person.id) ?? [],
          leaves: leavesByPerson.get(person.id) ?? [],
        }))
        .filter(
          ({ person, allocations: own }) =>
            (!term ||
              normalise(person.fullName).includes(term) ||
              normalise(person.jobTitle).includes(term)) &&
            (state.businessUnitId === null || person.businessUnitId === state.businessUnitId) &&
            (!team || team.memberIds.includes(person.id) || team.managerId === person.id) &&
            (state.projectId === null || own.some((a) => a.projectId === state.projectId)) &&
            (!state.overOnly || peakLoad(loadSegments(own, period)).percent > FULL_LOAD),
        )
        // People with planned work first, then alphabetical.
        .sort(
          (a, b) =>
            Number(b.allocations.length > 0) - Number(a.allocations.length > 0) ||
            a.person.fullName.localeCompare(b.person.fullName, 'tr'),
        )
    );
  }, [people.data, teams.data, allocations.data, leaves.data, state, period]);

  const stats = useMemo(() => {
    const loads = rows.map((row) => ({
      row,
      now: loadOn(row.allocations, today),
      peak: peakLoad(loadSegments(row.allocations, period)),
    }));
    const busiest = loads.reduce<(typeof loads)[number] | null>(
      (best, entry) => (!best || entry.peak.count > best.peak.count ? entry : best),
      null,
    );
    return {
      overToday: loads.filter((l) => l.now.percent > FULL_LOAD).length,
      overInPeriod: loads.filter((l) => l.peak.percent > FULL_LOAD).length,
      freeToday: loads.filter((l) => l.now.count === 0).length,
      busiest,
    };
  }, [rows, period, today]);

  const projectsInView = useMemo(() => {
    const ids = new Set(rows.flatMap((row) => row.allocations.map((a) => a.projectId)));
    return [...ids]
      .map((id) => projectRefs.data?.get(id))
      .filter((ref) => ref !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [rows, projectRefs.data]);

  const activeFilters = countPlanFilters(state);
  const loading = people.isPending || allocations.isPending || projectRefs.isPending;
  const failed = people.isError || allocations.isError || projectRefs.isError;

  function resetFilters() {
    update({ search: '', businessUnitId: null, teamId: null, projectId: null, overOnly: false });
  }

  const panel = () => {
    if (loading) return <LoadingState label="Kaynak planı yükleniyor" rows={8} />;
    if (failed) {
      return (
        <ErrorState
          title="Kaynak planı yüklenemedi"
          onRetry={() => {
            void people.refetch();
            void allocations.refetch();
            void projectRefs.refetch();
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
    const projects = projectRefs.data ?? new Map();
    return view === 'calendar' ? (
      <ResourceTimeline
        rows={rows}
        period={period}
        range={state.range}
        today={today}
        projects={projects}
        colorOf={colorOf}
        canEdit={canEdit}
        onCreate={(personId, date) =>
          setEditing({
            allocation: null,
            prefill: { personId, date, projectId: state.projectId ?? undefined },
          })
        }
        onEdit={(allocation) => setEditing({ allocation })}
      />
    ) : (
      <AllocationList
        rows={rows}
        projects={projects}
        canEdit={canEdit}
        onEdit={(allocation) => setEditing({ allocation })}
      />
    );
  };

  const title =
    state.range === '1m'
      ? formatMonthYear(period.from)
      : `${formatMonthYear(period.from)} – ${formatMonthYear(period.to)}`;

  return (
    <div className="c-stack">
      <PageHeader
        title="Kaynak planı"
        subtitle="Kim hangi projede, ne zaman ve ne kadar çalışıyor? Üst üste binen çubuklar paralel işlerdir; çizgi kişinin günlük yükünü gösterir."
        actions={
          canEdit ? (
            <Button
              startContent={<AddIconOutlinedRounded aria-hidden="true" />}
              onClick={() =>
                setEditing({
                  allocation: null,
                  prefill: { projectId: state.projectId ?? undefined },
                })
              }
            >
              Kaynak ata
            </Button>
          ) : undefined
        }
      />

      <div className="c-stat-grid" role="group" aria-label="Kaynak özeti">
        <StatTile
          label="Bugün aşırı yüklü"
          value={stats.overToday}
          detail="kişi %100'ün üstünde"
          tone={stats.overToday > 0 ? 'warning' : 'default'}
        />
        <StatTile
          label="Dönemde aşırı yüklenen"
          value={stats.overInPeriod}
          detail={`${rows.length} kişiden`}
          tone={stats.overInPeriod > 0 ? 'warning' : 'default'}
        />
        <StatTile
          label="En çok paralel iş"
          value={stats.busiest?.peak.count ?? 0}
          detail={stats.busiest?.peak.count ? stats.busiest.row.person.fullName : 'Atama yok'}
        />
        <StatTile label="Bugün boşta" value={stats.freeToday} detail="kişinin ataması yok" />
      </div>

      <SectionCard
        title={title}
        description={`${formatDateRange(period.from, period.to)} · ${rows.length} kişi`}
        actions={
          <div className="c-period-nav" role="group" aria-label="Dönem">
            <Button
              size="small"
              variant="neutral"
              appearance="outlined"
              startContent={<ChevronLeftIconOutlinedRounded aria-hidden="true" />}
              aria-label="Önceki dönem"
              onClick={() => update({ anchor: shiftPlanAnchor(state.range, state.anchor, -1) })}
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
              onClick={() => update({ anchor: shiftPlanAnchor(state.range, state.anchor, 1) })}
            />
            <span className="c-period-nav__divider" aria-hidden="true" />
            <div className="c-segmented" role="group" aria-label="Görünen aralık">
              {PLAN_RANGES.map((range) => (
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
            label="Kaynak planını filtrele"
            end={
              <FilterSummary
                summary={`${stats.overInPeriod} kişi aşırı yüklü`}
                activeFilterCount={activeFilters}
                onReset={resetFilters}
              />
            }
          >
            <SearchField
              label="Kişi ara"
              placeholder="Ad veya unvan"
              value={state.search}
              onCommit={(search) => update({ search })}
            />
            <FilterSelect
              label="Proje"
              allLabel="Tüm projeler"
              value={state.projectId}
              options={[...(projectRefs.data?.values() ?? [])]
                .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
                .map((ref) => ({ value: String(ref.id), label: ref.name }))}
              onChange={(value) => update({ projectId: parseId(value) })}
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
              label="İş birimi"
              allLabel="Tüm iş birimleri"
              value={state.businessUnitId}
              options={(businessUnits.data ?? []).map((unit) => ({
                value: String(unit.id),
                label: unit.name,
              }))}
              onChange={(value) => update({ businessUnitId: parseId(value) })}
            />
            <Field className="c-filter-switch">
              <Field.Label>Yalnızca aşırı yüklüler</Field.Label>
              <Switch
                checked={state.overOnly}
                onChange={(overOnly: boolean) => update({ overOnly })}
              >
                <Switch.Indicator />
              </Switch>
            </Field>
          </Toolbar>
          <PlanLegend projects={projectsInView} colorOf={colorOf} />
          <DetailTabs
            label="Kaynak planı görünümleri"
            tabs={VIEWS.map((tab) => ({ ...tab, count: null }))}
            active={view}
            onSelect={selectView}
            renderPanel={panel}
          />
        </div>
      </SectionCard>

      {editing && (
        <AllocationDialog
          key={
            editing.allocation?.id ??
            `new-${editing.prefill?.personId}-${editing.prefill?.date}-${editing.prefill?.projectId}`
          }
          allocation={editing.allocation}
          prefill={editing.prefill}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
