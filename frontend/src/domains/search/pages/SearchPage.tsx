import { useSearchParams } from 'react-router';
import { EntityLink } from '@/components/data-display/EntityLink';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { pluralize } from '@/lib/format';
import { useSearch } from '../api/queries';
import { SEARCHABLE_KINDS } from '../types';
import { SEARCHABLE_KIND_LABELS, searchResultHref } from '../utils/searchPresentation';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const term = searchParams.get('q')?.trim() ?? '';
  const query = useSearch({ term, limit: 50 });

  return (
    <div className="c-stack">
      <PageHeader
        title="Arama"
        subtitle={
          term
            ? `“${term}” için sonuçlar`
            : "Cerebro'da herhangi bir şeyi bulmak için yukarıdaki arama kutusunu kullanın."
        }
      />
      {term && (
        <QueryView query={query} loadingLabel="Aranıyor" errorTitle="Arama başarısız oldu">
          {(results) =>
            results.length === 0 ? (
              <EmptyState
                title={`“${term}” ile eşleşen bir şey yok`}
                description="Arama; uygulama ve proje adlarını, kodlarını, açıklamalarını ve etiketlerini, ayrıca ekipleri, kişileri ve teknolojileri kapsar."
              />
            ) : (
              <>
                <p className="c-muted" aria-live="polite">
                  {pluralize(results.length, 'sonuç')}
                </p>
                {SEARCHABLE_KINDS.map((kind) => {
                  const group = results.filter((result) => result.kind === kind);
                  if (group.length === 0) return null;
                  return (
                    <SectionCard
                      key={kind}
                      title={`${SEARCHABLE_KIND_LABELS[kind]} (${group.length})`}
                    >
                      <ul className="c-result-list">
                        {group.map((result) => (
                          <li key={`${result.kind}-${result.id}`} className="c-result-list__item">
                            <EntityLink to={searchResultHref(result)}>{result.title}</EntityLink>
                            <span className="c-muted"> · {result.subtitle}</span>
                            {result.description && (
                              <p className="c-result-list__description">{result.description}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </SectionCard>
                  );
                })}
              </>
            )
          }
        </QueryView>
      )}
    </div>
  );
}
