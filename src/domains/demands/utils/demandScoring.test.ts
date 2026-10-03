import { describe, expect, it } from 'vitest';
import { demands } from '@/services/mock/data/demands';
import { DEM } from '@/services/mock/data/ids';
import type { Demand } from '../types';
import { compareBacklog, priorityScore, suggestedPriority } from './demandScoring';

const seed = (id: number) => demands.find((d) => d.id === id) as Demand;

describe('demand scoring', () => {
  it('divides the cost of delay by the effort, to one decimal', () => {
    expect(
      priorityScore({
        businessValue: 4,
        strategicFit: 4,
        timeCriticality: 3,
        riskReduction: 1,
        effort: 2,
      }),
    ).toBe(6);
    expect(
      priorityScore({
        businessValue: 5,
        strategicFit: 5,
        timeCriticality: 3,
        riskReduction: 2,
        effort: 4,
      }),
    ).toBe(3.8);
  });

  it('has no score until every criterion is scored', () => {
    expect(
      priorityScore({
        businessValue: 5,
        strategicFit: 5,
        timeCriticality: 5,
        riskReduction: 5,
        effort: null,
      }),
    ).toBeNull();
    expect(suggestedPriority(null)).toBeNull();
  });

  it('suggests a priority from the thresholds', () => {
    expect(suggestedPriority(20)).toBe('p1');
    expect(suggestedPriority(8)).toBe('p1');
    expect(suggestedPriority(7.9)).toBe('p2');
    expect(suggestedPriority(3)).toBe('p3');
    expect(suggestedPriority(0.8)).toBe('p4');
  });

  it('ranks by decided priority, then score, then regulatory, then age', () => {
    const ranked = [
      seed(DEM.expenseOcr),
      seed(DEM.serviceChatbot),
      seed(DEM.walletBoardingPass),
      seed(DEM.eInvoiceRegulation),
      seed(DEM.crewFatigueDashboard),
    ]
      .sort(compareBacklog)
      .map((d) => d.id);
    expect(ranked).toEqual([
      DEM.eInvoiceRegulation, // P1
      DEM.walletBoardingPass, // P2
      DEM.expenseOcr, // P3
      DEM.crewFatigueDashboard, // no priority, score 5
      DEM.serviceChatbot, // no priority, score 3.8
    ]);
  });
});
