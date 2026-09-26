import { QueryView } from '@/components/feedback/QueryView';
import { DetailTabs } from '@/components/layout/DetailTabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTabParam } from '@/hooks/useTabParam';
import { useApplicationHealthReport } from '../api/queries';
import { DataQualityReport } from '../components/DataQualityReport';
import { TechnologyRiskReport } from '../components/TechnologyRiskReport';

const TABS = [
  { id: 'data-quality', label: 'Data quality' },
  { id: 'technology-risk', label: 'Technology risk' },
] as const;
const TAB_IDS = TABS.map((tab) => tab.id);

export default function ReportsPage() {
  const [activeTab, selectTab] = useTabParam(TAB_IDS);
  const query = useApplicationHealthReport();
  return (
    <div className="c-stack">
      <PageHeader
        title="Reports"
        subtitle="Governance views across all applications: where information is missing, stale or at risk."
      />
      <QueryView
        query={query}
        loadingLabel="Building reports"
        errorTitle="Reports could not be built"
      >
        {(rows) => (
          <DetailTabs
            label="Reports"
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
