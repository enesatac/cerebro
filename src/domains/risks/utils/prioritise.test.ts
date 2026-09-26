import { describe, expect, it } from 'vitest';
import { prioritise } from './prioritise';

describe('prioritise', () => {
  it('puts active items first, then higher severity first', () => {
    const items = [
      { id: 'closed-critical', severity: 'critical' as const, active: false },
      { id: 'open-low', severity: 'low' as const, active: true },
      { id: 'open-high', severity: 'high' as const, active: true },
    ];
    expect(prioritise(items, (i) => i.active).map((i) => i.id)).toEqual([
      'open-high',
      'open-low',
      'closed-critical',
    ]);
  });
});
