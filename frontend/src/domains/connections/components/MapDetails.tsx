import { Button } from '@takeoff-ui/react-spar';
import { paths } from '@/app/router/paths';
import { ButtonLink } from '@/components/actions/ButtonLink';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import type { MasterDataListKey } from '@/domains/master-data/types';
import type { Graph, GraphEdge, GraphNode } from '../utils/portfolioGraph';

interface MapDetailsProps {
  graph: Graph;
  node: GraphNode;
  depth: 1 | 2;
  onDepth: (depth: 1 | 2) => void;
  onSelect: (key: string | null) => void;
  /** Nodes reached within `depth` steps (the highlighted part of the map). */
  reached: number;
}

interface Group {
  title: string;
  list: MasterDataListKey;
  items: { edge: GraphEdge; other: GraphNode }[];
}

/** What the selected application or project touches, grouped by kind and direction. */
export function MapDetails({ graph, node, depth, onDepth, onSelect, reached }: MapDetailsProps) {
  const byKey = new Map(graph.nodes.map((n) => [n.key, n]));
  const touching = graph.edges.filter((e) => e.from === node.key || e.to === node.key);
  const group = (
    title: string,
    list: MasterDataListKey,
    test: (e: GraphEdge) => boolean,
  ): Group => ({
    title,
    list,
    items: touching.filter(test).flatMap((edge) => {
      const other = byKey.get(edge.from === node.key ? edge.to : edge.from);
      return other ? [{ edge, other }] : [];
    }),
  });
  const groups: Group[] =
    node.kind === 'application'
      ? [
          group(
            'Bağımlı olduğu uygulamalar',
            'dependencyTypes',
            (e) => e.kind === 'dependency' && e.from === node.key,
          ),
          group(
            'Ona bağımlı uygulamalar',
            'dependencyTypes',
            (e) => e.kind === 'dependency' && e.to === node.key,
          ),
          group(
            'Veri gönderdiği uygulamalar',
            'integrationTypes',
            (e) => e.kind === 'integration' && e.from === node.key,
          ),
          group(
            'Veri aldığı uygulamalar',
            'integrationTypes',
            (e) => e.kind === 'integration' && e.to === node.key,
          ),
          group('Onu değiştiren projeler', 'applicationImpactTypes', (e) => e.kind === 'impact'),
        ]
      : [group('Etkilediği uygulamalar', 'applicationImpactTypes', (e) => e.kind === 'impact')];

  return (
    <aside className="c-map-details" aria-label="Seçilen kayıt">
      <div className="c-map-details__head">
        <span className="c-muted">
          {node.kind === 'application' ? 'Uygulama' : 'Proje'} · {node.code}
        </span>
        <h3 className="c-map-details__title">{node.name}</h3>
        <div className="c-inline-list">
          {node.kind === 'application' ? (
            <>
              <MasterBadge
                list="criticalities"
                code={node.record.criticality}
                format={(l) => `Kritiklik: ${l}`}
              />
              <MasterBadge
                list="applicationLifecycles"
                code={node.record.lifecycle}
                context="Yaşam döngüsü:"
              />
            </>
          ) : (
            <>
              <MasterBadge list="projectStatuses" code={node.record.status} context="Durum:" />
              <MasterBadge list="projectHealths" code={node.record.health} context="Sağlık:" />
            </>
          )}
        </div>
      </div>
      <div className="c-map-details__actions">
        <ButtonLink
          to={
            node.kind === 'application'
              ? paths.applications.detail(node.id)
              : paths.projects.detail(node.id)
          }
          size="small"
          variant="neutral"
          appearance="outlined"
        >
          {node.kind === 'application' ? 'Uygulamayı aç' : 'Projeyi aç'}
        </ButtonLink>
        <Button size="small" variant="neutral" appearance="text" onClick={() => onSelect(null)}>
          Seçimi kaldır
        </Button>
      </div>
      <div className="c-segmented" role="group" aria-label="Gösterilen derinlik">
        {([1, 2] as const).map((value) => (
          <Button
            key={value}
            size="small"
            variant={depth === value ? 'primary' : 'neutral'}
            appearance={depth === value ? 'filled' : 'outlined'}
            aria-pressed={depth === value}
            onClick={() => onDepth(value)}
          >
            {value === 1 ? 'Doğrudan bağlantılar' : '2. derece'}
          </Button>
        ))}
      </div>
      <p className="c-muted c-map-details__summary">
        {touching.length} doğrudan bağlantı · haritada {reached - 1} kayıt vurgulandı
      </p>
      {groups
        .filter((g) => g.items.length > 0)
        .map((g) => (
          <section key={g.title} className="c-map-details__group">
            <h4 className="c-map-details__group-title">
              {g.title} <span className="c-muted">({g.items.length})</span>
            </h4>
            <ul className="c-map-details__list">
              {g.items.map(({ edge, other }) => (
                <li key={edge.key}>
                  <button
                    type="button"
                    className="c-map-details__item"
                    onClick={() => onSelect(other.key)}
                  >
                    <span className="c-map-details__name">{other.name}</span>
                    <span className="c-muted c-map-details__meta">
                      {edge.link.kind === 'integration' && `${edge.link.name} · `}
                      <MasterLabel list={g.list} code={edge.link.type} />
                      {edge.link.kind === 'dependency' && (
                        <>
                          {' · '}
                          <MasterLabel list="criticalities" code={edge.link.criticality} />
                        </>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      {touching.length === 0 && (
        <p className="c-muted">Seçili filtrelerle bu kaydın görünen bağlantısı yok.</p>
      )}
    </aside>
  );
}
