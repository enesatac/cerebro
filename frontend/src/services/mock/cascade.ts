import type { AttachmentOwner } from '@/domains/attachments/types';
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
      {
        label: 'müdahale rehberi (silinir)',
        count: db.runbooks.filter((r) => r.applicationId === id).length,
      },
      {
        label: 'talep (bağlantı kaldırılır)',
        count: db.demands.filter((d) => d.relatedApplicationIds.includes(id)).length,
      },
      {
        label: 'sözleşme (bağlantı kaldırılır)',
        count: db.contracts.filter((c) => c.relatedApplicationIds.includes(id)).length,
      },
      attachmentReference(db, { type: 'application', id }),
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
  db.runbooks = db.runbooks.filter((r) => r.applicationId !== id);
  for (const row of [...db.demands, ...db.contracts]) {
    row.relatedApplicationIds = row.relatedApplicationIds.filter((value) => value !== id);
  }
  deleteAttachmentsOf(db, { type: 'application', id });
}

export function projectDeletionImpact(db: MockDatabase, id: EntityId): DeletionImpact {
  const related = relatedCount(db, 'relatedProjectIds', id);
  const contracts = db.contracts.filter((c) => c.projectId === id).length;
  return {
    // Contracts are commercial records; they are never deleted as a side effect.
    blockedReason:
      contracts > 0
        ? 'Bu projenin sözleşmeleri var. Önce sözleşmeleri başka bir projeye taşıyın veya silin.'
        : null,
    references: nonZero([
      { label: 'risk', count: related.risks },
      { label: 'eskalasyon', count: related.escalations },
      { label: 'karar', count: related.decisions },
      {
        label: 'kaynak ataması (silinir)',
        count: db.allocations.filter((a) => a.projectId === id).length,
      },
      {
        label: 'sözleşme',
        count: contracts,
      },
      {
        label: 'kaynak talep (bağlantı kaldırılır)',
        count: db.demands.filter((d) => d.assessment.projectId === id).length,
      },
      attachmentReference(db, { type: 'project', id }),
    ]),
  };
}

export function deleteProjectCascade(db: MockDatabase, id: EntityId) {
  unlinkRelated(db, 'relatedProjectIds', id);
  db.allocations = db.allocations.filter((a) => a.projectId !== id);
  for (const demand of db.demands) {
    if (demand.assessment.projectId === id) demand.assessment.projectId = null;
  }
  deleteAttachmentsOf(db, { type: 'project', id });
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
      attachmentReference(db, { type: 'team', id }),
      {
        label: 'müdahale rehberi kişisi (kaldırılır)',
        count: db.runbooks.flatMap((r) => r.contacts).filter((c) => c.teamId === id).length,
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
  for (const runbook of db.runbooks) {
    runbook.contacts = runbook.contacts.filter((contact) => contact.teamId !== id);
  }
  deleteAttachmentsOf(db, { type: 'team', id });
}

/** Technologies in use cannot be deleted — retire them instead so history stays intact. */
export function technologyDeletionImpact(db: MockDatabase, id: EntityId): DeletionImpact {
  const applications = db.applications.filter(
    (a) =>
      a.technologies.some((t) => t.technologyId === id) ||
      a.dataStores.some((d) => d.technologyId === id),
  ).length;
  return {
    references: nonZero([
      { label: 'uygulama', count: applications },
      attachmentReference(db, { type: 'technology', id }),
    ]),
    blockedReason:
      applications > 0
        ? `${applications} uygulama tarafından kullanılıyor. Bunun yerine durumunu Emekli yapın ya da önce bu uygulamalardan kaldırın.`
        : null,
  };
}

export const NO_IMPACT: DeletionImpact = { references: [], blockedReason: null };

export const sameOwner = (a: AttachmentOwner, b: AttachmentOwner) =>
  a.type === b.type && a.id === b.id;

/** "N ek dosya (silinir)" for a record's deletion confirmation. */
export const attachmentReference = (db: MockDatabase, owner: AttachmentOwner) => ({
  label: 'ek dosya (silinir)',
  count: db.attachments.filter((a) => sameOwner(a.owner, owner)).length,
});

/** Impact of deleting a record whose only dependants are its files. */
export const attachmentsOnlyImpact = (
  db: MockDatabase,
  owner: AttachmentOwner,
): DeletionImpact => ({
  blockedReason: null,
  references: nonZero([attachmentReference(db, owner)]),
});

/** Removes the files of a deleted record (metadata; bytes are dropped by `BlobStore.retain`). */
export function deleteAttachmentsOf(db: MockDatabase, owner: AttachmentOwner) {
  db.attachments = db.attachments.filter((a) => !sameOwner(a.owner, owner));
}

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
    ...db.demands,
    ...db.contracts,
    ...db.vendors,
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
    { label: 'kaynak ataması', count: db.allocations.filter((a) => a.personId === id).length },
    {
      label: 'sözleşme sorumluluğu',
      count: db.contracts.filter((c) => c.ownerId === id).length,
    },
    {
      label: 'talep (talep eden, sponsor veya değerlendiren)',
      count: db.demands.filter(
        (d) => d.requesterId === id || d.sponsorId === id || d.assessment.assessorId === id,
      ).length,
    },
    {
      label: 'müdahale rehberi kişisi',
      count: db.runbooks.flatMap((r) => r.contacts).filter((c) => c.personId === id).length,
    },
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
  const demands = db.demands.filter((d) => d.businessUnitId === id).length;
  return {
    references: nonZero([
      { label: 'uygulama', count: applications },
      { label: 'proje', count: projects },
      { label: 'talep', count: demands },
      { label: 'kişi', count: db.people.filter((p) => p.businessUnitId === id).length },
    ]),
    blockedReason:
      applications + projects + demands > 0
        ? 'Bu iş birimi uygulama, proje veya taleplerde kullanılıyor. Önce bu kayıtları başka bir birime taşıyın.'
        : null,
  };
}

export function deleteBusinessUnitCascade(db: MockDatabase, id: EntityId) {
  for (const person of db.people) {
    if (person.businessUnitId === id) person.businessUnitId = null;
  }
}
