import { describe, expect, it } from 'vitest';
import type { PortfolioMap } from '../types';
import { boundsOf, buildGraph, forceLayout, LINK_KINDS, neighbourhood } from './portfolioGraph';

const app = (id: number, businessUnitId: number | null = 1) => ({
  id,
  code: `A${id}`,
  name: `Uygulama ${id}`,
  lifecycle: 'active',
  criticality: 'high',
  businessUnitId,
});
const map: PortfolioMap = {
  applications: [app(1), app(2), app(3, 2), app(4, 2), app(5)],
  projects: [
    { id: 1, code: 'P1', name: 'Proje', status: 'active', health: 'green', businessUnitId: 2 },
  ],
  links: [
    {
      kind: 'dependency',
      id: 1,
      fromApplicationId: 1,
      toApplicationId: 2,
      type: 'runtime',
      criticality: 'high',
    },
    {
      kind: 'integration',
      id: 1,
      fromApplicationId: 2,
      toApplicationId: 3,
      name: 'Olaylar',
      type: 'event',
    },
    { kind: 'impact', id: 1, projectId: 1, applicationId: 3, type: 'modified' },
    {
      kind: 'dependency',
      id: 2,
      fromApplicationId: 3,
      toApplicationId: 4,
      type: 'runtime',
      criticality: 'low',
    },
  ],
};
const all = { kinds: new Set(LINK_KINDS), businessUnitId: null, showIsolated: false };

describe('portfolio graph', () => {
  it('joins projects to applications and leaves unlinked records out unless asked', () => {
    const graph = buildGraph(map, all);
    expect(graph.nodes.map((n) => n.key)).toEqual(['a-1', 'a-2', 'a-3', 'a-4', 'p-1']);
    expect(graph.edges.find((e) => e.kind === 'impact')).toMatchObject({ from: 'p-1', to: 'a-3' });
    expect(graph.nodes.find((n) => n.key === 'a-3')?.degree).toBe(3);
    expect(buildGraph(map, { ...all, showIsolated: true }).nodes).toHaveLength(6);
  });

  it('filters by link kind and by business unit, keeping what the unit links to', () => {
    const noProjects = buildGraph(map, {
      ...all,
      kinds: new Set(['dependency', 'integration'] as const),
    });
    expect(noProjects.nodes.map((n) => n.key)).not.toContain('p-1');
    const unit = buildGraph(map, { ...all, businessUnitId: 2 });
    expect(unit.nodes.map((n) => n.key).sort()).toEqual(['a-2', 'a-3', 'a-4', 'p-1']);
    expect(unit.edges.map((e) => e.key)).not.toContain('dependency-1');
  });

  it('finds what a node touches, one or two steps away', () => {
    const graph = buildGraph(map, all);
    const one = neighbourhood(graph, 'a-2', 1);
    expect([...one.nodes].sort()).toEqual(['a-1', 'a-2', 'a-3']);
    expect([...one.edges].sort()).toEqual(['dependency-1', 'integration-1']);
    const two = neighbourhood(graph, 'a-2', 2);
    expect([...two.nodes].sort()).toEqual(['a-1', 'a-2', 'a-3', 'a-4', 'p-1']);
  });

  it('lays nodes out deterministically, linked nodes closer than unlinked ones', () => {
    const graph = buildGraph(map, all);
    const first = forceLayout(graph, { width: 800, height: 600 });
    const second = forceLayout(graph, { width: 800, height: 600 });
    expect([...first.entries()]).toEqual([...second.entries()]);
    const distance = (a: string, b: string) => {
      const [p, q] = [first.get(a), first.get(b)];
      return p && q ? Math.hypot(p.x - q.x, p.y - q.y) : NaN;
    };
    expect(distance('a-1', 'a-2')).toBeLessThan(distance('a-1', 'a-4'));
    for (const p of first.values()) expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    const box = boundsOf(first.values(), 40);
    expect(box.width).toBeGreaterThan(80);
  });
});
