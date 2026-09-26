import type { DeletionImpact } from '@/domains/shared/types';
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
  id: string,
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
  id: string,
) {
  for (const row of [...db.risks, ...db.escalations, ...db.decisions]) {
    row[key] = row[key].filter((value) => value !== id);
  }
}

export function applicationDeletionImpact(db: MockDatabase, id: string): DeletionImpact {
  const related = relatedCount(db, 'relatedApplicationIds', id);
  return {
    blockedReason: null,
    references: nonZero([
      {
        label: 'projects',
        count: db.projects.filter((p) => p.applicationImpacts.some((i) => i.applicationId === id))
          .length,
      },
      {
        label: 'dependencies',
        count: db.dependencies.filter(
          (d) => d.sourceApplicationId === id || d.targetApplicationId === id,
        ).length,
      },
      {
        label: 'integrations',
        count: db.integrations.filter((i) => i.fromApplicationId === id || i.toApplicationId === id)
          .length,
      },
      { label: 'risks', count: related.risks },
      { label: 'escalations', count: related.escalations },
      { label: 'decisions', count: related.decisions },
    ]),
  };
}

export function deleteApplicationCascade(db: MockDatabase, id: string) {
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

export function projectDeletionImpact(db: MockDatabase, id: string): DeletionImpact {
  const related = relatedCount(db, 'relatedProjectIds', id);
  return {
    blockedReason: null,
    references: nonZero([
      { label: 'risks', count: related.risks },
      { label: 'escalations', count: related.escalations },
      { label: 'decisions', count: related.decisions },
    ]),
  };
}

export function deleteProjectCascade(db: MockDatabase, id: string) {
  unlinkRelated(db, 'relatedProjectIds', id);
}

export function teamDeletionImpact(db: MockDatabase, id: string): DeletionImpact {
  return {
    blockedReason: null,
    references: nonZero([
      {
        label: 'applications',
        count: db.applications.filter((a) => a.teams.some((t) => t.teamId === id)).length,
      },
      {
        label: 'projects',
        count: db.projects.filter((p) => p.teams.some((t) => t.teamId === id)).length,
      },
      {
        label: 'escalations',
        count: db.escalations.filter((e) => e.responsibleTeamId === id).length,
      },
    ]),
  };
}

export function deleteTeamCascade(db: MockDatabase, id: string) {
  for (const row of [...db.applications, ...db.projects]) {
    row.teams = row.teams.filter((assignment) => assignment.teamId !== id);
  }
  for (const escalation of db.escalations) {
    if (escalation.responsibleTeamId === id) escalation.responsibleTeamId = null;
  }
}

/** Technologies in use cannot be deleted — retire them instead so history stays intact. */
export function technologyDeletionImpact(db: MockDatabase, id: string): DeletionImpact {
  const applications = db.applications.filter(
    (a) =>
      a.technologies.some((t) => t.technologyId === id) ||
      a.dataStores.some((d) => d.technologyId === id),
  ).length;
  return {
    references: nonZero([{ label: 'applications', count: applications }]),
    blockedReason:
      applications > 0
        ? `It is used by ${applications} application${applications === 1 ? '' : 's'}. Set its status to Retired instead, or remove it from those applications first.`
        : null,
  };
}

export const NO_IMPACT: DeletionImpact = { references: [], blockedReason: null };
