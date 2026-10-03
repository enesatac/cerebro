import type { UserAccount } from '@/domains/auth/types';
import { hasPermission } from '@/domains/auth/utils/permissions';
import type { DemandRepository } from '@/domains/demands/api/DemandRepository';
import {
  DEMAND_SCORES,
  type Demand,
  type DemandAssessmentInput,
  type DemandInput,
  type DemandStatus,
} from '@/domains/demands/types';
import { canEditDemand, canWithdrawDemand } from '@/domains/demands/utils/demandAccess';
import type { EntityId } from '@/domains/shared/types';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { looksLikeSecret, NO_SECRETS_MESSAGE } from '@/lib/validation';
import { attachmentsOnlyImpact, deleteAttachmentsOf } from './cascade';
import type { MockDatabase } from './database';
import { assertCodeChecks, codeChecks } from './MockMasterDataRepository';
import { copy, delay, findOrThrow } from './query';
import { MockAuthority } from './session';
import { removeRow, replaceRow, type WriteKit } from './writeKit';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const LIMITS: Partial<Record<keyof DemandInput, number>> = {
  title: 200,
  problem: 4000,
  proposedSolution: 4000,
  expectedBenefits: 4000,
  deadlineReason: 500,
};

/** Status changes that need something recorded with them, and what to say when it is missing. */
function assertStatusRules(input: DemandAssessmentInput) {
  const { status } = input;
  const needsNote = status === 'rejected' || status === 'needs-info';
  if (needsNote && !input.decisionNote.trim()) {
    throw new ValidationError(
      status === 'rejected'
        ? 'Reddetmek için gerekçeyi yazın; talep sahibi bu notu görür.'
        : 'Talep sahibinden hangi bilgiyi beklediğinizi yazın.',
      'decisionNote',
    );
  }
  if (
    (status === 'approved' || status === 'scheduled' || status === 'converted') &&
    !input.priority
  ) {
    throw new ValidationError('Onaylanan talebin önceliğini belirleyin.', 'priority');
  }
  if (
    (status === 'scheduled' || status === 'converted') &&
    (!input.plannedStart || !input.plannedEnd)
  ) {
    throw new ValidationError(
      'Takvime almak için planlanan başlangıç ve bitişi girin.',
      'plannedStart',
    );
  }
  if (status === 'converted' && input.projectId === null) {
    throw new ValidationError('Talebin dönüştüğü projeyi seçin.', 'projectId');
  }
}

export function createMockDemandRepository(
  db: MockDatabase,
  latencyMs: number,
  kit: WriteKit,
): DemandRepository {
  const validateRequest = (input: DemandInput, previous?: Demand) => {
    if (!input.title.trim()) throw new ValidationError('Başlık zorunludur.', 'title');
    if (!input.problem.trim()) {
      throw new ValidationError('Mevcut durumu ve ihtiyacı yazın.', 'problem');
    }
    if (!input.expectedBenefits.trim()) {
      throw new ValidationError('Beklenen faydayı yazın.', 'expectedBenefits');
    }
    for (const [field, max] of Object.entries(LIMITS)) {
      const value = input[field as keyof DemandInput] as string;
      if (value.length > max) {
        throw new ValidationError(`En fazla ${max} karakter girilebilir.`, field);
      }
      if (looksLikeSecret(value)) throw new ValidationError(NO_SECRETS_MESSAGE, field);
    }
    kit.assertRefs([input.businessUnitId], db.businessUnits, 'iş birimi', 'businessUnitId');
    kit.assertRefs([input.requesterId], db.people, 'kişi', 'requesterId');
    kit.assertRefs([input.sponsorId], db.people, 'kişi', 'sponsorId');
    kit.assertRefs(
      input.relatedApplicationIds,
      db.applications,
      'uygulama',
      'relatedApplicationIds',
    );
    assertCodeChecks(db, codeChecks.demand(input), previous ? codeChecks.demand(previous) : []);
    if (input.desiredDate !== null && !ISO_DATE.test(input.desiredDate)) {
      throw new ValidationError('Geçerli bir tarih girin.', 'desiredDate');
    }
    for (const field of ['affectedUsers', 'estimatedBudget'] as const) {
      const value = input[field];
      if (value !== null && (!Number.isFinite(value) || value < 0)) {
        throw new ValidationError('Sıfır veya pozitif bir sayı girin.', field);
      }
    }
  };

  const validateAssessment = (input: DemandAssessmentInput, previous: Demand) => {
    for (const key of [
      'businessValue',
      'strategicFit',
      'timeCriticality',
      'riskReduction',
      'effort',
    ] as const) {
      const score = input[key];
      if (score !== null && !DEMAND_SCORES.includes(score)) {
        throw new ValidationError('Puanlar 1 ile 5 arasında olmalıdır.', key);
      }
    }
    kit.assertRefs([input.assessorId], db.people, 'kişi', 'assessorId');
    kit.assertRefs([input.projectId], db.projects, 'proje', 'projectId');
    assertCodeChecks(
      db,
      [
        { list: 'demandStatuses', codes: [input.status], field: 'status' },
        {
          list: 'demandPriorities',
          codes: input.priority ? [input.priority] : [],
          field: 'priority',
        },
      ],
      [
        { list: 'demandStatuses', codes: [previous.status], field: 'status' },
        {
          list: 'demandPriorities',
          codes: previous.assessment.priority ? [previous.assessment.priority] : [],
          field: 'priority',
        },
      ],
    );
    for (const field of ['plannedStart', 'plannedEnd'] as const) {
      const value = input[field];
      if (value !== null && !ISO_DATE.test(value)) {
        throw new ValidationError('Geçerli bir tarih girin.', field);
      }
    }
    if (input.plannedStart && input.plannedEnd && input.plannedEnd < input.plannedStart) {
      throw new ValidationError('Bitiş başlangıçtan önce olamaz.', 'plannedEnd');
    }
    if (looksLikeSecret(input.decisionNote)) {
      throw new ValidationError(NO_SECRETS_MESSAGE, 'decisionNote');
    }
    if (input.decisionNote.length > 2000) {
      throw new ValidationError('Not en fazla 2000 karakter olabilir.', 'decisionNote');
    }
    assertStatusRules(input);
  };

  const event = (user: UserAccount, status: DemandStatus, note: string) => ({
    id: kit.nextId('demandEvents'),
    at: kit.newAudit(user).createdAt,
    byId: MockAuthority.actorId(user),
    status,
    note: note.trim(),
  });

  const clean = (input: DemandInput): DemandInput => ({
    ...input,
    title: input.title.trim(),
    problem: input.problem.trim(),
    proposedSolution: input.proposedSolution.trim(),
    expectedBenefits: input.expectedBenefits.trim(),
    deadlineReason: input.deadlineReason.trim(),
    benefitTypes: [...new Set(input.benefitTypes)],
    relatedApplicationIds: [...new Set(input.relatedApplicationIds)],
  });

  return {
    async list() {
      await delay(latencyMs);
      return copy([...db.demands].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)));
    },

    getById: async (id) => (await delay(latencyMs), copy(findOrThrow(db.demands, id, 'Talep'))),

    async create(input) {
      const user = await kit.begin('demands:submit');
      validateRequest(input);
      const audit = kit.newAudit(user);
      const id = kit.nextId('demands');
      const demand: Demand = {
        ...clean(input),
        id,
        code: `TLP-${String(id).padStart(4, '0')}`,
        status: 'submitted',
        submittedAt: audit.createdAt,
        assessment: {
          businessValue: null,
          strategicFit: null,
          timeCriticality: null,
          riskReduction: null,
          effort: null,
          priority: null,
          assessorId: null,
          plannedStart: null,
          plannedEnd: null,
          decisionNote: '',
          projectId: null,
        },
        history: [event(user, 'submitted', '')],
        audit,
      };
      db.demands.push(demand);
      return copy(demand);
    },

    async update(id, input) {
      const user = await kit.begin('demands:submit');
      const current = findOrThrow(db.demands, id, 'Talep');
      if (!canEditDemand(user, current)) {
        throw new ForbiddenError(
          'Bu talebi değiştiremezsiniz. Talep sahibi, talebini yalnızca karar verilmeden önce veya bilgi istendiğinde güncelleyebilir.',
        );
      }
      validateRequest(input, current);
      // A requester answering a question puts the demand back in the queue.
      const answered = current.status === 'needs-info' && !hasPermission(user, 'demands:manage');
      const next: Demand = {
        ...current,
        ...clean(input),
        status: answered ? 'submitted' : current.status,
        history: answered
          ? [...current.history, event(user, 'submitted', 'Talep sahibi istenen bilgiyi ekledi.')]
          : current.history,
        audit: kit.touch(current.audit, user),
      };
      return copy(replaceRow(db.demands, next));
    },

    async assess(id, input) {
      const user = await kit.begin('demands:manage');
      const current = findOrThrow(db.demands, id, 'Talep');
      validateAssessment(input, current);
      const { status, ...assessment } = input;
      const next: Demand = {
        ...current,
        status,
        assessment: { ...assessment, decisionNote: assessment.decisionNote.trim() },
        history:
          status === current.status
            ? current.history
            : [...current.history, event(user, status, assessment.decisionNote)],
        audit: kit.touch(current.audit, user),
      };
      return copy(replaceRow(db.demands, next));
    },

    async withdraw(id, note) {
      const user = await kit.begin('demands:submit');
      const current = findOrThrow(db.demands, id, 'Talep');
      if (!canWithdrawDemand(user, current)) {
        throw new ForbiddenError('Bu talebi geri çekemezsiniz.');
      }
      if (looksLikeSecret(note)) throw new ValidationError(NO_SECRETS_MESSAGE, 'note');
      const next: Demand = {
        ...current,
        status: 'withdrawn',
        history: [...current.history, event(user, 'withdrawn', note)],
        audit: kit.touch(current.audit, user),
      };
      return copy(replaceRow(db.demands, next));
    },

    async remove(id) {
      await kit.begin('demands:manage');
      findOrThrow(db.demands, id, 'Talep');
      deleteAttachmentsOf(db, { type: 'demand', id });
      removeRow(db.demands, id);
    },

    async getDeletionImpact(id: EntityId) {
      await delay(latencyMs);
      findOrThrow(db.demands, id, 'Talep');
      return attachmentsOnlyImpact(db, { type: 'demand', id });
    },
  };
}
