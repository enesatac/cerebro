import { zodResolver } from '@hookform/resolvers/zod';
import type { EntityId } from '@/domains/shared/types';
import { useForm, useWatch, type Control } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { MultiSelectField, SelectField, SwitchField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { usePeopleById } from '@/domains/people/api/queries';
import { useCurrentUser, useRoles, useUserAccount } from '../api/queries';
import { useSaveUser } from '../api/mutations';
import {
  toUserFormValues,
  toUserInput,
  userFormSchema,
  type UserFormValues,
} from '../schemas/userForm';
import type { Role, UserAccount } from '../types';
import { AccessPreview } from '../components/AccessPreview';
import { privilegesOfRoles } from '../utils/permissions';
import { UserDeleteAction } from '../components/UserDeleteAction';
import { parseId } from '@/lib/urlParams';

/** The union of the selected roles, updated as roles are added or removed. */
function EffectiveAccess({ control, roles }: { control: Control<UserFormValues>; roles: Role[] }) {
  const selected = useWatch({ control, name: 'roleIds' });
  return (
    <AccessPreview
      privileges={privilegesOfRoles(roles.filter((role) => selected.includes(String(role.id))))}
    />
  );
}

/** The role new accounts start with: the one granting the fewest privileges. */
const leastPrivileged = (roles: Role[]) =>
  [...roles].filter((r) => !r.system).sort((a, b) => a.privileges.length - b.privileges.length)[0];

function UserForm({ user, roles }: { user?: UserAccount; roles: Role[] }) {
  const save = useSaveUser(user?.id);
  const people = usePeopleById();
  const me = useCurrentUser();
  const navigate = useNavigate();
  const isSelf = user?.id === me?.id;
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: toUserFormValues(
      user,
      [leastPrivileged(roles)?.id].filter((id): id is number => id !== undefined),
    ),
    mode: 'onTouched',
  });
  const { control } = form;
  const personOptions = [...(people.data?.values() ?? [])]
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map((person) => ({
      value: String(person.id),
      label: `${person.fullName} — ${person.jobTitle}`,
    }));

  return (
    <FormPage
      form={form}
      title={user ? `Düzenle: ${user.displayName}` : 'Kullanıcı ekle'}
      breadcrumbs={[
        { label: 'Kullanıcılar', to: paths.admin.users() },
        { label: user ? user.displayName : 'Yeni kullanıcı' },
      ]}
      cancelTo={paths.admin.users()}
      submitLabel={user ? 'Değişiklikleri kaydet' : 'Kullanıcı ekle'}
      deleteAction={
        user &&
        !isSelf && (
          <UserDeleteAction record={user} onDeleted={() => void navigate(paths.admin.users())} />
        )
      }
      onSubmit={async (values) => {
        await save.mutateAsync(toUserInput(values));
        return paths.admin.users();
      }}
    >
      <SectionCard title="Hesap">
        <div className="c-form-grid">
          <TextField control={control} name="displayName" label="Ad" required autoComplete="name" />
          <TextField
            control={control}
            name="email"
            label="E-posta"
            type="email"
            required
            autoComplete="email"
            description="Girişte kurumsal kimlikle eşleştirmek için kullanılır."
          />
          <SelectField
            control={control}
            name="personId"
            label="Bağlı kişi"
            options={personOptions}
            emptyLabel="Bağlı değil"
            description="Bu kullanıcının yaptığı değişiklikler geçmişte bu kişiye atfedilir."
          />
        </div>
      </SectionCard>
      <SectionCard title="Erişim">
        <div className="c-form-grid">
          <MultiSelectField
            control={control}
            name="roleIds"
            label="Roller"
            required
            options={roles.map((role) => ({ value: String(role.id), label: role.name }))}
            addLabel="Rol ekle"
            description="Kullanıcı, rollerinin yetkilerinin birleşimine sahip olur."
          />
          <SwitchField
            control={control}
            name="active"
            label="Giriş yapabilir"
            disabled={isSelf}
            description={
              isSelf
                ? 'Kendi hesabınızı devre dışı bırakamazsınız.'
                : 'Devre dışı hesapların geçmişi korunur ama giriş yapamazlar.'
            }
          />
        </div>
      </SectionCard>
      <SectionCard
        title="Etkin yetkiler"
        description="Seçili rollerle bu kullanıcının her ekranda yapabilecekleri."
      >
        <EffectiveAccess control={control} roles={roles} />
      </SectionCard>
    </FormPage>
  );
}

export default function UserFormPage() {
  const { userId } = useParams();
  const roles = useRoles();
  return (
    <QueryView query={roles} loadingLabel="Roller yükleniyor" errorTitle="Roller yüklenemedi">
      {(list) =>
        userId ? <EditUser id={parseId(userId) ?? 0} roles={list} /> : <UserForm roles={list} />
      }
    </QueryView>
  );
}

function EditUser({ id, roles }: { id: EntityId; roles: Role[] }) {
  const query = useUserAccount(id);
  return (
    <QueryView
      query={query}
      loadingLabel="Kullanıcı yükleniyor"
      errorTitle="Bu kullanıcı yüklenemedi"
    >
      {(user) => <UserForm user={user} roles={roles} />}
    </QueryView>
  );
}
