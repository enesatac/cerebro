import { describe, expect, it } from 'vitest';
import { demands } from '@/services/mock/data/demands';
import { DEM } from '@/services/mock/data/ids';
import { formatQuarterRange, quarterOf, quartersFrom } from './quarters';
import { buildRoadmap } from './roadmap';

describe('quarters', () => {
  it('finds the quarter of a date with its bounds', () => {
    expect(quarterOf('2026-10-03')).toMatchObject({
      id: '2026-Q4',
      start: '2026-10-01',
      end: '2026-12-31',
      label: '2026 Ç4',
    });
    expect(quarterOf('2027-05-31')).toMatchObject({ start: '2027-04-01', end: '2027-06-30' });
  });

  it('lists consecutive quarters across a year end', () => {
    expect(quartersFrom('2026-11-15', 3).map((q) => q.label)).toEqual([
      '2026 Ç4',
      '2027 Ç1',
      '2027 Ç2',
    ]);
  });

  it('formats a planned range compactly', () => {
    expect(formatQuarterRange('2027-01-11', '2027-03-31')).toBe('2027 Ç1');
    expect(formatQuarterRange('2027-02-01', '2027-11-30')).toBe('2027 Ç1 – Ç4');
    expect(formatQuarterRange('2026-10-12', '2027-02-01')).toBe('2026 Ç4 – 2027 Ç1');
  });
});

describe('roadmap', () => {
  it('puts approved demands first and scheduled ones in their start quarter', () => {
    const lanes = buildRoadmap(demands, '2026-10-03', 4);
    const ids = Object.fromEntries(lanes.map((lane) => [lane.id, lane.demands.map((d) => d.id)]));
    expect(lanes.map((lane) => lane.label)).toEqual([
      'Takvim bekleyen',
      '2026 Ç4',
      '2027 Ç1',
      '2027 Ç2',
      '2027 Ç3',
      'Daha sonra',
    ]);
    expect(ids.unscheduled).toEqual([DEM.logConsolidation, DEM.expenseOcr]);
    expect(ids['2026-Q4']).toEqual([DEM.eInvoiceRegulation]);
    expect(ids['2027-Q1']).toEqual([DEM.walletBoardingPass, DEM.maintenancePlanning]);
    expect(lanes.find((lane) => lane.id === '2027-Q1')?.effort).toBe(7);
  });
});
