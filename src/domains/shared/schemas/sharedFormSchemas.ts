import { z } from 'zod';
import {
  enumChoice,
  newRowId,
  requiredChoice,
  requiredText,
  requiredUrl,
  secretFreeText,
} from '@/lib/validation';
import {
  DOCUMENTATION_LINK_TYPES,
  STAKEHOLDER_ROLES,
  TEAM_RESPONSIBILITIES,
  type DocumentationLink,
  type RoleAssignment,
  type TeamAssignment,
} from '../types';

export const roleAssignmentSchema = z.object({
  personId: requiredChoice('a person'),
  role: enumChoice(STAKEHOLDER_ROLES, 'a role'),
});

export const teamAssignmentSchema = z.object({
  teamId: requiredChoice('a team'),
  responsibility: enumChoice(TEAM_RESPONSIBILITIES, 'a responsibility'),
});

export const documentationLinkSchema = z.object({
  id: z.string(),
  type: enumChoice(DOCUMENTATION_LINK_TYPES, 'a type'),
  title: requiredText('Link title', 160),
  url: requiredUrl('Address'),
  description: secretFreeText('Description', 300),
});

/** The same person in the same role twice is almost always a data-entry slip. */
export function uniqueRoleAssignments(
  rows: RoleAssignment[],
  ctx: z.RefinementCtx,
  path = 'roles',
) {
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    const key = `${row.personId}:${row.role}`;
    if (row.personId && seen.has(key)) {
      ctx.addIssue({
        code: 'custom',
        message: 'This person already has this role.',
        path: [path, index, 'personId'],
      });
    }
    seen.add(key);
  });
}

export type DocumentationLinkFormValues = z.infer<typeof documentationLinkSchema>;

export const toDocumentationFormValues = (
  links: DocumentationLink[],
): DocumentationLinkFormValues[] =>
  links.map((link) => ({ ...link, description: link.description ?? '' }));

export const toDocumentationLinks = (rows: DocumentationLinkFormValues[]): DocumentationLink[] =>
  rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title.trim(),
    url: row.url.trim(),
    ...(row.description.trim() ? { description: row.description.trim() } : {}),
  }));

export const emptyDocumentationLink = (): DocumentationLinkFormValues => ({
  id: newRowId('doc'),
  type: 'confluence',
  title: '',
  url: '',
  description: '',
});

export const emptyRoleAssignment = (): RoleAssignment => ({ personId: '', role: 'stakeholder' });
export const emptyTeamAssignment = (): TeamAssignment => ({
  teamId: '',
  responsibility: 'development',
});
