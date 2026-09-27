import type { DeletionImpact, EntityId } from '@/domains/shared/types';
import type { MockDatabase } from './database';

/**
 * Relationship clean-up on deletion. The mock mirrors what a relational backend would do with
 * foreign keys: relationship rows are removed, optional references are cleared, and entities that
 * would lose meaning without the target (dependencies, integrations) are deleted with it.
 */

const nonZero = (references: DeletionImpact['references']) => references.filter((r) => r.count > 0);

function relatedCount(
  db: MockDatabase,
  key: 'relatedApplicationIds' | 'relatedProjectIds',
  id: EntityId,
) {
  return {
    risks: db.risks.filter((r) => r[key].includes(id)).length,
    escalations: db.escalations.filter((e) => e[key].includes(id)).length,
    decisions: db.decisions.filter((d) => d[key].includes(id)).length,
  };
}

function unlinkRelated(
  db: MockDatabase,
  key: 'relatedApplicationIds' | 'relatedProjectIds',
  id: EntityId,
) {
  for (const row of [...db.risks, ...db.escalations, ...db.decisions]) {
    row[key] = row[key].filter((value) => value !== id);
  }
}

export function applicationDeletionImpact(db: MockDatabase, id: EntityId): DeletionImpact {
  const related = relatedCount(db, 'relatedApplicationIds', id);
  return {
    blockedReason: null,
    references: nonZero([
      {
        label: 'proje',
        count: db.projects.filter((p) => p.applicationImpacts.some((i) => i.applicationId === id))
          .length,
      },
      {
        label: 'bağımlılık',
        count: db.dependencies.filter(
          (d) => d.sourceApplicationId === id || d.targetApplicationId === id,
        ).length,
      },
      {
        label: 'entegrasyon',
        count: db.integrations.filter((i) => i.fromApplicationId === id || i.toApplicationId === id)
          .length,
      },
      { label: 'risk', count: related.risks },
      { label: 'eskalasyon', count: related.escalations },
      { label: 'karar', count: related.decisions },
    ]),
  };
}

export function deleteApplicationCascade(db: MockDatabase, id: EntityId) {
  db.dependencies = db.dependencies.filter(
    (d) => d.sourceApplicationId !== id && d.targetApplicationId !== id,
  );
  db.integrations = db.integrations.filter(
    (i) => i.fromApplicationId !== id && i.toApplicationId !== id,
  );
  for (const project of db.projects) {
    project.applicationImpacts = project.applicationImpacts.filter(
      (impact) => impact.applicationId !== id,
    );
  }
  unlinkRelated(db, 'relatedApplicationIds', id);
}

export function projectDeletionImpact(db: MockDatabase, id: EntityId): DeletionImpact {
  const related = relatedCount(db, 'relatedProjectIds', id);
  return {
    blockedReason: null,
    references: nonZero([
      { label: 'risk', count: related.risks },
      { label: 'eskalasyon', count: related.escalations },
      { label: 'karar', count: related.decisions },
    ]),
  };
}

export function deleteProjectCascade(db: MockDatabase, id: EntityId) {
  unlinkRelated(db, 'relatedProjectIds', id);
}

export function teamDeletionImpact(db: MockDatabase, id: EntityId): DeletionImpact {
  return {
    blockedReason: null,
    references: nonZero([
      {
        label: 'uygulama',
        count: db.applications.filter((a) => a.teams.some((t) => t.teamId === id)).length,
      },
      {
        label: 'proje',
        count: db.projects.filter((p) => p.teams.some((t) => t.teamId === id)).length,
      },
      {
        label: 'eskalasyon',
        count: db.escalations.filter((e) => e.responsibleTeamId === id).length,
      },
    ]),
  };
}

export function deleteTeamCascade(db: MockDatabase, id: EntityId) {
  for (const row of [...db.applications, ...db.projects]) {
    row.teams = row.teams.filter((assignment) => assignment.teamId !== id);
  }
  for (const escalation of db.escalations) {
    if (escalation.responsibleTeamId === id) escalation.responsibleTeamId = null;
  }
}

/** Technologies in use cannot be deleted — retire them instead so history stays intact. */
export function technologyDeletionImpact(db: MockDatabase, id: EntityId): DeletionImpact {
  const applications = db.applications.filter(
    (a) =>
      a.technologies.some((t) => t.technologyId === id) ||
      a.dataStores.some((d) => d.technologyId === id),
  ).length;
  return {
    references: nonZero([{ label: 'uygulama', count: applications }]),
    blockedReason:
      applications > 0
        ? `${applications} uygulama tarafından kullanılıyor. Bunun yerine durumunu Emekli yapın ya da önce bu uygulamalardan kaldırın.`
        : null,
  };
}

export const NO_IMPACT: DeletionImpact = { references: [], blockedReason: null };

/** People are referenced from history and ownership; deleting a referenced person is refused. */
export function personDeletionImpact(db: MockDatabase, id: EntityId): DeletionImpact {
  const portfolio = [...db.applications, ...db.projects];
  const audited = [
    ...portfolio,
    ...db.risks,
    ...db.escalations,
    ...db.decisions,
    ...db.dependencies,
    ...db.integrations,
    ...db.teams,
  ];
  const references = nonZero([
    {
      label: 'uygulama/proje rolü',
      count: portfolio.filter((r) => r.roles.some((a) => a.personId === id)).length,
    },
    {
      label: 'ekip üyeliği',
      count: db.teams.filter((t) => t.managerId === id || t.memberIds.includes(id)).length,
    },
    {
      label: 'iş birimi yöneticiliği',
      count: db.businessUnits.filter((b) => b.headId === id).length,
    },
    {
      label: 'risk/eskalasyon/karar',
      count:
        db.risks.filter((r) => r.ownerId === id).length +
        db.escalations.filter((e) => e.ownerId === id || e.raisedById === id).length +
        db.decisions.filter((d) => d.decidedByIds.includes(id)).length,
    },
    { label: 'kullanıcı hesabı', count: db.users.filter((u) => u.personId === id).length },
    { label: 'izin kaydı', count: db.leaves.filter((l) => l.personId === id).length },
    {
      label: 'kayıt geçmişi',
      count: audited.filter(
        (r) =>
          r.audit.createdBy === id || r.audit.updatedBy === id || r.audit.lastReviewedBy === id,
      ).length,
    },
  ]);
  return {
    references,
    blockedReason:
      references.length > 0
        ? 'Bu kişi başka kayıtlarda geçiyor. Önce bu kayıtlardan kaldırın; kayıt geçmişinde yer alan kişiler silinemez.'
        : null,
  };
}

/** Business units in use by applications or projects cannot be deleted; people are unassigned. */
export function businessUnitDeletionImpact(db: MockDatabase, id: EntityId): DeletionImpact {
  const applications = db.applications.filter((a) => a.businessUnitId === id).length;
  const projects = db.projects.filter((p) => p.businessUnitId === id).length;
  return {
    references: nonZero([
      { label: 'uygulama', count: applications },
      { label: 'proje', count: projects },
      { label: 'kişi', count: db.people.filter((p) => p.businessUnitId === id).length },
    ]),
    blockedReason:
      applications + projects > 0
        ? 'Bu iş birimi uygulama veya projelerde kullanılıyor. Önce bu kayıtları başka bir birime taşıyın.'
        : null,
  };
}

export function deleteBusinessUnitCascade(db: MockDatabase, id: EntityId) {
  for (const person of db.people) {
    if (person.businessUnitId === id) person.businessUnitId = null;
  }
}
