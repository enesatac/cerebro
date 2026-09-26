import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { DeleteAction } from '@/components/actions/DeleteAction';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { Can } from '@/domains/auth/components/Can';
import { StakeholderFields } from '@/domains/people/components/StakeholderFields';
import { DocumentationLinksFields } from '@/domains/shared/components/DocumentationLinksFields';
import { useRepositories } from '@/services/RepositoryContext';
import { useApplication } from '../api/queries';
import { useDeleteApplication, useSaveApplication } from '../api/mutations';
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
  const { applications } = useRepositories();
  const save = useSaveApplication(application?.id);
  const remove = useDeleteApplication();
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: toApplicationFormValues(application),
    mode: 'onTouched',
  });
  const { control } = form;

  return (
    <FormPage
      form={form}
      title={application ? `Edit ${application.name}` : 'Register application'}
      subtitle={
        application
          ? undefined
          : 'Capture what it is, who owns it and where it runs. You can add more detail later.'
      }
      breadcrumbs={[
        { label: 'Applications', to: paths.applications.list() },
        ...(application
          ? [{ label: application.name, to: paths.applications.detail(application.id) }]
          : []),
        { label: application ? 'Edit' : 'New' },
      ]}
      cancelTo={application ? paths.applications.detail(application.id) : paths.applications.list()}
      submitLabel={application ? 'Save changes' : 'Register application'}
      onSubmit={async (values) =>
        paths.applications.detail((await save.mutateAsync(toApplicationInput(values))).id)
      }
      deleteAction={
        application && (
          <Can permission="portfolio:delete">
            <DeleteAction
              entityLabel="application"
              entityName={application.name}
              impactKey={['application', application.id]}
              loadImpact={() => applications.getDeletionImpact(application.id)}
              onDelete={() => remove.mutateAsync(application.id)}
              onDeleted={() => void navigate(paths.applications.list())}
            />
          </Can>
        )
      }
    >
      <ApplicationGeneralSection control={control} />
      <ApplicationBusinessSection control={control} />
      <StakeholderFields
        control={control}
        roleOrder={APPLICATION_ROLE_ORDER}
        description="At least a technical owner and a business owner."
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
  return applicationId ? <EditApplication id={applicationId} /> : <ApplicationForm />;
}

function EditApplication({ id }: { id: string }) {
  const query = useApplication(id);
  return (
    <QueryView
      query={query}
      loadingLabel="Loading application"
      errorTitle="This application could not be loaded"
    >
      {(application) => <ApplicationForm application={application} />}
    </QueryView>
  );
}
