import { describe, expect, it } from 'vitest';
import {
  DEFAULT_APPLICATION_LIST_STATE,
  countActiveFilters,
  parseApplicationListParams,
  serializeApplicationListParams,
  toApplicationListQuery,
} from './applicationListParams';

describe('applicationListParams', () => {
  it('returns defaults for an empty URL', () => {
    expect(parseApplicationListParams(new URLSearchParams())).toEqual(
      DEFAULT_APPLICATION_LIST_STATE,
    );
  });

  it('round-trips a fully populated state', () => {
    const state = {
      ...DEFAULT_APPLICATION_LIST_STATE,
      search: 'payment',
      lifecycle: 'active' as const,
      criticality: 'critical' as const,
      teamId: 'team-payments',
      technologyId: 'tech-oracle',
      businessUnitId: 'bu-finance',
      sort: { field: 'criticality' as const, direction: 'desc' as const },
      page: 2,
      pageSize: 50,
    };
    expect(parseApplicationListParams(serializeApplicationListParams(state))).toEqual(state);
  });

  it('uses 1-based page numbers in the URL', () => {
    const params = serializeApplicationListParams({ ...DEFAULT_APPLICATION_LIST_STATE, page: 1 });
    expect(params.get('page')).toBe('2');
  });

  it('omits defaults to keep shared links short', () => {
    expect(serializeApplicationListParams(DEFAULT_APPLICATION_LIST_STATE).toString()).toBe('');
  });

  it('discards invalid values instead of failing', () => {
    const state = parseApplicationListParams(
      new URLSearchParams('lifecycle=unknown&criticality=extreme&sort=password&page=-3&size=7'),
    );
    expect(state.lifecycle).toBeNull();
    expect(state.criticality).toBeNull();
    expect(state.sort).toEqual(DEFAULT_APPLICATION_LIST_STATE.sort);
    expect(state.page).toBe(0);
    expect(state.pageSize).toBe(DEFAULT_APPLICATION_LIST_STATE.pageSize);
  });

  it('maps single-choice filters to repository query arrays', () => {
    const query = toApplicationListQuery({
      ...DEFAULT_APPLICATION_LIST_STATE,
      lifecycle: 'deprecated',
    });
    expect(query.lifecycles).toEqual(['deprecated']);
    expect(query).not.toHaveProperty('criticalities');
  });

  it('counts active filters but not sorting or paging', () => {
    expect(
      countActiveFilters({ ...DEFAULT_APPLICATION_LIST_STATE, search: 'x', teamId: 't', page: 3 }),
    ).toBe(2);
  });
});
