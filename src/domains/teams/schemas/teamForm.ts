import { z } from 'zod';
import { emptyToNull, optionalEmail, optionalText, requiredText } from '@/lib/validation';
import type { Team, TeamInput } from '../types';

export const teamFormSchema = z.object({
  name: requiredText('Team name', 80),
  description: optionalText('Description', 500),
  managerId: z.string(),
  memberIds: z.array(z.string()),
  contactEmail: optionalEmail,
  chatChannel: optionalText('Chat channel', 80),
  responsibilities: z.array(z.string().trim().min(1).max(120)),
});

export type TeamFormValues = z.infer<typeof teamFormSchema>;

export function toTeamFormValues(team?: Team): TeamFormValues {
  return {
    name: team?.name ?? '',
    description: team?.description ?? '',
    managerId: team?.managerId ?? '',
    memberIds: team?.memberIds ?? [],
    contactEmail: team?.contactEmail ?? '',
    chatChannel: team?.chatChannel ?? '',
    responsibilities: team?.responsibilities ?? [],
  };
}

export function toTeamInput(values: TeamFormValues): TeamInput {
  const managerId = emptyToNull(values.managerId);
  // The manager is always a member.
  const memberIds =
    managerId && !values.memberIds.includes(managerId)
      ? [managerId, ...values.memberIds]
      : values.memberIds;
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    managerId,
    memberIds,
    contactEmail: emptyToNull(values.contactEmail),
    chatChannel: emptyToNull(values.chatChannel),
    responsibilities: values.responsibilities,
  };
}
