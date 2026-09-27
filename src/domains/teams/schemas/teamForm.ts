import { z } from 'zod';
import {
  emptyToNull,
  idText,
  optionalEmail,
  optionalText,
  requiredText,
  toId,
  toIdOrNull,
} from '@/lib/validation';
import type { Team, TeamInput } from '../types';

export const teamFormSchema = z.object({
  name: requiredText('Ekip adı', 80),
  description: optionalText('Açıklama', 500),
  managerId: z.string(),
  memberIds: z.array(z.string()),
  contactEmail: optionalEmail,
  chatChannel: optionalText('Sohbet kanalı', 80),
  responsibilities: z.array(z.string().trim().min(1).max(120)),
});

export type TeamFormValues = z.infer<typeof teamFormSchema>;

export function toTeamFormValues(team?: Team): TeamFormValues {
  return {
    name: team?.name ?? '',
    description: team?.description ?? '',
    managerId: idText(team?.managerId),
    memberIds: team?.memberIds.map(String) ?? [],
    contactEmail: team?.contactEmail ?? '',
    chatChannel: team?.chatChannel ?? '',
    responsibilities: team?.responsibilities ?? [],
  };
}

export function toTeamInput(values: TeamFormValues): TeamInput {
  const managerId = toIdOrNull(values.managerId);
  // The manager is always a member.
  const selected = values.memberIds.map(toId);
  const memberIds =
    managerId !== null && !selected.includes(managerId) ? [managerId, ...selected] : selected;
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
