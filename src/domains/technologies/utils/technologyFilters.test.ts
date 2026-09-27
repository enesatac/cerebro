import { describe, expect, it } from 'vitest';
import type { TechnologyListItem } from '../types';
import {
  filterTechnologies,
  parseTechnologyFilters,
  serializeTechnologyFilters,
} from './technologyFilters';

const tech = (
  id: number,
  name: string,
  category: TechnologyListItem['category'],
  status: TechnologyListItem['status'],
) =>
  ({
    id,
    name,
    category,
    status,
    description: '',
    applicationCount: 0,
    activeApplicationCount: 0,
  }) satisfies TechnologyListItem;

const catalogue = [
  tech(1, 'Java', 'backend', 'preferred'),
  tech(2, 'IBM MQ', 'messaging', 'deprecated'),
  tech(3, 'Kafka', 'messaging', 'preferred'),
];

describe('technologyFilters', () => {
  it('combines search, category and status', () => {
    const result = filterTechnologies(catalogue, {
      search: '',
      category: 'messaging',
      status: 'deprecated',
    });
    expect(result.map((t) => t.name)).toEqual(['IBM MQ']);
  });

  it('searches case-insensitively', () => {
    expect(
      filterTechnologies(catalogue, { search: 'KAF', category: null, status: null }).map(
        (t) => t.id,
      ),
    ).toEqual([3]);
  });

  it('round-trips through the URL and drops invalid values', () => {
    const state = { search: 'java', category: 'backend' as const, status: 'preferred' as const };
    expect(parseTechnologyFilters(serializeTechnologyFilters(state))).toEqual(state);
    expect(parseTechnologyFilters(new URLSearchParams('status=legacy')).status).toBeNull();
  });
});
