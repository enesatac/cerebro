import { useFieldArray, type Control, type FieldValues } from 'react-hook-form';
import { arrayPath, fieldPath } from '@/components/forms/fieldPath';
import { SelectField } from '@/components/forms/fields';
import { RepeatableList } from '@/components/forms/RepeatableList';
import { SectionCard } from '@/components/layout/SectionCard';
import {
  emptyRoleAssignment,
  emptyTeamAssignment,
} from '@/domains/shared/schemas/sharedFormSchemas';
import { STAKEHOLDER_ROLES, TEAM_RESPONSIBILITIES } from '@/domains/shared/types';
import {
  STAKEHOLDER_ROLE_LABELS,
  TEAM_RESPONSIBILITY_LABELS,
} from '@/domains/shared/utils/presentation';
import { useTeamOptions } from '@/domains/teams/api/queries';
import { usePersonOptions } from '../api/queries';

interface StakeholderFieldsProps<T extends FieldValues> {
  control: Control<T>;
  /** Roles offered first in the list, e.g. owners for applications. */
  roleOrder?: readonly (typeof STAKEHOLDER_ROLES)[number][];
  description: string;
}

/** Expects `roles: RoleAssignment[]` and `teams: TeamAssignment[]` in the form. */
export function StakeholderFields<T extends FieldValues>({
  control,
  roleOrder = STAKEHOLDER_ROLES,
  description,
}: StakeholderFieldsProps<T>) {
  const people = usePersonOptions();
  const teams = useTeamOptions();
  const roles = useFieldArray({ control, name: arrayPath<T>('roles') });
  const teamRows = useFieldArray({ control, name: arrayPath<T>('teams') });
  const roleOptions = roleOrder.map((value) => ({ value, label: STAKEHOLDER_ROLE_LABELS[value] }));

  return (
    <>
      <SectionCard title="Kişiler" description={description}>
        <RepeatableList
          items={roles.fields}
          onAdd={() => roles.append(emptyRoleAssignment() as never)}
          onRemove={roles.remove}
          addLabel="Kişi ekle"
          removeLabel={(index) => `${index + 1}. kişiyi kaldır`}
          emptyText="Henüz kimse atanmadı."
          renderItem={(index) => (
            <div className="c-form-grid">
              <SelectField
                control={control}
                name={fieldPath<T>(`roles.${index}.personId`)}
                label="Kişi"
                required
                options={people}
              />
              <SelectField
                control={control}
                name={fieldPath<T>(`roles.${index}.role`)}
                label="Rol"
                required
                options={roleOptions}
              />
            </div>
          )}
        />
      </SectionCard>
      <SectionCard title="Ekipler">
        <RepeatableList
          items={teamRows.fields}
          onAdd={() => teamRows.append(emptyTeamAssignment() as never)}
          onRemove={teamRows.remove}
          addLabel="Ekip ekle"
          removeLabel={(index) => `${index + 1}. ekibi kaldır`}
          emptyText="Henüz ekip atanmadı."
          renderItem={(index) => (
            <div className="c-form-grid">
              <SelectField
                control={control}
                name={fieldPath<T>(`teams.${index}.teamId`)}
                label="Ekip"
                required
                options={teams}
              />
              <SelectField
                control={control}
                name={fieldPath<T>(`teams.${index}.responsibility`)}
                label="Sorumluluk"
                required
                options={TEAM_RESPONSIBILITIES.map((value) => ({
                  value,
                  label: TEAM_RESPONSIBILITY_LABELS[value],
                }))}
              />
            </div>
          )}
        />
      </SectionCard>
    </>
  );
}
