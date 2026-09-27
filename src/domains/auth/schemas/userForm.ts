import { z } from 'zod';
import { email, enumChoice, idText, requiredText, toIdOrNull } from '@/lib/validation';
import { USER_ROLES, type UserAccount, type UserAccountInput } from '../types';

export const userFormSchema = z.object({
  displayName: requiredText('Ad', 120),
  email: email('E-posta'),
  role: enumChoice(USER_ROLES, 'bir rol'),
  personId: z.string(),
  active: z.boolean(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export function toUserFormValues(user?: UserAccount): UserFormValues {
  return {
    displayName: user?.displayName ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'user',
    personId: idText(user?.personId),
    active: user?.active ?? true,
  };
}

export function toUserInput(values: UserFormValues): UserAccountInput {
  return {
    displayName: values.displayName.trim(),
    email: values.email.trim().toLowerCase(),
    role: values.role,
    personId: toIdOrNull(values.personId),
    active: values.active,
  };
}
