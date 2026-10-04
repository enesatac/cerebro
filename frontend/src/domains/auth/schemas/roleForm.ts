import { z } from 'zod';
import { optionalText, requiredText } from '@/lib/validation';
import { PRIVILEGE_MODULES, type AccessLevel, type Role, type RoleInput } from '../types';
import { levelOn, privilegesFor } from '../utils/permissions';

export type LevelChoice = AccessLevel | 'none';

/** One access level per screen; the stored privileges are derived from it. */
export const roleFormSchema = z.object({
  name: requiredText('Rol adı', 80),
  description: optionalText('Açıklama', 300),
  levels: z.record(z.string(), z.enum(['none', 'view', 'edit', 'delete'])),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;

export function toRoleFormValues(role?: Role): RoleFormValues {
  return {
    name: role?.name ?? '',
    description: role?.description ?? '',
    levels: Object.fromEntries(
      PRIVILEGE_MODULES.map((m) => [
        m.id,
        role ? (levelOn(role.privileges, m.id) ?? 'none') : 'none',
      ]),
    ),
  };
}

export function toRoleInput(values: RoleFormValues): RoleInput {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    privileges: PRIVILEGE_MODULES.flatMap((m) => {
      const level = values.levels[m.id] ?? 'none';
      return privilegesFor(m.id, level === 'none' ? null : level);
    }),
  };
}
