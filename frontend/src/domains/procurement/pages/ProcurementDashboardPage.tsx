import { Alert } from '@takeoff-ui/react-spar';
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
import { useCurrentUser, usePrivilege } from '@/domains/auth/api/queries';
import { useBusinessUnitOptions, useBusinessUnitsById } from '@/domains/business-units/api/queries';
import { useMasterData } from '@/domains/master-data/context';
import { usePeopleById } from '@/domains/people/api/queries';
import { useProjectOptions, useProjectRefs } from '@/domains/projects/api/queries';
import { useTabParam } from '@/hooks/useTabParam';
import { toIsoDate } from '@/lib/dates';
import { includesFolded } from '@/lib/search';
import { oneOf, parseId } from '@/lib/urlParams';
import { describeFilters } from '@/lib/xlsxTypes';
import { useProcurementList } from '../api/queries';
import { DeadlinesTable } from '../components/DeadlinesTable';
import { ProcurementTable } from '../components/ProcurementTable';
import {
  currentStep,
  PROCESS_STATE_LABELS,
  PROCESS_STATES,
  processState,
  trackerMetrics,
  upcomingDeadlines,
} from '../utils/processState';
import { procurementSheets } from '../utils/procurementExport';

const TAB_IDS = ['purchases', 'deadlines'] as const;
/** How far ahead "due soon" looks. */
const DUE_SOON_DAYS = 14;
/** `?unit=all`: the user cleared their default business unit. */
const ALL_UNITS = 'all';

/**
 * The procurement tracker: where every purchase of every project stands — current step, dates,
 * delays — and what is due soon. The procurement team manages it; business units follow it
 * read-only, opening on their own unit.
 */
export default function ProcurementDashboardPage() {
  const today = toIsoDate(new Date());
  const [params, setParams] = useSearchParams();
  const [tab, selectTab] = useTabParam(TAB_IDS);
  const canEdit = usePrivilege('procurement:edit');
  const user = useCurrentUser();
  const people = usePeopleById();
  const ownUnit =
    user?.personId != null ? (people.data?.get(user.personId)?.businessUnitId ?? null) : null;

  const unitParam = params.get('unit');
  const filters = {
    search: params.get('q') ?? '',
    projectId: parseId(params.get('project')),
    // Read-only viewers open on their own unit; everyone can widen it.
    unitId: unitParam === ALL_UNITS ? null : (parseId(unitParam) ?? (canEdit ? null : ownUnit)),
    state: oneOf(PROCESS_STATES, params.get('state')),
  };
  const update = (patch: Partial<typeof filters>) => {
    const next = { ...filters, ...patch };
    const result = new URLSearchParams(params);
    const set = (key: string, value: string | number | null) =>
      value === null || value === '' ? result.delete(key) : result.set(key, String(value));
    set('q', next.search.trim());
    set('project', next.projectId);
    set('unit', next.unitId ?? (!canEdit && ownUnit !== null ? ALL_UNITS : null));
    set('state', next.state);
    setParams(result, { replace: true });
  };

  const masterData = useMasterData();
  const purchases = useProcurementList();
  const projectOptions = useProjectOptions();
  const projects = useProjectRefs();
  const unitOptions = useBusinessUnitOptions();
  const units = useBusinessUnitsById();

  const all = purchases.data ?? [];
  const shown = all.filter((p) => {
    const step = currentStep(p.steps);
    return (
      (filters.projectId === null || p.projectId === filters.projectId) &&
      (filters.unitId === null || p.businessUnitId === filters.unitId) &&
      (!filters.state || processState(p.steps, today) === filters.state) &&
      (!filters.search ||
        [
          p.code,
          p.title,
          p.vendorName,
          step ? masterData.label('procurementSteps', step.type) : '',
        ].some((text) => includesFolded(text, filters.search)))
    );
  });
  const metrics = trackerMetrics(shown, today, DUE_SOON_DAYS);
  const activeFilters = [filters.search, filters.projectId, filters.unitId, filters.state].filter(
    (v) => v !== null && v !== '',
  ).length;
  const subtitle = describeFilters([
    ['Arama', filters.search],
    ['Proje', projectOptions.find((p) => p.value === String(filters.projectId))?.label],
    ['İş birimi', filters.unitId !== null ? units.data?.get(filters.unitId)?.name : null],
    ['Durum', filters.state && PROCESS_STATE_LABELS[filters.state]],
  ]);

  const panel = (id: (typeof TAB_IDS)[number]) => {
    if (purchases.isPending) return <LoadingState label="Satın almalar yükleniyor" rows={6} />;
    if (purchases.isError) {
      return (
        <ErrorState title="Satın almalar yüklenemedi" onRetry={() => void purchases.refetch()} />
      );
    }
    if (id === 'deadlines') {
      return (
        <div className="c-stack c-stack--s">
          <p className="c-muted">
            Önümüzdeki {DUE_SOON_DAYS} gün içinde bitmesi planlanan ve süresi geçmiş açık adımlar;
            en erken tarih en üstte. Üstteki filtreler burada da geçerli.
          </p>
          <DeadlinesTable
            deadlines={upcomingDeadlines(shown, today, DUE_SOON_DAYS)}
            today={today}
          />
        </div>
      );
    }
    return (
      <ProcurementTable
        purchases={shown}
        today={today}
        emptyState={
          <EmptyState
            compact
            title={activeFilters > 0 ? 'Bu filtrelere uyan satın alma yok' : 'Henüz satın alma yok'}
            description={
              activeFilters > 0
                ? undefined
                : 'Satın almalar projelerin sözleşmelerinden gelir; sözleşme eklendiğinde burada görünür.'
            }
          />
        }
      />
    );
  };

  return (
    <div className="c-stack">
      <PageHeader
        title="Satın alma takibi"
        subtitle="Projelerdeki satın almaların süreci: hangi adımda, ne zaman bitmesi planlanıyor, nerede gecikme var."
      />
      {!canEdit && (
        <Alert variant="info" appearance="outlined">
          <Alert.Content>
            <Alert.Description>
              Bu ekranı salt okunur görüntülüyorsunuz. Adımlar ve tarihler satın alma ekibi
              tarafından güncellenir.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}
      <div className="c-stat-grid" role="group" aria-label="Satın alma özeti">
        <StatTile
          label="Süren satın alma"
          value={metrics.running}
          detail={`${shown.length} satın almadan`}
        />
        <StatTile
          label="Geciken adım"
          value={metrics.lateSteps}
          tone={metrics.lateSteps > 0 ? 'warning' : 'default'}
          to={paths.procurement.list('deadlines')}
        />
        <StatTile
          label={`${DUE_SOON_DAYS} gün içinde biten adım`}
          value={metrics.dueSoon}
          to={paths.procurement.list('deadlines')}
        />
        <StatTile
          label="Engellenen"
          value={metrics.blocked}
          tone={metrics.blocked > 0 ? 'warning' : 'default'}
        />
        <StatTile
          label="Tamamlanan"
          value={metrics.completed}
          detail={
            metrics.undefinedCount > 0 ? `${metrics.undefinedCount} süreç tanımlanmadı` : undefined
          }
        />
      </div>
      <SectionCard title="Satın almalar">
        <div className="c-stack c-stack--s">
          <Toolbar
            label="Satın almaları filtrele"
            end={
              <>
                <FilterSummary
                  summary={`${shown.length} satın alma`}
                  activeFilterCount={activeFilters}
                  onReset={() => update({ search: '', projectId: null, unitId: null, state: null })}
                />
                <ExcelExportButton
                  title="Satın alma takibi"
                  disabled={shown.length === 0}
                  build={() =>
                    procurementSheets(
                      shown,
                      today,
                      masterData,
                      {
                        project: (id) => projects.data?.get(id)?.name,
                        businessUnit: (id) => (id === null ? undefined : units.data?.get(id)?.name),
                        person: (id) => (id === null ? undefined : people.data?.get(id)?.fullName),
                      },
                      { title: 'Satın alma takibi', subtitle },
                    )
                  }
                />
              </>
            }
          >
            <SearchField
              label="Satın alma ara"
              placeholder="Başlık, kod, tedarikçi veya adım"
              value={filters.search}
              onCommit={(search) => update({ search })}
            />
            <FilterSelect
              label="Proje"
              allLabel="Tüm projeler"
              value={filters.projectId}
              options={projectOptions}
              onChange={(value) => update({ projectId: parseId(value) })}
            />
            <FilterSelect
              label="İş birimi"
              allLabel="Tüm iş birimleri"
              value={filters.unitId}
              options={unitOptions}
              onChange={(value) => update({ unitId: parseId(value) })}
            />
            <FilterSelect
              label="Süreç durumu"
              allLabel="Tüm durumlar"
              value={filters.state}
              options={PROCESS_STATES.map((state) => ({
                value: state,
                label: PROCESS_STATE_LABELS[state],
              }))}
              onChange={(value) => update({ state: oneOf(PROCESS_STATES, value) })}
            />
          </Toolbar>
          <DetailTabs
            label="Satın alma görünümleri"
            tabs={[
              {
                id: 'purchases',
                label: 'Satın almalar',
                count: purchases.data ? shown.length : null,
              },
              { id: 'deadlines', label: 'Yaklaşan ve geciken adımlar' },
            ]}
            active={tab}
            onSelect={selectTab}
            renderPanel={panel}
          />
        </div>
      </SectionCard>
    </div>
  );
}
