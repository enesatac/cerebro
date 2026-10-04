import { z } from 'zod';
import { email, idText, requiredText, toId, toIdOrNull } from '@/lib/validation';
import type { UserAccount, UserAccountInput } from '../types';

export const userFormSchema = z.object({
  displayName: requiredText('Ad', 120),
  email: email('E-posta'),
  roleIds: z.array(z.string()).min(1, 'En az bir rol seçin.'),
  personId: z.string(),
  active: z.boolean(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

/** A new account starts with `defaultRoleIds` (the least-privileged role in the catalogue). */
export function toUserFormValues(
  user?: UserAccount,
  defaultRoleIds: number[] = [],
): UserFormValues {
  return {
    displayName: user?.displayName ?? '',
    email: user?.email ?? '',
    roleIds: (user?.roleIds ?? defaultRoleIds).map(idText),
    personId: idText(user?.personId),
    active: user?.active ?? true,
  };
}

export function toUserInput(values: UserFormValues): UserAccountInput {
  return {
    displayName: values.displayName.trim(),
    email: values.email.trim().toLowerCase(),
    roleIds: values.roleIds.map(toId),
    personId: toIdOrNull(values.personId),
    active: values.active,
  };
}
