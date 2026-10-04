import { DetailTabs } from '@/components/layout/DetailTabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTabParam } from '@/hooks/useTabParam';
import { DependencyRegister, IntegrationRegister } from '../components/ConnectionRegisters';
import { ImpactAnalysis } from '../components/ImpactAnalysis';

const TABS = [
  { id: 'impact', label: 'Etki analizi' },
  { id: 'dependencies', label: 'Bağımlılıklar' },
  { id: 'integrations', label: 'Entegrasyonlar' },
] as const;
const TAB_IDS = TABS.map((tab) => tab.id);

export default function ConnectionsPage() {
  const [activeTab, selectTab] = useTabParam(TAB_IDS);
  return (
    <div className="c-stack">
      <PageHeader
        title="Bağlantılar"
        subtitle="Portföydeki uygulamaların birbirine nasıl bağımlı olduğu ve nasıl konuştuğu."
      />
      <DetailTabs
        label="Bağlantı görünümleri"
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
