import type { EntityId } from '@/domains/shared/types';
import type { MapApplication, MapLink, MapProject, PortfolioMap } from '../types';

export type LinkKind = MapLink['kind'];
export const LINK_KINDS: readonly LinkKind[] = ['dependency', 'integration', 'impact'];

export type GraphNode =
  | {
      key: string;
      kind: 'application';
      id: EntityId;
      name: string;
      code: string;
      degree: number;
      record: MapApplication;
    }
  | {
      key: string;
      kind: 'project';
      id: EntityId;
      name: string;
      code: string;
      degree: number;
      record: MapProject;
    };

export interface GraphEdge {
  key: string;
  kind: LinkKind;
  /** Node keys; for dependencies the source depends on the target. */
  from: string;
  to: string;
  link: MapLink;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const applicationKey = (id: EntityId) => `a-${id}`;
export const projectKey = (id: EntityId) => `p-${id}`;

export interface GraphOptions {
  kinds: ReadonlySet<LinkKind>;
  /** Only this unit's applications and projects, plus whatever they link to. */
  businessUnitId: EntityId | null;
  /** Keep applications and projects without any visible link. */
  showIsolated: boolean;
}

const ends = (link: MapLink): [string, string] =>
  link.kind === 'impact'
    ? [projectKey(link.projectId), applicationKey(link.applicationId)]
    : [applicationKey(link.fromApplicationId), applicationKey(link.toApplicationId)];

/** The visible graph for the chosen link kinds and business unit. */
export function buildGraph(map: PortfolioMap, options: GraphOptions): Graph {
  const all = new Map<string, GraphNode>();
  for (const a of map.applications) {
    all.set(applicationKey(a.id), {
      key: applicationKey(a.id),
      kind: 'application',
      id: a.id,
      name: a.name,
      code: a.code,
      degree: 0,
      record: a,
    });
  }
  for (const p of map.projects) {
    all.set(projectKey(p.id), {
      key: projectKey(p.id),
      kind: 'project',
      id: p.id,
      name: p.name,
      code: p.code,
      degree: 0,
      record: p,
    });
  }
  let edges: GraphEdge[] = map.links
    .filter((link) => options.kinds.has(link.kind))
    .map((link) => {
      const [from, to] = ends(link);
      return { key: `${link.kind}-${link.id}`, kind: link.kind, from, to, link };
    })
    .filter((edge) => all.has(edge.from) && all.has(edge.to));

  let keep: Set<string>;
  if (options.businessUnitId !== null) {
    const inUnit = new Set(
      [...all.values()]
        .filter((node) => node.record.businessUnitId === options.businessUnitId)
        .map((node) => node.key),
    );
    edges = edges.filter((edge) => inUnit.has(edge.from) || inUnit.has(edge.to));
    keep = new Set([...inUnit, ...edges.flatMap((edge) => [edge.from, edge.to])]);
  } else {
    keep = new Set(all.keys());
  }
  const degree = new Map<string, number>();
  for (const edge of edges) {
    degree.set(edge.from, (degree.get(edge.from) ?? 0) + 1);
    degree.set(edge.to, (degree.get(edge.to) ?? 0) + 1);
  }
  const nodes = [...all.values()]
    .filter((node) => keep.has(node.key) && (options.showIsolated || degree.has(node.key)))
    .map((node) => ({ ...node, degree: degree.get(node.key) ?? 0 }));
  return { nodes, edges };
}

/** Nodes and edges within `depth` steps of `key`, links followed in both directions. */
export function neighbourhood(graph: Graph, key: string, depth: 1 | 2) {
  const nodes = new Set([key]);
  const edges = new Set<string>();
  let frontier = new Set([key]);
  for (let step = 0; step < depth; step += 1) {
    const next = new Set<string>();
    for (const edge of graph.edges) {
      if (frontier.has(edge.from) || frontier.has(edge.to)) {
        edges.add(edge.key);
        for (const end of [edge.from, edge.to]) if (!nodes.has(end)) next.add(end);
      }
    }
    for (const node of next) nodes.add(node);
    frontier = next;
  }
  return { nodes, edges };
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Force-directed layout (Fruchterman–Reingold): linked nodes pull together, all nodes push apart,
 * a weak pull keeps the graph centred. Deterministic — nodes start on a spiral in input order —
 * so the same portfolio always draws the same map.
 */
export function forceLayout(
  graph: Graph,
  { width, height, iterations = 300 }: { width: number; height: number; iterations?: number },
): Map<string, Point> {
  const n = graph.nodes.length;
  const cx = width / 2;
  const cy = height / 2;
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  const index = new Map(graph.nodes.map((node, i) => [node.key, i]));
  const spread = Math.sqrt(width * height) / 300;
  for (let i = 0; i < n; i += 1) {
    const angle = i * 2.399963; // golden angle: an even spiral
    const radius = 30 + 12 * Math.sqrt(i) * spread;
    xs[i] = cx + radius * Math.cos(angle);
    ys[i] = cy + radius * Math.sin(angle);
  }
  const links = graph.edges.flatMap((edge) => {
    const a = index.get(edge.from);
    const b = index.get(edge.to);
    return a === undefined || b === undefined ? [] : [[a, b] as const];
  });
  const k = Math.sqrt((width * height) / Math.max(n, 1)) * 0.75;
  let temperature = width / 8;
  const cool = temperature / (iterations + 1);
  const sx = new Float64Array(n);
  const sy = new Float64Array(n);
  const at = (array: Float64Array, i: number) => array[i] ?? 0;
  for (let iteration = 0; n > 1 && iteration < iterations; iteration += 1) {
    sx.fill(0);
    sy.fill(0);
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        let dx = at(xs, i) - at(xs, j);
        let dy = at(ys, i) - at(ys, j);
        let distance = Math.hypot(dx, dy);
        if (distance < 0.01) {
          dx = 0.01 * (i - j);
          dy = 0.01;
          distance = Math.hypot(dx, dy);
        }
        const force = (k * k) / distance;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        sx[i] = at(sx, i) + fx;
        sy[i] = at(sy, i) + fy;
        sx[j] = at(sx, j) - fx;
        sy[j] = at(sy, j) - fy;
      }
    }
    for (const [a, b] of links) {
      const dx = at(xs, a) - at(xs, b);
      const dy = at(ys, a) - at(ys, b);
      const distance = Math.max(Math.hypot(dx, dy), 0.01);
      const force = (distance * distance) / k;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      sx[a] = at(sx, a) - fx;
      sy[a] = at(sy, a) - fy;
      sx[b] = at(sx, b) + fx;
      sy[b] = at(sy, b) + fy;
    }
    for (let i = 0; i < n; i += 1) {
      // gravity towards the centre keeps unlinked groups on screen
      const gx = at(sx, i) + (cx - at(xs, i)) * 0.002 * k;
      const gy = at(sy, i) + (cy - at(ys, i)) * 0.002 * k;
      const length = Math.max(Math.hypot(gx, gy), 0.01);
      const step = Math.min(length, temperature);
      xs[i] = at(xs, i) + (gx / length) * step;
      ys[i] = at(ys, i) + (gy / length) * step;
    }
    temperature = Math.max(temperature - cool, 0.5);
  }
  return new Map(graph.nodes.map((node, i) => [node.key, { x: at(xs, i), y: at(ys, i) }]));
}

/** The box around all points, padded, as an SVG viewBox. */
export function boundsOf(points: Iterable<Point>, padding: number) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (minX === Infinity) return { x: 0, y: 0, width: 100, height: 100 };
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}
