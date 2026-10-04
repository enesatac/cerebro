import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { StatTile } from '@/components/data-display/StatTile';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { DetailTabs } from '@/components/layout/DetailTabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { usePeopleById } from '@/domains/people/api/queries';
import { useTabParam } from '@/hooks/useTabParam';
import { toIsoDate } from '@/lib/dates';
import { useDemands } from '../api/queries';
import { DemandAssessmentDialog } from '../components/DemandAssessmentDialog';
import { DemandBacklogTable, type BacklogMode } from '../components/DemandBacklogTable';
import { DemandFilterBar } from '../components/DemandFilterBar';
import { DemandRoadmap } from '../components/DemandRoadmap';
import { CLOSED_STATUSES, INBOX_STATUSES, type Demand, type DemandStatus } from '../types';
import { compareBacklog, isOpenDemand } from '../utils/demandScoring';
import {
  countDemandFilters,
  filterDemands,
  parseDemandFilters,
  withDemandFilters,
  type DemandFilters,
} from '../utils/demandFilters';
import { quarterOf } from '../utils/quarters';
import { buildRoadmap } from '../utils/roadmap';

const TABS = [
  { id: 'inbox', label: 'Gelen kutusu' },
  { id: 'backlog', label: 'Önceliklendirme' },
  { id: 'roadmap', label: 'Yol haritası' },
  { id: 'closed', label: 'Kapananlar' },
] as const;
type TabId = (typeof TABS)[number]['id'];
const TAB_IDS = TABS.map((tab) => tab.id);

const ROADMAP_QUARTERS = 6;

/** Which demands each tab works on, and in what order. */
const TAB_SCOPE: Record<
  TabId,
  { statuses: readonly DemandStatus[] | null; sort: (a: Demand, b: Demand) => number }
> = {
  // Oldest first: first come, first served.
  inbox: { statuses: INBOX_STATUSES, sort: (a, b) => a.submittedAt.localeCompare(b.submittedAt) },
  backlog: { statuses: null, sort: compareBacklog },
  roadmap: { statuses: ['approved', 'scheduled'], sort: compareBacklog },
  closed: {
    statuses: CLOSED_STATUSES,
    sort: (a, b) => b.audit.updatedAt.localeCompare(a.audit.updatedAt),
  },
};

const EMPTY: Record<TabId, { title: string; description: string }> = {
  inbox: { title: 'Bekleyen talep yok', description: 'Yeni talepler geldiğinde burada sıralanır.' },
  backlog: {
    title: 'Açık talep yok',
    description: 'Değerlendirilen talepler öncelik sırasıyla burada.',
  },
  roadmap: {
    title: 'Planlanacak talep yok',
    description: 'Onaylanan talepler burada çeyreklere yerleştirilir.',
  },
  closed: {
    title: 'Kapanan talep yok',
    description: 'Projeye dönüşen, reddedilen ve geri çekilen talepler.',
  },
};

type Assessing = { demand: Demand; status?: DemandStatus };

/**
 * The portfolio office's demand screen: triage what came in, rank the open demands by priority
 * and score, and place approved ones on the quarter roadmap.
 */
export default function DemandManagementPage() {
  const today = toIsoDate(new Date());
  const [params, setParams] = useSearchParams();
  const [tab, selectTab] = useTabParam(TAB_IDS);
  const filters = parseDemandFilters(params);
  const update = (patch: Partial<DemandFilters>) =>
    setParams(withDemandFilters(params, patch), { replace: true });
  const [assessing, setAssessing] = useState<Assessing | null>(null);

  const demands = useDemands();
  const people = usePeopleById();
  const all = useMemo(() => demands.data ?? [], [demands.data]);

  const inScope = (id: TabId) => {
    const { statuses, sort } = TAB_SCOPE[id];
    return all.filter((d) => (statuses ? statuses.includes(d.status) : isOpenDemand(d))).sort(sort);
  };
  const scoped = inScope(tab);
  const shown = filterDemands(scoped, filters, (id) => people.data?.get(id)?.fullName);
  const lanes = tab === 'roadmap' ? buildRoadmap(shown, today, ROADMAP_QUARTERS) : [];

  const count = (statuses: readonly DemandStatus[]) =>
    all.filter((d) => statuses.includes(d.status)).length;
  const thisQuarter = quarterOf(today);
  const startingThisQuarter = all.filter(
    (d) =>
      d.status === 'scheduled' &&
      d.assessment.plannedStart !== null &&
      d.assessment.plannedStart >= thisQuarter.start &&
      d.assessment.plannedStart <= thisQuarter.end,
  ).length;
  const assess = (demand: Demand, status?: DemandStatus) => setAssessing({ demand, status });

  const panel = (id: TabId) => {
    if (demands.isPending) return <LoadingState label="Talepler yükleniyor" rows={6} />;
    if (demands.isError) {
      return <ErrorState title="Talepler yüklenemedi" onRetry={() => void demands.refetch()} />;
    }
    const empty =
      countDemandFilters(filters) > 0 ? (
        <EmptyState compact title="Bu filtrelere uyan talep yok" />
      ) : (
        <EmptyState compact {...EMPTY[id]} />
      );
    return (
      <div className="c-stack c-stack--s">
        <DemandFilterBar
          filters={filters}
          onChange={update}
          shown={shown}
          exportTitle={`Talep yönetimi — ${TABS.find((t) => t.id === id)?.label}`}
          statuses={TAB_SCOPE[id].statuses ?? undefined}
        />
        {id === 'roadmap' ? (
          <DemandRoadmap lanes={lanes} onAssess={assess} />
        ) : (
          <DemandBacklogTable
            demands={shown}
            mode={id as BacklogMode}
            onAssess={assess}
            emptyState={empty}
          />
        )}
      </div>
    );
  };

  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[
          { label: 'Talepler', to: paths.demands.list('all') },
          { label: 'Talep yönetimi' },
        ]}
        title="Talep yönetimi"
        subtitle="Gelen talepleri değerlendirin, puanlayıp önceliklendirin ve takvime alın. Kararlar ve notlar talep sahibine görünür."
      />
      <div className="c-stat-grid" role="group" aria-label="Talep özeti">
        <StatTile
          label="Yeni talepler"
          value={count(['submitted'])}
          detail="henüz incelenmedi"
          tone={count(['submitted']) > 0 ? 'warning' : 'default'}
          to={paths.demands.manage()}
        />
        <StatTile
          label="Değerlendirmede"
          value={count(['in-review'])}
          detail={`${count(['needs-info'])} talep bilgi bekliyor`}
          to={paths.demands.manage()}
        />
        <StatTile
          label="Takvim bekleyen"
          value={count(['approved'])}
          detail="onaylandı, tarih yok"
          tone={count(['approved']) > 0 ? 'warning' : 'default'}
          to={paths.demands.manage('roadmap')}
        />
        <StatTile
          label={`${thisQuarter.label} başlayan`}
          value={startingThisQuarter}
          detail={`${count(['scheduled'])} talep takvimde`}
          to={paths.demands.manage('roadmap')}
        />
      </div>
      <SectionCard title="Talepler">
        <DetailTabs
          label="Talep yönetimi görünümleri"
          tabs={TABS.map((t) => ({
            id: t.id,
            label: t.label,
            count: demands.data ? inScope(t.id).length : null,
          }))}
          active={tab}
          onSelect={selectTab}
          renderPanel={panel}
        />
      </SectionCard>
      {assessing && (
        <DemandAssessmentDialog
          key={assessing.demand.id}
          demand={assessing.demand}
          status={assessing.status}
          onClose={() => setAssessing(null)}
        />
      )}
    </div>
  );
}
