import { Field, Switch } from '@takeoff-ui/react-spar';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { FilterSelect } from '@/components/forms/FilterSelect';
import { Toolbar } from '@/components/layout/Toolbar';
import { useBusinessUnitOptions } from '@/domains/business-units/api/queries';
import { parseId } from '@/lib/urlParams';
import { usePortfolioMap } from '../api/queries';
import {
  boundsOf,
  buildGraph,
  forceLayout,
  LINK_KINDS,
  neighbourhood,
  type LinkKind,
  type Point,
} from '../utils/portfolioGraph';
import { MapCanvas } from './MapCanvas';
import { MapDetails } from './MapDetails';

const KIND_LABELS: Record<LinkKind, string> = {
  dependency: 'Bağımlılıklar',
  integration: 'Entegrasyonlar',
  impact: 'Projeler',
};
const WIDTH = 1000;
const HEIGHT = 640;

/**
 * The portfolio map: applications and projects as a network. Selecting a node lights up what it
 * touches (one or two steps away) and lists those links beside the map. Selection, depth and
 * filters live in the URL, so a view can be shared.
 */
export function PortfolioMapTab() {
  const query = usePortfolioMap();
  const units = useBusinessUnitOptions();
  const [params, setParams] = useSearchParams();
  const hidden = new Set((params.get('hide') ?? '').split(',').filter(Boolean));
  const kinds = new Set(LINK_KINDS.filter((kind) => !hidden.has(kind)));
  const businessUnitId = parseId(params.get('bu'));
  const showIsolated = params.get('isolated') === '1';
  const depth: 1 | 2 = params.get('depth') === '2' ? 2 : 1;
  const focusParam = params.get('focus');

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
  };

  const kindsKey = [...kinds].join(',');
  const graph = useMemo(
    () =>
      query.data
        ? buildGraph(query.data, {
            kinds: new Set(kindsKey.split(',').filter(Boolean) as LinkKind[]),
            businessUnitId,
            showIsolated,
          })
        : { nodes: [], edges: [] },
    [query.data, kindsKey, businessUnitId, showIsolated],
  );
  const fitKey = `${graph.nodes.map((n) => n.key).join()}|${graph.edges.length}`;
  const layout = useMemo(() => forceLayout(graph, { width: WIDTH, height: HEIGHT }), [graph]);
  const bounds = useMemo(() => boundsOf(layout.values(), 70), [layout]);
  const [moved, setMoved] = useState<{ key: string; points: Map<string, Point> }>({
    key: '',
    points: new Map(),
  });
  // Nodes the user dragged keep their place until the visible graph changes.
  const positions = useMemo(
    () => new Map([...layout, ...(moved.key === fitKey ? moved.points : [])]),
    [layout, moved, fitKey],
  );

  const focus = focusParam && graph.nodes.some((n) => n.key === focusParam) ? focusParam : null;
  const highlight = focus ? neighbourhood(graph, focus, depth) : null;
  const focusNode = focus ? graph.nodes.find((n) => n.key === focus) : undefined;

  if (query.isPending) return <LoadingState label="Bağlantı haritası yükleniyor" rows={8} />;
  if (query.isError) {
    return (
      <ErrorState title="Bağlantı haritası yüklenemedi" onRetry={() => void query.refetch()} />
    );
  }

  const options = graph.nodes
    .map((n) => ({
      value: n.key,
      label: `${n.kind === 'application' ? 'Uygulama' : 'Proje'}: ${n.name}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'tr'));
  const applications = graph.nodes.filter((n) => n.kind === 'application').length;

  return (
    <div className="c-stack c-stack--s">
      <Toolbar
        label="Haritayı filtrele"
        end={
          <span className="c-muted">
            {applications} uygulama · {graph.nodes.length - applications} proje ·{' '}
            {graph.edges.length} bağlantı
          </span>
        }
      >
        <FilterSelect
          label="Kayda odaklan"
          allLabel="Seçim yok"
          value={focus}
          options={options}
          onChange={(value) => set({ focus: value })}
        />
        <FilterSelect
          label="İş birimi"
          allLabel="Tüm iş birimleri"
          value={businessUnitId}
          options={units}
          onChange={(value) => set({ bu: value })}
        />
        {LINK_KINDS.map((kind) => (
          <Field key={kind} className="c-filter-switch">
            <Field.Label>{KIND_LABELS[kind]}</Field.Label>
            <Switch
              checked={kinds.has(kind)}
              onChange={(on: boolean) => {
                const next = new Set(hidden);
                if (on) next.delete(kind);
                else next.add(kind);
                set({ hide: [...next].join(',') });
              }}
            >
              <Switch.Indicator />
            </Switch>
          </Field>
        ))}
        <Field className="c-filter-switch">
          <Field.Label>Bağlantısızlar</Field.Label>
          <Switch
            checked={showIsolated}
            onChange={(on: boolean) => set({ isolated: on ? '1' : null })}
          >
            <Switch.Indicator />
          </Switch>
        </Field>
      </Toolbar>
      <ul className="c-map-legend" aria-label="Harita açıklaması">
        <li>
          <span className="c-map-legend__dot c-map-tone--danger" aria-hidden="true" />
          Uygulama (renk: kritiklik, boyut: bağlantı sayısı)
        </li>
        <li>
          <span className="c-map-legend__diamond" aria-hidden="true" />
          Proje (çerçeve: sağlık)
        </li>
        <li>
          <span className="c-map-legend__line c-map-legend__line--dependency" aria-hidden="true" />
          Bağımlılık (ok: bağımlı olunan)
        </li>
        <li>
          <span className="c-map-legend__line c-map-legend__line--integration" aria-hidden="true" />
          Entegrasyon (ok: veri yönü)
        </li>
        <li>
          <span className="c-map-legend__line c-map-legend__line--impact" aria-hidden="true" />
          Projenin etkilediği uygulama
        </li>
      </ul>
      {graph.nodes.length === 0 ? (
        <EmptyState
          title="Gösterilecek bağlantı yok"
          description="Bağlantı türlerini açın, iş birimi filtresini kaldırın ya da bağlantısız kayıtları gösterin."
        />
      ) : (
        <div className={`c-map-layout${focusNode ? ' has-details' : ''}`}>
          <MapCanvas
            graph={graph}
            positions={positions}
            focus={focus}
            highlight={highlight}
            fitKey={fitKey}
            bounds={bounds}
            onSelect={(key) => set({ focus: key })}
            onMove={(key, point) =>
              setMoved((current) => ({
                key: fitKey,
                points: new Map([...(current.key === fitKey ? current.points : []), [key, point]]),
              }))
            }
          />
          {focusNode ? (
            <MapDetails
              graph={graph}
              node={focusNode}
              depth={depth}
              reached={highlight?.nodes.size ?? 1}
              onDepth={(value) => set({ depth: value === 2 ? '2' : null })}
              onSelect={(key) => set({ focus: key })}
            />
          ) : (
            <p className="c-muted c-map-hint">
              Bir uygulamaya veya projeye tıklayın: dokunduğu kayıtlar vurgulanır, bağlantıları
              burada listelenir. Arka planı sürükleyerek kaydırın, tekerlekle yakınlaştırın,
              düğümleri sürükleyerek yerini değiştirin.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
