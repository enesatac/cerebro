import { Button } from '@takeoff-ui/react-spar';
import { addMonths, parseISO, startOfMonth } from 'date-fns';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { QueryView } from '@/components/feedback/QueryView';
import { DetailTabs } from '@/components/layout/DetailTabs';
import { PageHeader } from '@/components/layout/PageHeader';
import type { IsoDate } from '@/domains/shared/types';
import { useTabParam } from '@/hooks/useTabParam';
import { toIsoDate } from '@/lib/dates';
import { oneOf } from '@/lib/urlParams';
import { useApplicationHealthReport, usePortfolioTrends } from '../api/queries';
import { DataQualityReport } from '../components/DataQualityReport';
import { OperationsReport } from '../components/reports/OperationsReport';
import { PortfolioReport } from '../components/reports/PortfolioReport';
import { ResourcesReport } from '../components/reports/ResourcesReport';
import { TechnologyRiskReport } from '../components/TechnologyRiskReport';
import type { PortfolioTrends, ReportPeriod } from '../types';

const TABS = [
  { id: 'portfolio', label: 'Portföy' },
  { id: 'operations', label: 'Operasyon' },
  { id: 'resources', label: 'Kaynak ve izin' },
  { id: 'data-quality', label: 'Veri kalitesi' },
  { id: 'technology-risk', label: 'Teknoloji riski' },
] as const;
const TAB_IDS = TABS.map((tab) => tab.id);
type ReportTab = (typeof TAB_IDS)[number];
const CHART_TABS = new Set<ReportTab>(['portfolio', 'operations', 'resources']);

/** Period presets: months before the current one, and months of plan after it. */
const PERIODS = {
  '12-6': { label: 'Son 12 ay + 6 ay plan', back: 11, ahead: 6 },
  '24': { label: 'Son 24 ay', back: 23, ahead: 0 },
  plan: { label: 'Önümüzdeki 12 ay', back: 2, ahead: 12 },
} as const;
type PeriodId = keyof typeof PERIODS;
// Explicit order: object keys that look like numbers ('24') would otherwise come first.
const PERIOD_IDS: PeriodId[] = ['12-6', '24', 'plan'];
const DEFAULT_PERIOD: PeriodId = '12-6';

function periodFor(id: PeriodId, today: IsoDate): ReportPeriod {
  const { back, ahead } = PERIODS[id];
  return {
    from: toIsoDate(startOfMonth(addMonths(parseISO(today), -back))),
    months: back + 1 + ahead,
  };
}

function ChartTab({ tab, trends }: { tab: ReportTab; trends: PortfolioTrends }) {
  if (tab === 'operations') return <OperationsReport trends={trends} />;
  if (tab === 'resources') return <ResourcesReport trends={trends} />;
  return <PortfolioReport trends={trends} />;
}

export default function ReportsPage() {
  const [activeTab, selectTab] = useTabParam(TAB_IDS);
  const [params, setParams] = useSearchParams();
  const periodId = oneOf(PERIOD_IDS, params.get('period')) ?? DEFAULT_PERIOD;
  const today = toIsoDate(new Date());
  const period = useMemo(() => periodFor(periodId, today), [periodId, today]);

  const trends = usePortfolioTrends(period, today);
  const health = useApplicationHealthReport();

  const selectPeriod = (id: PeriodId) => {
    const next = new URLSearchParams(params);
    if (id === DEFAULT_PERIOD) next.delete('period');
    else next.set('period', id);
    setParams(next, { replace: true });
  };

  return (
    <div className="c-stack">
      <PageHeader
        title="Raporlar"
        subtitle="Portföyün zaman içindeki seyri ve bugünkü durumu: projeler, uygulamalar, eskalasyonlar, riskler, kaynaklar ve veri kalitesi."
      />
      <DetailTabs
        label="Raporlar"
        tabs={TABS}
        active={activeTab}
        onSelect={selectTab}
        renderPanel={(tab) =>
          CHART_TABS.has(tab) ? (
            <div className="c-stack">
              <div className="c-period-presets" role="group" aria-label="Dönem">
                {PERIOD_IDS.map((id) => (
                  <Button
                    key={id}
                    size="small"
                    variant={periodId === id ? 'primary' : 'neutral'}
                    appearance={periodId === id ? 'filled' : 'outlined'}
                    aria-pressed={periodId === id}
                    onClick={() => selectPeriod(id)}
                  >
                    {PERIODS[id].label}
                  </Button>
                ))}
              </div>
              <QueryView
                query={trends}
                loadingLabel="Grafikler hazırlanıyor"
                errorTitle="Grafikler hazırlanamadı"
              >
                {(data) => (
                  <div className={trends.isPlaceholderData ? 'c-refreshing' : undefined}>
                    <ChartTab tab={tab} trends={data} />
                  </div>
                )}
              </QueryView>
            </div>
          ) : (
            <QueryView
              query={health}
              loadingLabel="Raporlar hazırlanıyor"
              errorTitle="Raporlar hazırlanamadı"
            >
              {(rows) =>
                tab === 'data-quality' ? (
                  <DataQualityReport rows={rows} />
                ) : (
                  <TechnologyRiskReport rows={rows} />
                )
              }
            </QueryView>
          )
        }
      />
    </div>
  );
}
