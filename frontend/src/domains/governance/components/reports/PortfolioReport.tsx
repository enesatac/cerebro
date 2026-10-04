import { paths } from '@/app/router/paths';
import { CategoryBars, type CategoryBarItem } from '@/components/charts/CategoryBars';
import { SINGLE_SERIES_COLOR } from '@/components/charts/chartColors';
import { ChartCard } from '@/components/charts/ChartCard';
import { MonthlyChart } from '@/components/charts/MonthlyChart';
import { StatTile } from '@/components/data-display/StatTile';
import { formatMonthYear } from '@/lib/dates';
import type { PortfolioTrends } from '../../types';
import { barsTable, monthlyTable, useCoded } from './reportSeries';

const at = (values: readonly (number | null)[], index: number) =>
  index >= 0 ? (values[index] ?? 0) : 0;

/** What is running and what the portfolio is made of. */
export function PortfolioReport({ trends }: { trends: PortfolioTrends }) {
  const projectStatus = useCoded('projectStatuses');
  const projectHealth = useCoded('projectHealths');
  const lifecycle = useCoded('applicationLifecycles');
  const criticality = useCoded('criticalities');
  const milestones = useCoded('milestoneStatuses');

  const now = trends.currentMonthIndex;
  const active = [
    {
      key: 'active',
      label: 'Aktif projeler',
      color: SINGLE_SERIES_COLOR,
      values: trends.activeProjects,
    },
  ];
  const lastPlanned = trends.activeProjects.length - 1;
  const milestoneSeries = milestones.series(trends.milestonesByStatus);
  const statusBars = projectStatus.bars(trends.projectsByStatus, (status) =>
    paths.projects.list({ status }),
  );
  const healthBars = projectHealth.bars(trends.projectsByHealth, (health) =>
    paths.projects.list({ health }),
  );
  const lifecycleBars = lifecycle.bars(trends.applicationsByLifecycle, (code) =>
    paths.applications.list({ lifecycle: code }),
  );
  const criticalityBars = criticality.bars(trends.applicationsByCriticality, (code) =>
    paths.applications.list({ criticality: code }),
  );
  const unitBars: CategoryBarItem[] = trends.applicationsByBusinessUnit.map((c) => ({
    key: c.key,
    label: c.label ?? c.key,
    value: c.value,
    to: c.key === '0' ? undefined : paths.applications.list({ bu: Number(c.key) }),
  }));
  const technologyBars: CategoryBarItem[] = trends.topTechnologies.map((c) => ({
    key: c.key,
    label: c.label ?? c.key,
    value: c.value,
    to: paths.applications.list({ technology: Number(c.key) }),
  }));
  const liveApplications = trends.applicationsByLifecycle
    .filter((c) => c.key !== 'retired')
    .reduce((sum, c) => sum + c.value, 0);
  const missed = trends.milestonesByStatus.find((s) => s.key === 'missed');

  return (
    <div className="c-stack">
      <div className="c-stat-grid" role="group" aria-label="Portföy özeti">
        <StatTile
          label="Bu ay aktif proje"
          value={at(trends.activeProjects, now)}
          detail="çalışan veya başlayan"
          to={paths.projects.list({ status: 'in-progress' })}
        />
        <StatTile
          label="Canlı uygulama"
          value={liveApplications}
          detail="emekli olanlar hariç"
          to={paths.applications.list()}
        />
        <StatTile
          label="Bu ay teslim"
          value={milestoneSeries.reduce((sum, s) => sum + at(s.values, now), 0)}
          detail="kilometre taşı"
        />
        <StatTile
          label="Kaçırılan kilometre taşı"
          value={(missed?.values ?? []).reduce<number>((sum, v) => sum + (v ?? 0), 0)}
          detail="seçili dönemde"
          tone={(missed?.values ?? []).some((v) => (v ?? 0) > 0) ? 'warning' : 'default'}
        />
      </div>

      <div className="c-chart-grid">
        <div className="c-chart-grid__wide">
          <ChartCard
            title="Aylık aktif proje sayısı"
            description="Başlangıç ve bitiş tarihleri o aya denk gelen projeler. Bugünden sonrası plan."
            headline={
              <>
                <strong>{at(trends.activeProjects, now)}</strong> proje bu ay aktif
                {lastPlanned > now && now >= 0 && (
                  <span className="c-muted">
                    {' '}
                    · {formatMonthYear(trends.months[lastPlanned] ?? '')} planı:{' '}
                    {trends.activeProjects[lastPlanned]}
                  </span>
                )}
              </>
            }
            table={monthlyTable(trends.months, active)}
          >
            <MonthlyChart
              months={trends.months}
              currentIndex={now}
              series={active}
              kind="line"
              label="Aylık aktif proje sayısı"
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Kilometre taşları"
          description="Teslim tarihi o aya düşen kilometre taşları, durumlarına göre."
          legend={milestoneSeries}
          table={monthlyTable(trends.months, milestoneSeries, { total: true })}
        >
          <MonthlyChart
            months={trends.months}
            currentIndex={now}
            series={milestoneSeries}
            kind="stacked"
            label="Aylık kilometre taşları, duruma göre"
          />
        </ChartCard>

        <ChartCard
          title="Projeler — duruma göre"
          description="Bugünkü durum. Bir satıra tıklayarak listeye gidin."
          table={barsTable(statusBars, 'Durum')}
        >
          <CategoryBars items={statusBars} label="Projeler, duruma göre" />
        </ChartCard>

        <ChartCard
          title="Projeler — sağlığa göre"
          description="İptal edilmemiş projelerin bugünkü sağlık durumu."
          table={barsTable(healthBars, 'Sağlık')}
        >
          <CategoryBars items={healthBars} label="Projeler, sağlığa göre" />
        </ChartCard>

        <ChartCard
          title="Uygulamalar — yaşam döngüsüne göre"
          table={barsTable(lifecycleBars, 'Yaşam döngüsü')}
        >
          <CategoryBars items={lifecycleBars} label="Uygulamalar, yaşam döngüsüne göre" />
        </ChartCard>

        <ChartCard
          title="Uygulamalar — kritikliğe göre"
          description="Emekli olanlar hariç."
          table={barsTable(criticalityBars, 'Kritiklik')}
        >
          <CategoryBars items={criticalityBars} label="Uygulamalar, kritikliğe göre" />
        </ChartCard>

        <ChartCard title="İş birimine göre uygulamalar" table={barsTable(unitBars, 'İş birimi')}>
          <CategoryBars items={unitBars} label="Uygulamalar, iş birimine göre" />
        </ChartCard>

        <ChartCard
          title="En çok kullanılan teknolojiler"
          description="Kaç canlı uygulamada kullanıldığı (ilk 10)."
          table={barsTable(technologyBars, 'Teknoloji')}
        >
          <CategoryBars items={technologyBars} label="En çok kullanılan teknolojiler" />
        </ChartCard>
      </div>
    </div>
  );
}
