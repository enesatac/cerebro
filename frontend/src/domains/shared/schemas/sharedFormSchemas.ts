import { z } from 'zod';
import {
  childRowId,
  idText,
  requiredChoice,
  requiredText,
  requiredUrl,
  secretFreeText,
  toId,
} from '@/lib/validation';
import type { DocumentationLink, Draft, RoleAssignment, TeamAssignment } from '../types';

export const roleAssignmentSchema = z.object({
  id: childRowId,
  personId: requiredChoice('bir kişi'),
  role: requiredChoice('bir rol'),
});

export const teamAssignmentSchema = z.object({
  id: childRowId,
  teamId: requiredChoice('bir ekip'),
  responsibility: requiredChoice('bir sorumluluk'),
});

export const documentationLinkSchema = z.object({
  id: childRowId,
  type: requiredChoice('bir tür'),
  title: requiredText('Bağlantı başlığı', 160),
  url: requiredUrl('Adres'),
  description: secretFreeText('Açıklama', 300),
});

export type RoleAssignmentFormValues = z.infer<typeof roleAssignmentSchema>;
export type TeamAssignmentFormValues = z.infer<typeof teamAssignmentSchema>;
export type DocumentationLinkFormValues = z.infer<typeof documentationLinkSchema>;

/** The same person in the same role twice is almost always a data-entry slip. */
export function uniqueRoleAssignments(
  rows: RoleAssignmentFormValues[],
  ctx: z.RefinementCtx,
  path = 'roles',
) {
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    const key = `${row.personId}:${row.role}`;
    if (row.personId && seen.has(key)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Bu kişi zaten bu role sahip.',
        path: [path, index, 'personId'],
      });
    }
    seen.add(key);
  });
}

export const toRoleFormValues = (roles: readonly RoleAssignment[]): RoleAssignmentFormValues[] =>
  roles.map((row) => ({ id: row.id, personId: idText(row.personId), role: row.role }));

export const toRoleAssignments = (rows: RoleAssignmentFormValues[]): Draft<RoleAssignment>[] =>
  rows.map((row) => ({ id: row.id, personId: toId(row.personId), role: row.role }));

export const toTeamFormValues = (teams: readonly TeamAssignment[]): TeamAssignmentFormValues[] =>
  teams.map((row) => ({
    id: row.id,
    teamId: idText(row.teamId),
    responsibility: row.responsibility,
  }));

export const toTeamAssignments = (rows: TeamAssignmentFormValues[]): Draft<TeamAssignment>[] =>
  rows.map((row) => ({ id: row.id, teamId: toId(row.teamId), responsibility: row.responsibility }));

export const toDocumentationFormValues = (
  links: readonly DocumentationLink[],
): DocumentationLinkFormValues[] =>
  links.map((link) => ({ ...link, description: link.description ?? '' }));

export const toDocumentationLinks = (
  rows: DocumentationLinkFormValues[],
): Draft<DocumentationLink>[] =>
  rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title.trim(),
    url: row.url.trim(),
    ...(row.description.trim() ? { description: row.description.trim() } : {}),
  }));

export const emptyDocumentationLink = (): DocumentationLinkFormValues => ({
  id: null,
  type: 'confluence',
  title: '',
  url: '',
  description: '',
});

export const emptyRoleAssignment = (): RoleAssignmentFormValues => ({
  id: null,
  personId: '',
  role: 'stakeholder',
});
export const emptyTeamAssignment = (): TeamAssignmentFormValues => ({
  id: null,
  teamId: '',
  responsibility: 'development',
});
