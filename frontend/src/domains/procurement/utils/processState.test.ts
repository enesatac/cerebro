import { describe, expect, it } from 'vitest';
import type { ProcurementStep, ProcurementSummary } from '../types';
import {
  currentStep,
  delayDays,
  processState,
  progress,
  trackerMetrics,
  upcomingDeadlines,
} from './processState';

const TODAY = '2026-10-04';

const step = (overrides: Partial<ProcurementStep>): ProcurementStep => ({
  id: 1,
  type: 'rfq',
  status: 'not-started',
  ownerId: null,
  plannedStart: null,
  plannedEnd: null,
  actualStart: null,
  actualEnd: null,
  note: '',
  ...overrides,
});

const purchase = (code: string, steps: ProcurementStep[]): ProcurementSummary => ({
  contractId: 1,
  code,
  title: code,
  projectId: 1,
  businessUnitId: null,
  vendorName: '',
  contractStatus: 'draft',
  ownerId: null,
  steps,
  noteCount: 0,
  lastNoteAt: null,
});

describe('procurement process state', () => {
  it('reads the state from the steps', () => {
    expect(processState([], TODAY)).toBe('undefined');
    expect(processState([step({ plannedEnd: '2026-10-20' })], TODAY)).toBe('not-started');
    expect(
      processState(
        [step({ status: 'done', actualEnd: '2026-09-01' }), step({ status: 'skipped' })],
        TODAY,
      ),
    ).toBe('completed');
    expect(
      processState(
        [step({ status: 'in-progress', actualStart: '2026-10-01', plannedEnd: '2026-10-10' })],
        TODAY,
      ),
    ).toBe('in-progress');
    expect(processState([step({ status: 'in-progress', plannedEnd: '2026-09-30' })], TODAY)).toBe(
      'late',
    );
    // Blocked outranks late: it needs a decision, not just a push.
    expect(
      processState(
        [step({ status: 'blocked', plannedEnd: '2026-12-01' }), step({ plannedEnd: '2026-09-01' })],
        TODAY,
      ),
    ).toBe('blocked');
  });

  it('finds the current step and the progress', () => {
    const steps = [
      step({ id: 1, status: 'done', actualEnd: '2026-09-01' }),
      step({ id: 2, status: 'skipped' }),
      step({ id: 3, status: 'waiting' }),
      step({ id: 4 }),
    ];
    expect(currentStep(steps)?.id).toBe(3);
    expect(progress(steps)).toEqual({ closed: 2, total: 4 });
    expect(currentStep([step({ status: 'done', actualEnd: '2026-01-01' })])).toBeNull();
  });

  it('counts the delay against the planned end', () => {
    expect(
      delayDays(step({ status: 'done', plannedEnd: '2026-09-01', actualEnd: '2026-09-04' }), TODAY),
    ).toBe(3);
    expect(
      delayDays(step({ status: 'done', plannedEnd: '2026-09-05', actualEnd: '2026-09-03' }), TODAY),
    ).toBe(-2);
    expect(delayDays(step({ status: 'in-progress', plannedEnd: '2026-09-30' }), TODAY)).toBe(4);
    expect(delayDays(step({ plannedEnd: '2026-10-10' }), TODAY)).toBeNull();
  });

  it('lists the deadlines of the coming days, overdue first', () => {
    const list = [
      purchase('SZL-0002', [
        step({ id: 1, plannedEnd: '2026-10-15' }),
        step({ id: 2, status: 'done', plannedEnd: '2026-09-01', actualEnd: '2026-09-01' }),
      ]),
      purchase('SZL-0001', [
        step({ id: 3, plannedEnd: '2026-09-20' }),
        step({ id: 4, plannedEnd: '2026-11-30' }),
      ]),
    ];
    const deadlines = upcomingDeadlines(list, TODAY, 14);
    expect(deadlines.map((d) => [d.step.id, d.late])).toEqual([
      [3, true],
      [1, false],
    ]);
    expect(trackerMetrics(list, TODAY, 14)).toMatchObject({ running: 2, lateSteps: 1, dueSoon: 1 });
  });
});
