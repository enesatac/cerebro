import { DetailTabs } from '@/components/layout/DetailTabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTabParam } from '@/hooks/useTabParam';
import { DependencyRegister, IntegrationRegister } from '../components/ConnectionRegisters';
import { ImpactAnalysis } from '../components/ImpactAnalysis';

const TABS = [
  { id: 'impact', label: 'Impact analysis' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'integrations', label: 'Integrations' },
] as const;
const TAB_IDS = TABS.map((tab) => tab.id);

export default function ConnectionsPage() {
  const [activeTab, selectTab] = useTabParam(TAB_IDS);
  return (
    <div className="c-stack">
      <PageHeader
        title="Connections"
        subtitle="How applications depend on and talk to each other across the portfolio."
      />
      <DetailTabs
        label="Connection views"
        tabs={TABS}
        active={activeTab}
        onSelect={selectTab}
        renderPanel={(tab) =>
          tab === 'impact' ? (
            <ImpactAnalysis />
          ) : tab === 'dependencies' ? (
            <DependencyRegister />
          ) : (
            <IntegrationRegister />
          )
        }
      />
    </div>
  );
}
