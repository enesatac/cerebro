import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { DeleteAction } from '@/components/actions/DeleteAction';
import { SelectField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationOptions } from '@/domains/applications/api/queries';
import { Can } from '@/domains/auth/components/Can';
import { CRITICALITIES } from '@/domains/shared/types';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteDependency, useSaveDependency } from '../api/mutations';
import { useDependency } from '../api/queries';
import {
  dependencyFormSchema,
  toDependencyFormValues,
  toDependencyInput,
  type DependencyFormValues,
} from '../schemas/connectionForms';
import { DEPENDENCY_TYPES, type ApplicationDependency } from '../types';
import { DEPENDENCY_TYPE_LABELS } from '../utils/connectionPresentation';

function DependencyForm({ dependency }: { dependency?: ApplicationDependency }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { connections } = useRepositories();
  const save = useSaveDependency(dependency?.id);
  const remove = useDeleteDependency();
  const applications = useApplicationOptions();
  const form = useForm<DependencyFormValues>({
    resolver: zodResolver(dependencyFormSchema),
    defaultValues: toDependencyFormValues(dependency, params.get('source') ?? ''),
    mode: 'onTouched',
  });
  const { control } = form;
  const origin = dependency?.sourceApplicationId ?? params.get('source');
  const returnTo = origin
    ? `${paths.applications.detail(origin)}?tab=dependencies`
    : `${paths.architecture()}?tab=dependencies`;

  return (
    <FormPage
      form={form}
      title={dependency ? 'Edit dependency' : 'Record a dependency'}
      subtitle="The first application depends on the second: if the second is unavailable, the first is affected."
      breadcrumbs={[
        { label: 'Connections', to: `${paths.architecture()}?tab=dependencies` },
        { label: dependency ? 'Edit dependency' : 'New dependency' },
      ]}
      cancelTo={returnTo}
      submitLabel={dependency ? 'Save changes' : 'Record dependency'}
      onSubmit={async (values) => {
        await save.mutateAsync(toDependencyInput(values));
        return returnTo;
      }}
      deleteAction={
        dependency && (
          <Can permission="portfolio:delete">
            <DeleteAction
              entityLabel="dependency"
              entityName="this dependency"
              impactKey={['dependency', dependency.id]}
              loadImpact={() => connections.dependencies.getDeletionImpact(dependency.id)}
              onDelete={() => remove.mutateAsync(dependency.id)}
              onDeleted={() => void navigate(returnTo)}
            />
          </Can>
        )
      }
    >
      <SectionCard title="Dependency">
        <div className="c-form-grid">
          <SelectField
            control={control}
            name="sourceApplicationId"
            label="Application"
            required
            options={applications}
          />
          <SelectField
            control={control}
            name="targetApplicationId"
            label="Depends on"
            required
            options={applications}
          />
          <SelectField
            control={control}
            name="type"
            label="Type"
            required
            options={DEPENDENCY_TYPES.map((value) => ({
              value,
              label: DEPENDENCY_TYPE_LABELS[value],
            }))}
          />
          <SelectField
            control={control}
            name="criticality"
            label="Impact if unavailable"
            required
            options={CRITICALITIES.map((value) => ({
              value,
              label: CRITICALITY_PRESENTATION[value].label,
            }))}
          />
          <TextField
            control={control}
            name="description"
            label="Description"
            rows={2}
            className="c-form-grid__wide"
          />
        </div>
      </SectionCard>
    </FormPage>
  );
}

export default function DependencyFormPage() {
  const { dependencyId } = useParams();
  return dependencyId ? <EditDependency id={dependencyId} /> : <DependencyForm />;
}

function EditDependency({ id }: { id: string }) {
  const query = useDependency(id);
  return (
    <QueryView
      query={query}
      loadingLabel="Loading dependency"
      errorTitle="This dependency could not be loaded"
    >
      {(dependency) => <DependencyForm dependency={dependency} />}
    </QueryView>
  );
}
