import { Button } from '@takeoff-ui/react-spar';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useMasterData } from '@/domains/master-data/context';
import { type Graph, type GraphEdge, type GraphNode, type Point } from '../utils/portfolioGraph';

interface MapCanvasProps {
  graph: Graph;
  positions: ReadonlyMap<string, Point>;
  /** Selected node; its neighbourhood is highlighted, the rest dimmed. */
  focus: string | null;
  highlight: { nodes: ReadonlySet<string>; edges: ReadonlySet<string> } | null;
  onSelect: (key: string | null) => void;
  onMove: (key: string, point: Point) => void;
  /** Changes when the visible graph changes, to fit the view again. */
  fitKey: string;
  /** The whole laid-out graph, padded: the "fit" view. */
  bounds: View;
}

interface View {
  x: number;
  y: number;
  width: number;
  height: number;
}

const radiusOf = (node: GraphNode) =>
  node.kind === 'project' ? 13 + Math.min(node.degree, 8) : 9 + Math.min(node.degree, 10) * 1.3;

const EDGE_LABELS = {
  dependency: 'bağımlı',
  integration: 'entegrasyon',
  impact: 'etkiler',
} as const;

function edgePath(edge: GraphEdge, from: Point, to: Point, toRadius: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(Math.hypot(dx, dy), 0.01);
  // stop at the target's rim so the arrow head stays visible
  const end = {
    x: to.x - (dx / length) * toRadius,
    y: to.y - (dy / length) * toRadius,
  };
  if (edge.kind !== 'integration') return `M${from.x},${from.y} L${end.x},${end.y}`;
  // integrations bend, so they stay apart from a dependency between the same two applications
  const bend = Math.min(40, length / 5);
  const mx = (from.x + end.x) / 2 - (dy / length) * bend;
  const my = (from.y + end.y) / 2 + (dx / length) * bend;
  return `M${from.x},${from.y} Q${mx},${my} ${end.x},${end.y}`;
}

/**
 * The portfolio as a network: applications as circles (coloured by criticality, larger with more
 * links), projects as diamonds; dependencies as arrows, integrations as dashed curves, project
 * impacts as dotted lines. Drag the background to pan, the wheel or buttons to zoom, a node to
 * move it; click a node (or press Enter on it) to see what it touches.
 */
export function MapCanvas({
  graph,
  positions,
  focus,
  highlight,
  onSelect,
  onMove,
  fitKey,
  bounds: fitted,
}: MapCanvasProps) {
  const masterData = useMasterData();
  const svg = useRef<SVGSVGElement>(null);
  // Nodes and labels keep their size on screen whatever the zoom: one screen pixel in map units.
  const [screen, setScreen] = useState({ width: 900, height: 600 });
  useEffect(() => {
    const element = svg.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) {
        setScreen({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  // The view (pan and zoom) belongs to one graph; a new graph starts from the fitted view.
  const [state, setState] = useState<{ key: string; view: View }>({ key: fitKey, view: fitted });
  const view = state.key === fitKey ? state.view : fitted;
  const setView = (next: View | ((current: View) => View)) =>
    setState((current) => {
      const base = current.key === fitKey ? current.view : fitted;
      return { key: fitKey, view: typeof next === 'function' ? next(base) : next };
    });
  const drag = useRef<{
    kind: 'pan' | 'node';
    key?: string;
    start: Point;
    origin: View;
    moved: boolean;
  } | null>(null);

  const toSvg = (clientX: number, clientY: number): Point => {
    const element = svg.current;
    const matrix = element?.getScreenCTM();
    if (!element || !matrix) return { x: clientX, y: clientY };
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
    return { x: point.x, y: point.y };
  };

  const zoom = (factor: number, around?: Point) => {
    setView((v) => {
      const width = Math.min(Math.max(v.width * factor, 120), fitted.width * 4);
      const height = (width / v.width) * v.height;
      const c = around ?? { x: v.x + v.width / 2, y: v.y + v.height / 2 };
      return {
        x: c.x - ((c.x - v.x) * width) / v.width,
        y: c.y - ((c.y - v.y) * height) / v.height,
        width,
        height,
      };
    });
  };

  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    // React's onWheel is passive; zooming must stop the page from scrolling.
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const matrix = element.getScreenCTM();
      const around = matrix
        ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
        : undefined;
      zoom(event.deltaY > 0 ? 1.12 : 1 / 1.12, around ? { x: around.x, y: around.y } : undefined);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  });

  const onPointerDown = (event: ReactPointerEvent, key?: string) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    drag.current = {
      kind: key ? 'node' : 'pan',
      key,
      start: { x: event.clientX, y: event.clientY },
      origin: view,
      moved: false,
    };
  };
  const onPointerMove = (event: ReactPointerEvent) => {
    const current = drag.current;
    if (!current) return;
    const dx = event.clientX - current.start.x;
    const dy = event.clientY - current.start.y;
    if (!current.moved && Math.hypot(dx, dy) < 4) return;
    current.moved = true;
    if (current.kind === 'node' && current.key) {
      onMove(current.key, toSvg(event.clientX, event.clientY));
    } else {
      const scale = current.origin.width / (svg.current?.clientWidth || 1);
      setView({
        ...current.origin,
        x: current.origin.x - dx * scale,
        y: current.origin.y - dy * scale,
      });
    }
  };
  const onPointerUp = () => {
    const current = drag.current;
    drag.current = null;
    if (!current || current.moved) return;
    onSelect(current.kind === 'node' ? (current.key ?? null) : null);
  };

  // `meet` fits the view box by its tighter side; one screen pixel is this many map units.
  const unit = Math.max(view.width / screen.width, view.height / Math.max(screen.height, 1));
  const dim = (key: string, set: 'nodes' | 'edges') =>
    highlight && !highlight[set].has(key) ? ' is-dim' : '';
  const byKey = new Map(graph.nodes.map((node) => [node.key, node]));

  return (
    <div className="c-map">
      <div className="c-map__zoom" role="group" aria-label="Yakınlaştırma">
        <Button size="small" variant="neutral" appearance="outlined" onClick={() => zoom(1 / 1.3)}>
          +
        </Button>
        <Button size="small" variant="neutral" appearance="outlined" onClick={() => zoom(1.3)}>
          −
        </Button>
        <Button
          size="small"
          variant="neutral"
          appearance="outlined"
          onClick={() => setView(fitted)}
        >
          Sığdır
        </Button>
      </div>
      <svg
        ref={svg}
        className="c-map__svg"
        viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label="Uygulama ve proje bağlantı haritası"
        onPointerDown={(event) => onPointerDown(event)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={(event) => event.key === 'Escape' && onSelect(null)}
      >
        <defs>
          {['base', 'hot'].map((tone) => (
            <marker
              key={tone}
              id={`c-map-arrow-${tone}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerUnits="userSpaceOnUse"
              markerWidth={8 * unit}
              markerHeight={8 * unit}
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className={`c-map__arrow c-map__arrow--${tone}`} />
            </marker>
          ))}
        </defs>
        <g>
          {graph.edges.map((edge) => {
            const from = positions.get(edge.from);
            const to = positions.get(edge.to);
            const target = byKey.get(edge.to);
            if (!from || !to || !target) return null;
            const hot = highlight?.edges.has(edge.key) ?? false;
            return (
              <path
                key={edge.key}
                d={edgePath(edge, from, to, (radiusOf(target) + 4) * unit)}
                className={`c-map__edge c-map__edge--${edge.kind}${hot ? ' is-hot' : ''}${dim(edge.key, 'edges')}`}
                markerEnd={
                  edge.kind === 'impact' ? undefined : `url(#c-map-arrow-${hot ? 'hot' : 'base'})`
                }
              >
                <title>{EDGE_LABELS[edge.kind]}</title>
              </path>
            );
          })}
        </g>
        <g>
          {graph.nodes.map((node) => {
            const p = positions.get(node.key);
            if (!p) return null;
            const r = radiusOf(node) * unit;
            const variant =
              node.kind === 'application'
                ? masterData.badge('criticalities', node.record.criticality).variant
                : masterData.badge('projectHealths', node.record.health).variant;
            const label =
              node.kind === 'application'
                ? `Uygulama ${node.name}, kritiklik ${masterData.label('criticalities', node.record.criticality)}, ${node.degree} bağlantı`
                : `Proje ${node.name}, ${masterData.label('projectHealths', node.record.health)}, ${node.degree} uygulama`;
            return (
              <g
                key={node.key}
                transform={`translate(${p.x} ${p.y})`}
                className={`c-map__node c-map__node--${node.kind} c-map-tone--${variant}${focus === node.key ? ' is-focus' : ''}${dim(node.key, 'nodes')}`}
                role="button"
                tabIndex={0}
                aria-label={label}
                aria-pressed={focus === node.key}
                onPointerDown={(event) => onPointerDown(event, node.key)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(node.key);
                  }
                }}
              >
                {node.kind === 'application' ? (
                  <circle r={r} className="c-map__shape" />
                ) : (
                  <rect
                    x={-r}
                    y={-r}
                    width={r * 2}
                    height={r * 2}
                    rx={3}
                    transform="rotate(45)"
                    className="c-map__shape"
                  />
                )}
                <text
                  y={r + 13 * unit}
                  className="c-map__label"
                  style={{ fontSize: `${12 * unit}px`, strokeWidth: `${3 * unit}px` }}
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
