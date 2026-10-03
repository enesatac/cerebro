import { AddIconOutlinedRounded } from '@takeoff-icons/react/add';
import { FlagIconOutlinedRounded } from '@takeoff-icons/react/flag';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { ButtonLink } from '@/components/actions/ButtonLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { DetailTabs } from '@/components/layout/DetailTabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { useCurrentUser } from '@/domains/auth/api/queries';
import { Can } from '@/domains/auth/components/Can';
import { usePeopleById } from '@/domains/people/api/queries';
import { useTabParam } from '@/hooks/useTabParam';
import { useDemands } from '../api/queries';
import { DemandFilterBar } from '../components/DemandFilterBar';
import { DemandTable } from '../components/DemandTable';
import { ownsDemand } from '../utils/demandAccess';
import {
  countDemandFilters,
  filterDemands,
  parseDemandFilters,
  withDemandFilters,
  type DemandFilters,
} from '../utils/demandFilters';

const TAB_IDS = ['mine', 'all'] as const;

const STEPS = [
  ['Gönderin', 'İhtiyacı, faydayı ve tarihi yazın; varsa belgeleri ekleyin.'],
  ['Değerlendirme', 'Portföy ofisi puanlar; gerekirse sizden bilgi ister.'],
  ['Karar', 'Onay veya ret, gerekçesiyle birlikte bu sayfada görünür.'],
  ['Takvim', 'Onaylanan talep bir çeyreğe planlanır veya projeye dönüşür.'],
] as const;

/**
 * Where business units raise demands and follow them. Everyone sees every demand (to spot
 * duplicates and see what is coming); "Taleplerim" shows the ones the viewer raised or entered.
 */
export default function DemandsPage() {
  const user = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const [tab, selectTab] = useTabParam(TAB_IDS);
  const filters = parseDemandFilters(params);
  const update = (patch: Partial<DemandFilters>) =>
    setParams(withDemandFilters(params, patch), { replace: true });

  const demands = useDemands();
  const people = usePeopleById();
  const mine = useMemo(
    () => (demands.data ?? []).filter((demand) => ownsDemand(user, demand)),
    [demands.data, user],
  );
  const source = tab === 'mine' ? mine : (demands.data ?? []);
  const shown = filterDemands(source, filters, (id) => people.data?.get(id)?.fullName);
  const filtered = countDemandFilters(filters) > 0;

  const panel = () => {
    if (demands.isPending) return <LoadingState label="Talepler yükleniyor" rows={6} />;
    if (demands.isError) {
      return <ErrorState title="Talepler yüklenemedi" onRetry={() => void demands.refetch()} />;
    }
    return (
      <div className="c-stack c-stack--s">
        <DemandFilterBar
          filters={filters}
          onChange={update}
          shown={shown}
          exportTitle={tab === 'mine' ? 'Taleplerim' : 'Talepler'}
        />
        <DemandTable
          demands={shown}
          emptyState={
            filtered ? (
              <EmptyState compact title="Bu filtrelere uyan talep yok" />
            ) : tab === 'mine' ? (
              <EmptyState
                compact
                title="Henüz talep açmadınız"
                description="Yeni bir proje, uygulama veya geliştirme ihtiyacınız varsa talep açın."
                action={
                  <Can permission="demands:submit">
                    <ButtonLink to={paths.demands.create()}>Yeni talep</ButtonLink>
                  </Can>
                }
              />
            ) : (
              <EmptyState compact title="Henüz talep yok" />
            )
          }
        />
      </div>
    );
  };

  return (
    <div className="c-stack">
      <PageHeader
        title="Talepler"
        subtitle="Proje, uygulama ve geliştirme ihtiyaçlarınızı buradan iletin; değerlendirme ve takvim kararlarını buradan izleyin."
        actions={
          <>
            <Can permission="demands:manage">
              <ButtonLink
                to={paths.demands.manage()}
                variant="neutral"
                appearance="outlined"
                startContent={<FlagIconOutlinedRounded aria-hidden="true" />}
              >
                Talep yönetimi
              </ButtonLink>
            </Can>
            <Can permission="demands:submit">
              <ButtonLink
                to={paths.demands.create()}
                startContent={<AddIconOutlinedRounded aria-hidden="true" />}
              >
                Yeni talep
              </ButtonLink>
            </Can>
          </>
        }
      />
      <ol className="c-process" aria-label="Talep süreci">
        {STEPS.map(([title, text], index) => (
          <li key={title} className="c-process__step">
            <span className="c-process__number" aria-hidden="true">
              {index + 1}
            </span>
            <span>
              <strong>{title}</strong>
              <span className="c-muted c-process__text">{text}</span>
            </span>
          </li>
        ))}
      </ol>
      <SectionCard title="Talepler">
        <DetailTabs
          label="Talep listeleri"
          tabs={[
            { id: 'mine', label: 'Taleplerim', count: demands.data ? mine.length : null },
            {
              id: 'all',
              label: 'Tüm talepler',
              count: demands.data ? demands.data.length : null,
            },
          ]}
          active={tab}
          onSelect={selectTab}
          renderPanel={panel}
        />
      </SectionCard>
    </div>
  );
}
