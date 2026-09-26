import { describe, expect, it } from 'vitest';
import type { ApplicationDependency } from '../types';
import { analyseImpact } from './impact';

const audit = {
  createdAt: '',
  createdBy: '',
  updatedAt: '',
  updatedBy: '',
  lastReviewedAt: null,
  lastReviewedBy: null,
};
const dep = (
  source: string,
  target: string,
  criticality: ApplicationDependency['criticality'],
): ApplicationDependency => ({
  id: `${source}->${target}`,
  sourceApplicationId: source,
  targetApplicationId: target,
  type: 'runtime',
  criticality,
  description: '',
  audit,
});

// portal → gateway → identity ; batch → gateway ; identity → notify ; cycle: notify → identity
const graph = [
  dep('portal', 'gateway', 'critical'),
  dep('gateway', 'identity', 'high'),
  dep('batch', 'gateway', 'low'),
  dep('identity', 'notify', 'medium'),
  dep('notify', 'identity', 'low'),
];

describe('analyseImpact', () => {
  it('finds direct and transitive dependents (downstream)', () => {
    const result = analyseImpact(graph, 'identity', 'downstream');
    expect(result.map((n) => [n.applicationId, n.depth])).toEqual([
      ['gateway', 1],
      ['notify', 1],
      ['portal', 2],
      ['batch', 2],
    ]);
  });

  it('uses the weakest criticality along the path', () => {
    const result = analyseImpact(graph, 'identity', 'downstream');
    expect(result.find((n) => n.applicationId === 'portal')?.pathCriticality).toBe('high');
    expect(result.find((n) => n.applicationId === 'batch')?.pathCriticality).toBe('low');
  });

  it('records the path from the start application', () => {
    const portal = analyseImpact(graph, 'identity', 'downstream').find(
      (n) => n.applicationId === 'portal',
    );
    expect(portal?.path).toEqual(['gateway', 'portal']);
  });

  it('follows dependencies the other way (upstream)', () => {
    expect(analyseImpact(graph, 'portal', 'upstream').map((n) => n.applicationId)).toEqual([
      'gateway',
      'identity',
      'notify',
    ]);
  });

  it('terminates on cycles and never includes the start application', () => {
    const result = analyseImpact(graph, 'notify', 'upstream');
    expect(result.map((n) => n.applicationId)).toEqual(['identity']);
  });

  it('returns nothing for an isolated application', () => {
    expect(analyseImpact(graph, 'unknown', 'downstream')).toEqual([]);
  });
});
