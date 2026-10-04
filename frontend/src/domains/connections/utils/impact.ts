import type { ApplicationId } from '@/domains/applications/types';
import { CRITICALITIES, type Criticality } from '@/domains/shared/types';
import type { ApplicationDependency } from '../types';

/**
 * `downstream` — applications affected if the start application fails (they depend on it,
 * directly or transitively). `upstream` — applications the start application needs.
 */
export type ImpactDirection = 'downstream' | 'upstream';

export interface ImpactNode {
  applicationId: ApplicationId;
  /** 1 = direct relationship. */
  depth: number;
  /**
   * Weakest criticality along the shortest path: a chain is only as strong as its least critical
   * link, so a critical dependency reached through a low one is reported as low.
   */
  pathCriticality: Criticality;
  /** Application ids from the start (exclusive) to this node (inclusive). */
  path: ApplicationId[];
}

const rank = (value: Criticality) => CRITICALITIES.indexOf(value);
const weaker = (a: Criticality, b: Criticality) => (rank(a) <= rank(b) ? a : b);

/** Breadth-first traversal over the dependency graph; each application appears once (shortest path). */
export function analyseImpact(
  dependencies: readonly ApplicationDependency[],
  startId: ApplicationId,
  direction: ImpactDirection,
): ImpactNode[] {
  const edges = new Map<ApplicationId, ApplicationDependency[]>();
  for (const dependency of dependencies) {
    const from =
      direction === 'upstream' ? dependency.sourceApplicationId : dependency.targetApplicationId;
    edges.set(from, [...(edges.get(from) ?? []), dependency]);
  }

  const visited = new Set<ApplicationId>([startId]);
  const result: ImpactNode[] = [];
  let frontier: { id: ApplicationId; path: ApplicationId[]; criticality: Criticality | null }[] = [
    { id: startId, path: [], criticality: null },
  ];

  for (let depth = 1; frontier.length > 0; depth += 1) {
    const next: typeof frontier = [];
    for (const node of frontier) {
      for (const edge of edges.get(node.id) ?? []) {
        const neighbour =
          direction === 'upstream' ? edge.targetApplicationId : edge.sourceApplicationId;
        if (visited.has(neighbour)) continue;
        visited.add(neighbour);
        const criticality = node.criticality
          ? weaker(node.criticality, edge.criticality)
          : edge.criticality;
        const path = [...node.path, neighbour];
        result.push({ applicationId: neighbour, depth, pathCriticality: criticality, path });
        next.push({ id: neighbour, path, criticality });
      }
    }
    frontier = next;
  }

  return result.sort(
    (a, b) => a.depth - b.depth || rank(b.pathCriticality) - rank(a.pathCriticality),
  );
}
