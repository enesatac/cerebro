import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
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

const ROLE_OPTIONS = USER_ROLES.map((role) => ({
  value: role,
  label: ROLE_PRESENTATION[role].label,
}));

function UserForm({ user }: { user?: UserAccount }) {
  const save = useSaveUser(user?.id);
  const people = usePeopleById();
  const me = useCurrentUser();
  const isSelf = user?.id === me?.id;
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: toUserFormValues(user),
    mode: 'onTouched',
  });
  const { control } = form;
  const personOptions = [...(people.data?.values() ?? [])]
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map((person) => ({ value: person.id, label: `${person.fullName} — ${person.jobTitle}` }));

  return (
    <FormPage
      form={form}
      title={user ? `Edit ${user.displayName}` : 'Add user'}
      breadcrumbs={[
        { label: 'Users & roles', to: paths.admin.users() },
        { label: user ? user.displayName : 'New user' },
      ]}
      cancelTo={paths.admin.users()}
      submitLabel={user ? 'Save changes' : 'Add user'}
      onSubmit={async (values) => {
        await save.mutateAsync(toUserInput(values));
        return paths.admin.users();
      }}
    >
      <SectionCard title="Account">
        <div className="c-form-grid">
          <TextField
            control={control}
            name="displayName"
            label="Name"
            required
            autoComplete="name"
          />
          <TextField
            control={control}
            name="email"
            label="Email"
            type="email"
            required
            autoComplete="email"
            description="Used to match the corporate identity at sign-in."
          />
          <SelectField
            control={control}
            name="personId"
            label="Linked person"
            options={personOptions}
            emptyLabel="Not linked"
            description="Changes made by this user are attributed to this person in history."
          />
        </div>
      </SectionCard>
      <SectionCard title="Access">
        <div className="c-form-grid">
          <SelectField
            control={control}
            name="role"
            label="Role"
            options={ROLE_OPTIONS}
            required
            disabled={isSelf}
            description={
              isSelf
                ? 'You cannot change your own role.'
                : 'Admins can change everything; users can only view.'
            }
          />
          <SwitchField
            control={control}
            name="active"
            label="Can sign in"
            disabled={isSelf}
            description={
              isSelf
                ? 'You cannot deactivate your own account.'
                : 'Deactivated accounts keep their history but cannot sign in.'
            }
          />
        </div>
      </SectionCard>
    </FormPage>
  );
}

export default function UserFormPage() {
  const { userId } = useParams();
  return userId ? <EditUser id={userId} /> : <UserForm />;
}

function EditUser({ id }: { id: string }) {
  const query = useUserAccount(id);
  return (
    <QueryView query={query} loadingLabel="Loading user" errorTitle="This user could not be loaded">
      {(user) => <UserForm user={user} />}
    </QueryView>
  );
}
