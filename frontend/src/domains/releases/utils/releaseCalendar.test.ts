import { describe, expect, it } from 'vitest';
import type { Release } from '../types';
import {
  awaitsOutcome,
  calendarRows,
  isOvernight,
  releaseMetrics,
  releaseWindow,
} from './releaseCalendar';

const release = (overrides: Partial<Release>): Release => ({
  id: 1,
  releaseNumber: 'CHG-1',
  title: 'Geçiş',
  applicationId: 1,
  projectId: null,
  type: 'minor',
  status: 'planned',
  plannedDate: '2026-10-10',
  startTime: '',
  endTime: '',
  version: '',
  ownerId: null,
  serviceInterruption: false,
  description: '',
  rollbackPlan: '',
  outcomeNote: '',
  audit: {
    createdAt: '2026-10-01T00:00:00Z',
    createdBy: null,
    updatedAt: '2026-10-01T00:00:00Z',
    updatedBy: null,
    lastReviewedAt: null,
    lastReviewedBy: null,
  },
  ...overrides,
});

describe('release calendar', () => {
  it('describes the window, including windows past midnight', () => {
    expect(releaseWindow(release({}))).toBe('Saat belirtilmedi');
    expect(releaseWindow(release({ startTime: '14:00' }))).toBe('14:00');
    expect(releaseWindow(release({ startTime: '14:00', endTime: '15:00' }))).toBe('14:00 – 15:00');
    const overnight = release({ startTime: '23:00', endTime: '02:00' });
    expect(isOvernight(overnight)).toBe(true);
    expect(releaseWindow(overnight)).toBe('23:00 – 02:00 (+1 gün)');
  });

  it('groups releases into rows by application or project, unassigned last', () => {
    const releases = [
      release({ id: 1, applicationId: 2, projectId: 5 }),
      release({ id: 2, applicationId: 1, projectId: null, plannedDate: '2026-10-11' }),
      release({ id: 3, applicationId: 2, projectId: 5 }),
    ];
    const names = new Map([
      [1, 'Zeta'],
      [2, 'Alfa'],
      [5, 'Proje'],
    ]);
    const byApp = calendarRows(releases, 'application', (id) => names.get(id) ?? '');
    expect(byApp.map((r) => [r.name, r.count])).toEqual([
      ['Alfa', 2],
      ['Zeta', 1],
    ]);
    expect(byApp[0]?.byDay.get('2026-10-10')).toHaveLength(2);
    const byProject = calendarRows(releases, 'project', (id) => names.get(id) ?? '');
    expect(byProject.map((r) => r.name)).toEqual(['Proje', 'Projesiz geçişler']);
  });

  it('counts what is coming and what still needs an outcome', () => {
    const today = '2026-10-05';
    const releases = [
      release({ id: 1, plannedDate: '2026-10-06', serviceInterruption: true }),
      release({ id: 2, plannedDate: '2026-10-20', status: 'approved' }),
      release({ id: 3, plannedDate: '2026-10-01', status: 'completed' }),
      release({ id: 4, plannedDate: '2026-10-02', status: 'rolled-back' }),
      release({ id: 5, plannedDate: '2026-10-03', status: 'approved' }),
      release({ id: 6, plannedDate: '2026-10-07', status: 'cancelled' }),
    ];
    expect(awaitsOutcome(releases[4] as Release, today)).toBe(true);
    expect(releaseMetrics(releases, today)).toEqual({
      nextSevenDays: 1,
      upcoming: 2,
      withInterruption: 1,
      completed: 1,
      rolledBack: 1,
      awaitingOutcome: 1,
    });
  });
});
