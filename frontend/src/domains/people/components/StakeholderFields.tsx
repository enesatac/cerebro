import { useFieldArray, type Control, type FieldValues } from 'react-hook-form';
import { arrayPath, fieldPath } from '@/components/forms/fieldPath';
import { SelectField } from '@/components/forms/fields';
import { RepeatableList } from '@/components/forms/RepeatableList';
import { SectionCard } from '@/components/layout/SectionCard';
import {
  emptyRoleAssignment,
  emptyTeamAssignment,
} from '@/domains/shared/schemas/sharedFormSchemas';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { useTeamOptions } from '@/domains/teams/api/queries';
import { usePersonOptions } from '../api/queries';

interface StakeholderFieldsProps<T extends FieldValues> {
  control: Control<T>;
  /** Roles offered first in the list, e.g. owners for applications; the rest follow admin order. */
  roleOrder?: readonly string[];
  description: string;
}

/** Expects `roles: RoleAssignment[]` and `teams: TeamAssignment[]` in the form. */
export function StakeholderFields<T extends FieldValues>({
  control,
  roleOrder,
  description,
}: StakeholderFieldsProps<T>) {
  const people = usePersonOptions();
  const teams = useTeamOptions();
  const roles = useFieldArray({ control, name: arrayPath<T>('roles') });
  const teamRows = useFieldArray({ control, name: arrayPath<T>('teams') });

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
              <MasterSelectField
                control={control}
                name={fieldPath<T>(`roles.${index}.role`)}
                label="Rol"
                required
                list="stakeholderRoles"
                prefer={roleOrder}
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
              <MasterSelectField
                control={control}
                name={fieldPath<T>(`teams.${index}.responsibility`)}
                label="Sorumluluk"
                required
                list="teamResponsibilities"
              />
            </div>
          )}
        />
      </SectionCard>
    </>
  );
}
