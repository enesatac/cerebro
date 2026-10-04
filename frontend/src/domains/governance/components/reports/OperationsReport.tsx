import { paths } from '@/app/router/paths';
import { SINGLE_SERIES_COLOR } from '@/components/charts/chartColors';
import { ChartCard } from '@/components/charts/ChartCard';
import { HeatMatrix } from '@/components/charts/HeatMatrix';
import { MonthlyChart } from '@/components/charts/MonthlyChart';
import { StatTile } from '@/components/data-display/StatTile';
import { useMasterData } from '@/domains/master-data/context';
import { RISK_LIKELIHOODS } from '@/domains/risks/types';
import { formatMonthYear } from '@/lib/dates';
import { formatDecimal } from '@/lib/format';
import type { PortfolioTrends } from '../../types';
import { monthlyTable, useCoded } from './reportSeries';

const sum = (values: readonly (number | null)[]) =>
  values.reduce<number>((total, v) => total + (v ?? 0), 0);

const days = (value: number) => `${formatDecimal(value)} gün`;

/** Diagonal bands of a 3×3 matrix (row 0 = highest probability): 0 low … 3 severe. */
const riskBand = (rowIndex: number, columnIndex: number) =>
  [0, 0, 1, 2, 3][2 - rowIndex + columnIndex] ?? 0;

/** Escalations, risks and decisions over time. */
export function OperationsReport({ trends }: { trends: PortfolioTrends }) {
  const masterData = useMasterData();
  const severity = useCoded('criticalities');
  const decisionStatus = useCoded('decisionStatuses');
  const now = trends.currentMonthIndex;

  const raised = severity.series(trends.escalationsRaised);
  const risks = severity.series(trends.risksRegistered);
  const decisions = decisionStatus.series(trends.decisionsByStatus);
  const backlog = [
    {
      key: 'open',
      label: 'Açık eskalasyon',
      color: SINGLE_SERIES_COLOR,
      values: trends.escalationsOpenAtMonthEnd,
    },
  ];
  const resolve = [
    {
      key: 'median',
      label: 'Medyan çözüm süresi',
      color: SINGLE_SERIES_COLOR,
      values: trends.escalationMedianDaysToResolve,
    },
  ];
  const lastResolved = trends.escalationMedianDaysToResolve.reduce<number>(
    (last, v, index) => (v == null ? last : index),
    -1,
  );
  const likelihoods = RISK_LIKELIHOODS.map((code) => ({
    key: code,
    label: masterData.label('criticalities', code),
  }));
  const matrix = (probability: string, impact: string) =>
    trends.activeRiskMatrix.find((c) => c.probability === probability && c.impact === impact)
      ?.count ?? 0;
  const activeRisks = sum(trends.activeRiskMatrix.map((c) => c.count));
  const severeRisks = trends.activeRiskMatrix
    .filter((c) => c.probability !== 'low' && c.impact === 'high')
    .reduce((total, c) => total + c.count, 0);

  return (
    <div className="c-stack">
      <div className="c-stat-grid" role="group" aria-label="Operasyon özeti">
        <StatTile
          label="Açık eskalasyon"
          value={now >= 0 ? (trends.escalationsOpenAtMonthEnd[now] ?? 0) : '—'}
          detail="bugün"
          to={paths.risks()}
          tone={(trends.escalationsOpenAtMonthEnd[now] ?? 0) > 0 ? 'warning' : 'default'}
        />
        <StatTile
          label="Dönemde açılan eskalasyon"
          value={sum(raised.flatMap((s) => s.values))}
          detail={`${trends.months.length} ayda`}
        />
        <StatTile
          label="Medyan çözüm süresi"
          value={
            lastResolved >= 0 ? days(trends.escalationMedianDaysToResolve[lastResolved] ?? 0) : '—'
          }
          detail={
            lastResolved >= 0
              ? `${formatMonthYear(trends.months[lastResolved] ?? '')} içinde çözülenler`
              : 'çözülen yok'
          }
        />
        <StatTile
          label="Aktif risk"
          value={activeRisks}
          detail={`${severeRisks} tanesi yüksek etkili ve olası`}
          to={paths.risks('risks')}
          tone={severeRisks > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="c-chart-grid">
        <div className="c-chart-grid__wide">
          <ChartCard
            title="Aylık açılan eskalasyonlar"
            description="Açılış tarihine göre, önem derecesiyle."
            legend={raised}
            table={monthlyTable(trends.months, raised, { total: true })}
          >
            <MonthlyChart
              months={trends.months}
              currentIndex={now}
              series={raised}
              kind="stacked"
              label="Aylık açılan eskalasyonlar, önem derecesine göre"
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Ay sonunda açık eskalasyonlar"
          description="Henüz çözülmemiş eskalasyon sayısı (birikme)."
          table={monthlyTable(trends.months, backlog)}
        >
          <MonthlyChart
            months={trends.months}
            currentIndex={now}
            series={backlog}
            kind="line"
            label="Ay sonunda açık eskalasyon sayısı"
          />
        </ChartCard>

        <ChartCard
          title="Eskalasyon çözüm süresi"
          description="O ay çözülen eskalasyonların açılıştan çözüme medyan gün sayısı. Boşluk: o ay çözülen yok."
          table={monthlyTable(trends.months, resolve, { type: 'decimal' })}
        >
          <MonthlyChart
            months={trends.months}
            currentIndex={now}
            series={resolve}
            kind="line"
            integer={false}
            formatValue={formatDecimal}
            label="Aylık medyan eskalasyon çözüm süresi, gün"
          />
        </ChartCard>

        <ChartCard
          title="Aktif risk matrisi"
          description="Açık ve izlenen riskler, olasılık ve etkiye göre."
          table={{
            head: ['Olasılık', ...likelihoods.map((l) => `Etki: ${l.label}`)],
            rows: [...likelihoods].reverse().map((row) => ({
              key: row.key,
              cells: [row.label, ...likelihoods.map((column) => matrix(row.key, column.key))],
            })),
          }}
        >
          <HeatMatrix
            rows={[...likelihoods].reverse()}
            columns={likelihoods}
            value={matrix}
            rowTitle="Olasılık"
            columnTitle="Etki"
            caption="Aktif riskler: satırlar olasılık, sütunlar etki"
            band={riskBand}
          />
        </ChartCard>

        <ChartCard
          title="Aylık kaydedilen riskler"
          description="Kayıt tarihine göre, önem derecesiyle."
          legend={risks}
          table={monthlyTable(trends.months, risks, { total: true })}
        >
          <MonthlyChart
            months={trends.months}
            currentIndex={now}
            series={risks}
            kind="stacked"
            label="Aylık kaydedilen riskler, önem derecesine göre"
          />
        </ChartCard>

        <ChartCard
          title="Aylık kararlar"
          description="Karar tarihine göre, bugünkü durumlarıyla."
          legend={decisions}
          table={monthlyTable(trends.months, decisions, { total: true })}
        >
          <MonthlyChart
            months={trends.months}
            currentIndex={now}
            series={decisions}
            kind="stacked"
            label="Aylık kararlar, duruma göre"
          />
        </ChartCard>
      </div>
    </div>
  );
}
