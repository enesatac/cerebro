import { DetailTabs } from '@/components/layout/DetailTabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { useSearchParams } from 'react-router';
import { useTabParam } from '@/hooks/useTabParam';
import { DependencyRegister, IntegrationRegister } from '../components/ConnectionRegisters';
import { ImpactAnalysis } from '../components/ImpactAnalysis';
import { PortfolioMapTab } from '../components/PortfolioMapTab';

const TABS = [
  { id: 'map', label: 'Bağlantı haritası' },
  { id: 'impact', label: 'Etki analizi' },
  { id: 'dependencies', label: 'Bağımlılıklar' },
  { id: 'integrations', label: 'Entegrasyonlar' },
] as const;
const TAB_IDS = TABS.map((tab) => tab.id);

export default function ConnectionsPage() {
  const [tab, selectTab] = useTabParam(TAB_IDS);
  const [params] = useSearchParams();
  // Links from before the map (`/architecture?app=3`) still open that application's impact analysis.
  const activeTab = params.has('app') && !params.has('tab') ? 'impact' : tab;
  return (
    <div className="c-stack">
      <PageHeader
        title="Bağlantılar"
        subtitle="Uygulamaların birbirine nasıl bağımlı olduğu, nasıl konuştuğu ve hangi projelerin onlara dokunduğu."
      />
      <DetailTabs
        label="Bağlantı görünümleri"
        tabs={TABS}
        active={activeTab}
        onSelect={selectTab}
        renderPanel={(tab) =>
          tab === 'map' ? (
            <PortfolioMapTab />
          ) : tab === 'impact' ? (
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
