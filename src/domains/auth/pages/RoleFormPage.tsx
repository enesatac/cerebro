import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@takeoff-ui/react-spar';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import type { EntityId } from '@/domains/shared/types';
import { parseId } from '@/lib/urlParams';
import { useSaveRole } from '../api/mutations';
import { useRole } from '../api/queries';
import { AccessPreview } from '../components/AccessPreview';
import { PrivilegeLevelsField } from '../components/PrivilegeLevelsField';
import { RoleDeleteAction } from '../components/RoleDeleteAction';
import {
  roleFormSchema,
  toRoleFormValues,
  toRoleInput,
  type RoleFormValues,
} from '../schemas/roleForm';
import type { Role } from '../types';

function RoleForm({ role }: { role?: Role }) {
  const navigate = useNavigate();
  const save = useSaveRole(role?.id);
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: toRoleFormValues(role),
    mode: 'onTouched',
  });
  const { control, setValue } = form;
  return (
    <FormPage
      form={form}
      title={role ? `Rolü düzenle: ${role.name}` : 'Rol oluştur'}
      subtitle={
        role
          ? `${role.userCount} kullanıcıda. Değişiklikler bu kullanıcıların bir sonraki işleminde geçerli olur.`
          : 'Rolün hangi ekranları görebileceğini ve nerede değişiklik yapabileceğini seçin.'
      }
      breadcrumbs={[
        { label: 'Roller ve yetkiler', to: paths.admin.roles() },
        { label: role ? role.name : 'Yeni rol' },
      ]}
      cancelTo={paths.admin.roles()}
      submitLabel={role ? 'Değişiklikleri kaydet' : 'Rol oluştur'}
      onSubmit={async (values) => {
        await save.mutateAsync(toRoleInput(values));
        return paths.admin.roles();
      }}
      deleteAction={
        role && (
          <RoleDeleteAction record={role} onDeleted={() => void navigate(paths.admin.roles())} />
        )
      }
    >
      <SectionCard title="Rol">
        <div className="c-form-grid">
          <TextField
            control={control}
            name="name"
            label="Rol adı"
            required
            placeholder="ör. Finans iş birimi kullanıcısı"
          />
          <TextField
            control={control}
            name="description"
            label="Açıklama"
            rows={2}
            description="Rolü kime vereceğinizi anlatan kısa bir not."
          />
        </div>
      </SectionCard>
      <SectionCard
        title="Ekran yetkileri"
        description="Görüntüleme salt okunurdur; Düzenleme görüntülemeyi, Tam yetki düzenlemeyi ve silmeyi kapsar."
      >
        <PrivilegeLevelsField control={control} setValue={setValue} />
      </SectionCard>
    </FormPage>
  );
}

/** The system role is shown, never edited: it always holds every privilege. */
function SystemRole({ role }: { role: Role }) {
  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[
          { label: 'Roller ve yetkiler', to: paths.admin.roles() },
          { label: role.name },
        ]}
        title={role.name}
        subtitle={role.description}
      />
      <Alert variant="info" appearance="outlined">
        <Alert.Content>
          <Alert.Title level={2}>Bu rol değiştirilemez</Alert.Title>
          <Alert.Description>
            Sistem yöneticisi her ekranda tam yetkiye sahiptir; böylece Cerebro her zaman
            yönetilebilir kalır. En az bir aktif kullanıcıda bulunmak zorundadır.
          </Alert.Description>
        </Alert.Content>
      </Alert>
      <SectionCard title="Ekran yetkileri">
        <AccessPreview privileges={role.privileges} label="Rolün yetkileri" />
      </SectionCard>
    </div>
  );
}

function EditRole({ id }: { id: EntityId }) {
  const query = useRole(id);
  return (
    <QueryView query={query} loadingLabel="Rol yükleniyor" errorTitle="Bu rol yüklenemedi">
      {(role) => (role.system ? <SystemRole role={role} /> : <RoleForm role={role} />)}
    </QueryView>
  );
}

export default function RoleFormPage() {
  const { roleId } = useParams();
  return roleId ? <EditRole id={parseId(roleId) ?? 0} /> : <RoleForm />;
}
