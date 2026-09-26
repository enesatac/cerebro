import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { DeleteAction } from '@/components/actions/DeleteAction';
import { SelectField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationOptions } from '@/domains/applications/api/queries';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteIntegration, useSaveIntegration } from '../api/mutations';
import { useIntegration } from '../api/queries';
import {
  integrationFormSchema,
  toIntegrationFormValues,
  toIntegrationInput,
  type IntegrationFormValues,
} from '../schemas/connectionForms';
import { INTEGRATION_FREQUENCIES, INTEGRATION_TYPES, type Integration } from '../types';
import {
  INTEGRATION_FREQUENCY_LABELS,
  INTEGRATION_TYPE_LABELS,
} from '../utils/connectionPresentation';

const TARGET_OPTIONS = [
  { value: 'application', label: 'Another Cerebro application' },
  { value: 'external', label: 'An external party' },
];

function IntegrationForm({ integration }: { integration?: Integration }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { connections } = useRepositories();
  const save = useSaveIntegration(integration?.id);
  const remove = useDeleteIntegration();
  const applications = useApplicationOptions();
  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(integrationFormSchema),
    defaultValues: toIntegrationFormValues(integration, params.get('from') ?? ''),
    mode: 'onTouched',
  });
  const { control } = form;
  const targetKind = useWatch({ control, name: 'targetKind' });
  const origin = integration?.fromApplicationId ?? params.get('from');
  const returnTo = origin
    ? `${paths.applications.detail(origin)}?tab=integrations`
    : `${paths.architecture()}?tab=integrations`;

  return (
    <FormPage
      form={form}
      title={integration ? `Edit ${integration.name}` : 'Record an integration'}
      subtitle="A concrete technical interface: who initiates it, who receives it and what flows through it."
      breadcrumbs={[
        { label: 'Connections', to: `${paths.architecture()}?tab=integrations` },
        { label: integration ? 'Edit integration' : 'New integration' },
      ]}
      cancelTo={returnTo}
      submitLabel={integration ? 'Save changes' : 'Record integration'}
      onSubmit={async (values) => {
        await save.mutateAsync(toIntegrationInput(values));
        return returnTo;
      }}
      deleteAction={
        integration && (
          <Can permission="portfolio:delete">
            <DeleteAction
              entityLabel="integration"
              entityName={integration.name}
              impactKey={['integration', integration.id]}
              loadImpact={() => connections.integrations.getDeletionImpact(integration.id)}
              onDelete={() => remove.mutateAsync(integration.id)}
              onDeleted={() => void navigate(returnTo)}
            />
          </Can>
        )
      }
    >
      <SectionCard title="Integration">
        <div className="c-form-grid">
          <TextField control={control} name="name" label="Name" required />
          <SelectField
            control={control}
            name="type"
            label="Type"
            required
            options={INTEGRATION_TYPES.map((value) => ({
              value,
              label: INTEGRATION_TYPE_LABELS[value],
            }))}
          />
          <SelectField
            control={control}
            name="frequency"
            label="Frequency"
            required
            options={INTEGRATION_FREQUENCIES.map((value) => ({
              value,
              label: INTEGRATION_FREQUENCY_LABELS[value],
            }))}
          />
        </div>
      </SectionCard>
      <SectionCard title="Endpoints">
        <div className="c-form-grid">
          <SelectField
            control={control}
            name="fromApplicationId"
            label="From (initiates or produces)"
            required
            options={applications}
          />
          <SelectField
            control={control}
            name="targetKind"
            label="Receiver is"
            required
            options={TARGET_OPTIONS}
          />
          {targetKind === 'application' ? (
            <SelectField
              control={control}
              name="toApplicationId"
              label="To application"
              required
              options={applications}
            />
          ) : (
            <TextField
              control={control}
              name="externalPartyName"
              label="External party"
              required
              placeholder="e.g. Card acquiring bank"
            />
          )}
        </div>
      </SectionCard>
      <SectionCard
        title="Details"
        description="Never include credentials, tokens or connection strings."
      >
        <div className="c-form-grid">
          <TextField
            control={control}
            name="dataExchanged"
            label="Data exchanged"
            className="c-form-grid__wide"
          />
          <TextField
            control={control}
            name="description"
            label="Description"
            rows={3}
            className="c-form-grid__wide"
          />
        </div>
      </SectionCard>
    </FormPage>
  );
}

export default function IntegrationFormPage() {
  const { integrationId } = useParams();
  return integrationId ? <EditIntegration id={integrationId} /> : <IntegrationForm />;
}

function EditIntegration({ id }: { id: string }) {
  const query = useIntegration(id);
  return (
    <QueryView
      query={query}
      loadingLabel="Loading integration"
      errorTitle="This integration could not be loaded"
    >
      {(integration) => <IntegrationForm integration={integration} />}
    </QueryView>
  );
}
