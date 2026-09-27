import { zodResolver } from '@hookform/resolvers/zod';
import type { EntityId } from '@/domains/shared/types';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { StakeholderFields } from '@/domains/people/components/StakeholderFields';
import { DocumentationLinksFields } from '@/domains/shared/components/DocumentationLinksFields';
import { useApplication } from '../api/queries';
import { useSaveApplication } from '../api/mutations';
import {
  ApplicationBusinessSection,
  ApplicationEnvironmentsSection,
  ApplicationGeneralSection,
  ApplicationRepositoriesSection,
  ApplicationTechnologySection,
} from '../components/form/ApplicationFormSections';
import {
  applicationFormSchema,
  toApplicationFormValues,
  toApplicationInput,
  type ApplicationFormValues,
} from '../schemas/applicationForm';
import type { Application } from '../types';
import { ApplicationDeleteAction } from '../components/ApplicationDeleteAction';
import { parseId } from '@/lib/urlParams';

const APPLICATION_ROLE_ORDER = [
  'technical-owner',
  'business-owner',
  'product-owner',
  'architect',
  'developer',
  'support',
  'analyst',
  'stakeholder',
] as const;

function ApplicationForm({ application }: { application?: Application }) {
  const navigate = useNavigate();
  const save = useSaveApplication(application?.id);
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: toApplicationFormValues(application),
    mode: 'onTouched',
  });
  const { control } = form;

  return (
    <FormPage
      form={form}
      title={application ? `Düzenle: ${application.name}` : 'Uygulama kaydet'}
      subtitle={
        application
          ? undefined
          : 'Ne olduğunu, sahibinin kim olduğunu ve nerede çalıştığını kaydedin. Daha fazla ayrıntıyı sonra ekleyebilirsiniz.'
      }
      breadcrumbs={[
        { label: 'Uygulamalar', to: paths.applications.list() },
        ...(application
          ? [{ label: application.name, to: paths.applications.detail(application.id) }]
          : []),
        { label: application ? 'Düzenle' : 'Yeni' },
      ]}
      cancelTo={application ? paths.applications.detail(application.id) : paths.applications.list()}
      submitLabel={application ? 'Değişiklikleri kaydet' : 'Uygulama kaydet'}
      onSubmit={async (values) =>
        paths.applications.detail((await save.mutateAsync(toApplicationInput(values))).id)
      }
      deleteAction={
        application && (
          <ApplicationDeleteAction
            record={application}
            onDeleted={() => void navigate(paths.applications.list())}
          />
        )
      }
    >
      <ApplicationGeneralSection control={control} />
      <ApplicationBusinessSection control={control} />
      <StakeholderFields
        control={control}
        roleOrder={APPLICATION_ROLE_ORDER}
        description="En az bir teknik sahip ve bir iş sahibi."
      />
      <ApplicationTechnologySection control={control} />
      <ApplicationEnvironmentsSection control={control} />
      <ApplicationRepositoriesSection control={control} />
      <DocumentationLinksFields control={control} />
    </FormPage>
  );
}

export default function ApplicationFormPage() {
  const { applicationId } = useParams();
  return applicationId ? <EditApplication id={parseId(applicationId) ?? 0} /> : <ApplicationForm />;
}

function EditApplication({ id }: { id: EntityId }) {
  const query = useApplication(id);
  return (
    <QueryView
      query={query}
      loadingLabel="Uygulama yükleniyor"
      errorTitle="Bu uygulama yüklenemedi"
    >
      {(application) => <ApplicationForm application={application} />}
    </QueryView>
  );
}
