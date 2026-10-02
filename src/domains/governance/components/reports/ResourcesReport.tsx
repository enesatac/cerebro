import { paths } from '@/app/router/paths';
import { categoricalColor, SINGLE_SERIES_COLOR } from '@/components/charts/chartColors';
import { ChartCard } from '@/components/charts/ChartCard';
import { MonthlyChart } from '@/components/charts/MonthlyChart';
import type { ChartSeries } from '@/components/charts/types';
import { StatTile } from '@/components/data-display/StatTile';
import { useProjectRefs } from '@/domains/projects/api/queries';
import { formatDecimal } from '@/lib/format';
import type { PortfolioTrends } from '../../types';
import { monthlyTable, useCoded } from './reportSeries';

const at = (values: readonly (number | null)[], index: number) =>
  index >= 0 ? (values[index] ?? 0) : 0;
const fte = (value: number) => `${formatDecimal(value)} FTE`;

/** Planned capacity per project, over-allocation and absence over time. */
export function ResourcesReport({ trends }: { trends: PortfolioTrends }) {
  const projects = useProjectRefs();
  const leaveType = useCoded('leaveTypes');
  const now = trends.currentMonthIndex;

  // Colour follows the project (slot by id), never its position in this chart.
  const ids = [...(projects.data?.keys() ?? [])].sort((a, b) => a - b);
  const capacity: ChartSeries[] = trends.capacityByProject.map((s) => ({
    key: s.key,
    label: projects.data?.get(Number(s.key))?.name ?? `Proje #${s.key}`,
    color: categoricalColor(Math.max(0, ids.indexOf(Number(s.key)))),
    values: s.values,
  }));
  const overallocated = [
    {
      key: 'over',
      label: 'Aşırı yüklü kişi',
      color: SINGLE_SERIES_COLOR,
      values: trends.overallocatedPeople,
    },
  ];
  const leave = leaveType.series(trends.leaveDaysByType);
  const capacityNow = capacity.reduce((sum, s) => sum + at(s.values, now), 0);
  const busiest = capacity.reduce<ChartSeries | null>(
    (best, s) => (!best || at(s.values, now) > at(best.values, now) ? s : best),
    null,
  );

  return (
    <div className="c-stack">
      <div className="c-stat-grid" role="group" aria-label="Kaynak özeti">
        <StatTile
          label="Bu ay planlanan kapasite"
          value={fte(capacityNow)}
          detail="tam zamanlı eşdeğer"
          to={paths.resources()}
        />
        <StatTile
          label="Bu ay aşırı yüklü"
          value={at(trends.overallocatedPeople, now)}
          detail="kişi en az bir gün %100'ün üstünde"
          tone={at(trends.overallocatedPeople, now) > 0 ? 'warning' : 'default'}
          to={paths.resources()}
        />
        <StatTile
          label="En çok kaynak alan proje"
          value={busiest ? fte(at(busiest.values, now)) : '—'}
          detail={busiest?.label ?? 'Atama yok'}
        />
        <StatTile
          label="Bu ay izin"
          value={leave.reduce((sum, s) => sum + at(s.values, now), 0)}
          detail="iş günü"
          to={paths.leaves()}
        />
      </div>

      <div className="c-chart-grid">
        <div className="c-chart-grid__wide">
          <ChartCard
            title="Projelere göre planlanan kapasite"
            description="Kaynak atamalarından: ayın iş günlerine göre ortalama tam zamanlı eşdeğer (FTE)."
            legend={capacity}
            table={monthlyTable(trends.months, capacity, { total: true, type: 'decimal' })}
          >
            <MonthlyChart
              months={trends.months}
              currentIndex={now}
              series={capacity}
              kind="stacked"
              integer={false}
              formatValue={formatDecimal}
              label="Aylık planlanan kapasite, projelere göre, FTE"
              height={280}
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Aşırı yüklü kişi sayısı"
          description="Ayın en az bir gününde toplam doluluğu %100'ü aşan kişiler."
          table={monthlyTable(trends.months, overallocated)}
        >
          <MonthlyChart
            months={trends.months}
            currentIndex={now}
            series={overallocated}
            kind="line"
            label="Aylık aşırı yüklü kişi sayısı"
          />
        </ChartCard>

        <ChartCard
          title="İzin günleri"
          description="Aylık kullanılan veya planlanan izin, iş günü olarak, türe göre."
          legend={leave}
          table={monthlyTable(trends.months, leave, { total: true })}
        >
          <MonthlyChart
            months={trends.months}
            currentIndex={now}
            series={leave}
            kind="stacked"
            label="Aylık izin günleri, türe göre"
          />
        </ChartCard>
      </div>
    </div>
  );
}
