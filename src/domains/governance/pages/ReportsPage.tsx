import { QueryView } from '@/components/feedback/QueryView';
import { DetailTabs } from '@/components/layout/DetailTabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTabParam } from '@/hooks/useTabParam';
import { useApplicationHealthReport } from '../api/queries';
import { DataQualityReport } from '../components/DataQualityReport';
import { TechnologyRiskReport } from '../components/TechnologyRiskReport';

const TABS = [
  { id: 'data-quality', label: 'Veri kalitesi' },
  { id: 'technology-risk', label: 'Teknoloji riski' },
] as const;
const TAB_IDS = TABS.map((tab) => tab.id);

export default function ReportsPage() {
  const [activeTab, selectTab] = useTabParam(TAB_IDS);
  const query = useApplicationHealthReport();
  return (
    <div className="c-stack">
      <PageHeader
        title="Raporlar"
        subtitle="Tüm uygulamalar için yönetişim görünümleri: bilgilerin nerede eksik, eski veya riskli olduğu."
      />
      <QueryView
        query={query}
        loadingLabel="Raporlar hazırlanıyor"
        errorTitle="Raporlar hazırlanamadı"
      >
        {(rows) => (
          <DetailTabs
            label="Raporlar"
            tabs={TABS}
            active={activeTab}
            onSelect={selectTab}
            renderPanel={(tab) =>
              tab === 'data-quality' ? (
                <DataQualityReport rows={rows} />
              ) : (
                <TechnologyRiskReport rows={rows} />
              )
            }
          />
        )}
      </QueryView>
    </div>
  );
}
