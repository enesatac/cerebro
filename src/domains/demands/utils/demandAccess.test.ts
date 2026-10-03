import { describe, expect, it } from 'vitest';
import { demands } from '@/services/mock/data/demands';
import { DEM, PERSON } from '@/services/mock/data/ids';
import type { Demand } from '../types';
import { canAttachToDemand, canEditDemand, canWithdrawDemand } from './demandAccess';

const seed = (id: number) => demands.find((d) => d.id === id) as Demand;
const elif = { role: 'user', active: true, personId: PERSON.elifKaya } as const;
const admin = { role: 'admin', active: true, personId: PERSON.canOzturk } as const;

describe('demand access', () => {
  it('lets requesters change their demand only before a decision', () => {
    expect(canEditDemand(elif, seed(DEM.notificationPreferences))).toBe(true);
    expect(canEditDemand(elif, seed(DEM.walletBoardingPass))).toBe(false);
    expect(canEditDemand(elif, seed(DEM.cargoTracking))).toBe(false);
    expect(canEditDemand(admin, seed(DEM.walletBoardingPass))).toBe(true);
  });

  it('lets requesters withdraw and attach to open demands only', () => {
    expect(canWithdrawDemand(elif, seed(DEM.walletBoardingPass))).toBe(true);
    expect(canWithdrawDemand(elif, seed(DEM.loyaltyMobile))).toBe(false);
    expect(canAttachToDemand(elif, seed(DEM.walletBoardingPass))).toBe(true);
    expect(canAttachToDemand(elif, seed(DEM.loyaltyMobile))).toBe(false);
    expect(canAttachToDemand(admin, seed(DEM.loyaltyMobile))).toBe(true);
  });

  it('gives nothing to signed-out or inactive viewers', () => {
    expect(canEditDemand(null, seed(DEM.notificationPreferences))).toBe(false);
    expect(canWithdrawDemand({ ...elif, active: false }, seed(DEM.notificationPreferences))).toBe(
      false,
    );
  });
});
