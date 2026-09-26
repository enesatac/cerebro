import { z } from 'zod';
import {
  newRowId,
  requiredChoice,
  requiredText,
  requiredUrl,
  secretFreeText,
} from '@/lib/validation';
import { type DocumentationLink, type RoleAssignment, type TeamAssignment } from '../types';

export const roleAssignmentSchema = z.object({
  personId: requiredChoice('bir kişi'),
  role: requiredChoice('bir rol'),
});

export const teamAssignmentSchema = z.object({
  teamId: requiredChoice('bir ekip'),
  responsibility: requiredChoice('bir sorumluluk'),
});

export const documentationLinkSchema = z.object({
  id: z.string(),
  type: requiredChoice('bir tür'),
  title: requiredText('Bağlantı başlığı', 160),
  url: requiredUrl('Adres'),
  description: secretFreeText('Açıklama', 300),
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
        message: 'Bu kişi zaten bu role sahip.',
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
