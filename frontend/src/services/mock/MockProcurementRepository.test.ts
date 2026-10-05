import { describe, expect, it } from 'vitest';
import type { ProcurementStepDraft } from '@/domains/procurement/types';
import { ForbiddenError, NotFoundError, type ValidationError } from '@/lib/errors';
import { createMockRepositories } from './index';
import { CON, PERSON, USER } from './data/ids';

const step = (overrides: Partial<ProcurementStepDraft> = {}): ProcurementStepDraft => ({
  id: null,
  type: 'need-definition',
  status: 'not-started',
  ownerId: PERSON.zeynepCelik,
  plannedStart: '2026-10-01',
  plannedEnd: '2026-10-10',
  actualStart: null,
  actualEnd: null,
  note: '',
  ...overrides,
});

const rejection = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('expected a rejection');
    },
    (error: unknown) => error as ValidationError,
  );

describe('procurement repository', () => {
  it('lists every contract as a purchase without commercial terms', async () => {
    const { procurement, contracts } = createMockRepositories({ signedInAs: USER.canOzturk });
    const purchases = await procurement.list();
    expect(purchases).toHaveLength((await contracts.list()).length);
    const booking = purchases.find((p) => p.contractId === CON.bookingMigration);
    expect(booking?.steps.length).toBeGreaterThan(0);
    expect(booking).not.toHaveProperty('totalValue');
  });

  it('shows internal notes only to the procurement team', async () => {
    const office = createMockRepositories({ signedInAs: USER.zeynepCelik });
    const unit = createMockRepositories({ signedInAs: USER.elifKaya });
    const full = await office.procurement.getById(CON.bookingMigration);
    const shared = await unit.procurement.getById(CON.bookingMigration);
    expect(full.notes.some((n) => n.internal)).toBe(true);
    expect(shared.notes.some((n) => n.internal)).toBe(false);
    expect(shared.noteCount).toBe(shared.notes.length);
  });

  it('lets business units read but not change the process', async () => {
    const { procurement } = createMockRepositories({ signedInAs: USER.elifKaya });
    await expect(procurement.list()).resolves.not.toHaveLength(0);
    await expect(procurement.saveSteps(CON.uxResearch, [step()])).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      procurement.addNote(CON.uxResearch, { text: 'Not', internal: false }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('replaces the steps in order and keeps stored ids', async () => {
    const { procurement } = createMockRepositories({ signedInAs: USER.zeynepCelik });
    const before = await procurement.getById(CON.bookingMigration);
    const [first, second] = before.steps;
    if (!first || !second) throw new Error('seed has steps');
    const saved = await procurement.saveSteps(CON.bookingMigration, [
      second,
      first,
      step({ type: 'invoicing' }),
    ]);
    expect(saved.steps.map((s) => s.id)).toEqual([second.id, first.id, expect.any(Number)]);
    expect(saved.steps[2]?.type).toBe('invoicing');
  });

  it('validates dates, statuses and foreign step ids', async () => {
    const { procurement } = createMockRepositories({ signedInAs: USER.zeynepCelik });
    const late = await rejection(
      procurement.saveSteps(CON.uxResearch, [step({ plannedEnd: '2026-09-01' })]),
    );
    expect(late.message).toBe('Planlanan bitiş başlangıçtan önce olamaz.');
    expect(late.field).toBe('steps.0.plannedEnd');
    const done = await rejection(procurement.saveSteps(CON.uxResearch, [step({ status: 'done' })]));
    expect(done.field).toBe('steps.0.actualEnd');
    const unknown = await rejection(
      procurement.saveSteps(CON.uxResearch, [step({ status: 'lost' })]),
    );
    expect(unknown.field).toBe('steps');
    const other = (await procurement.getById(CON.bookingMigration)).steps[0];
    await expect(
      procurement.saveSteps(CON.uxResearch, [step({ id: other?.id ?? 0 })]),
    ).rejects.toThrow();
  });

  it('adds and removes notes, refusing credentials', async () => {
    const { procurement } = createMockRepositories({ signedInAs: USER.zeynepCelik });
    const note = await procurement.addNote(CON.uxResearch, {
      text: '  Teklifler 20 Ekim’de açılacak.  ',
      internal: true,
    });
    expect(note).toMatchObject({ text: 'Teklifler 20 Ekim’de açılacak.', internal: true });
    expect(note.authorId).toBe(PERSON.zeynepCelik);
    expect((await procurement.getById(CON.uxResearch)).notes[0]?.id).toBe(note.id);
    await procurement.removeNote(note.id);
    expect((await procurement.getById(CON.uxResearch)).notes).not.toContainEqual(note);
    const secret = await rejection(
      procurement.addNote(CON.uxResearch, { text: 'password: Hunter2!', internal: false }),
    );
    expect(secret.field).toBe('text');
    await expect(procurement.getById(99_999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('deletes the process with its contract', async () => {
    const { procurement, contracts } = createMockRepositories({ signedInAs: USER.canOzturk });
    const impact = await contracts.getDeletionImpact(CON.bookingMigration);
    expect(impact.references.map((r) => r.label).join(' ')).toContain('satın alma adımı');
    await contracts.remove(CON.bookingMigration);
    await expect(procurement.getById(CON.bookingMigration)).rejects.toBeInstanceOf(NotFoundError);
  });
});
