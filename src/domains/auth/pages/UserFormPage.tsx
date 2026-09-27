import { zodResolver } from '@hookform/resolvers/zod';
import type { EntityId } from '@/domains/shared/types';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { SelectField, SwitchField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { usePeopleById } from '@/domains/people/api/queries';
import { useCurrentUser, useUserAccount } from '../api/queries';
import { useSaveUser } from '../api/mutations';
import {
  toUserFormValues,
  toUserInput,
  userFormSchema,
  type UserFormValues,
} from '../schemas/userForm';
import { USER_ROLES, type UserAccount } from '../types';
import { ROLE_PRESENTATION } from '../utils/rolePresentation';
import { UserDeleteAction } from '../components/UserDeleteAction';
import { parseId } from '@/lib/urlParams';

const ROLE_OPTIONS = USER_ROLES.map((role) => ({
  value: role,
  label: ROLE_PRESENTATION[role].label,
}));

function UserForm({ user }: { user?: UserAccount }) {
  const save = useSaveUser(user?.id);
  const people = usePeopleById();
  const me = useCurrentUser();
  const navigate = useNavigate();
  const isSelf = user?.id === me?.id;
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: toUserFormValues(user),
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
        { label: 'Kullanıcılar ve roller', to: paths.admin.users() },
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
          <SelectField
            control={control}
            name="role"
            label="Rol"
            options={ROLE_OPTIONS}
            required
            disabled={isSelf}
            description={
              isSelf
                ? 'Kendi rolünüzü değiştiremezsiniz.'
                : 'Yöneticiler her şeyi değiştirebilir; kullanıcılar yalnızca görüntüleyebilir.'
            }
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
    </FormPage>
  );
}

export default function UserFormPage() {
  const { userId } = useParams();
  return userId ? <EditUser id={parseId(userId) ?? 0} /> : <UserForm />;
}

function EditUser({ id }: { id: EntityId }) {
  const query = useUserAccount(id);
  return (
    <QueryView
      query={query}
      loadingLabel="Kullanıcı yükleniyor"
      errorTitle="Bu kullanıcı yüklenemedi"
    >
      {(user) => <UserForm user={user} />}
    </QueryView>
  );
}
