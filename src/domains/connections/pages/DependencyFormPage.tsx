import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { SelectField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationOptions } from '@/domains/applications/api/queries';
import { useSaveDependency } from '../api/mutations';
import { useDependency } from '../api/queries';
import {
  dependencyFormSchema,
  toDependencyFormValues,
  toDependencyInput,
  type DependencyFormValues,
} from '../schemas/connectionForms';
import { type ApplicationDependency } from '../types';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { DependencyDeleteAction } from '../components/DependencyDeleteAction';

function DependencyForm({ dependency }: { dependency?: ApplicationDependency }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const save = useSaveDependency(dependency?.id);
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
      title={dependency ? 'Bağımlılığı düzenle' : 'Bağımlılık kaydet'}
      subtitle="İlk uygulama ikincisine bağımlıdır: ikincisi erişilemezse ilki etkilenir."
      breadcrumbs={[
        { label: 'Bağlantılar', to: `${paths.architecture()}?tab=dependencies` },
        { label: dependency ? 'Bağımlılığı düzenle' : 'Yeni bağımlılık' },
      ]}
      cancelTo={returnTo}
      submitLabel={dependency ? 'Değişiklikleri kaydet' : 'Bağımlılık kaydet'}
      onSubmit={async (values) => {
        await save.mutateAsync(toDependencyInput(values));
        return returnTo;
      }}
      deleteAction={
        dependency && (
          <DependencyDeleteAction record={dependency} onDeleted={() => void navigate(returnTo)} />
        )
      }
    >
      <SectionCard title="Bağımlılık">
        <div className="c-form-grid">
          <SelectField
            control={control}
            name="sourceApplicationId"
            label="Uygulama"
            required
            options={applications}
          />
          <SelectField
            control={control}
            name="targetApplicationId"
            label="Bağımlı olduğu"
            required
            options={applications}
          />
          <MasterSelectField
            control={control}
            name="type"
            label="Tür"
            required
            list="dependencyTypes"
          />
          <MasterSelectField
            control={control}
            name="criticality"
            label="Erişilemezse etkisi"
            required
            list="criticalities"
          />
          <TextField
            control={control}
            name="description"
            label="Açıklama"
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
      loadingLabel="Bağımlılık yükleniyor"
      errorTitle="Bu bağımlılık yüklenemedi"
    >
      {(dependency) => <DependencyForm dependency={dependency} />}
    </QueryView>
  );
}
