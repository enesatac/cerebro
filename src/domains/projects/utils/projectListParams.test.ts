import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROJECT_LIST_STATE,
  parseProjectListParams,
  serializeProjectListParams,
  toProjectListQuery,
} from './projectListParams';

describe('projectListParams', () => {
  it('round-trips state through the URL', () => {
    const state = {
      ...DEFAULT_PROJECT_LIST_STATE,
      search: 'loyalty',
      status: 'in-progress' as const,
      health: 'at-risk' as const,
      teamId: 'team-commerce',
      sort: { field: 'plannedEndDate' as const, direction: 'desc' as const },
      page: 1,
    };
    expect(parseProjectListParams(serializeProjectListParams(state))).toEqual(state);
  });

  it('ignores invalid enum values', () => {
    const state = parseProjectListParams(new URLSearchParams('status=done&health=ok'));
    expect(state.status).toBeNull();
    expect(state.health).toBeNull();
  });

  it('maps to a repository query', () => {
    expect(
      toProjectListQuery({ ...DEFAULT_PROJECT_LIST_STATE, health: 'critical' }).healths,
    ).toEqual(['critical']);
  });
});
