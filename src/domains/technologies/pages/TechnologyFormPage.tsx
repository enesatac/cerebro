import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useTechnology } from '../api/queries';
import { useSaveTechnology } from '../api/mutations';
import {
  technologyFormSchema,
  toTechnologyFormValues,
  toTechnologyInput,
  type TechnologyFormValues,
} from '../schemas/technologyForm';
import { type Technology } from '../types';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { TechnologyDeleteAction } from '../components/TechnologyDeleteAction';

function TechnologyForm({ technology }: { technology?: Technology }) {
  const navigate = useNavigate();
  const save = useSaveTechnology(technology?.id);
  const form = useForm<TechnologyFormValues>({
    resolver: zodResolver(technologyFormSchema),
    defaultValues: toTechnologyFormValues(technology),
    mode: 'onTouched',
  });
  const { control } = form;

  return (
    <FormPage
      form={form}
      title={technology ? `Düzenle: ${technology.name}` : 'Teknoloji ekle'}
      breadcrumbs={[
        { label: 'Teknolojiler', to: paths.technologies.list() },
        ...(technology
          ? [{ label: technology.name, to: paths.technologies.detail(technology.id) }]
          : []),
        { label: technology ? 'Düzenle' : 'Yeni' },
      ]}
      cancelTo={technology ? paths.technologies.detail(technology.id) : paths.technologies.list()}
      submitLabel={technology ? 'Değişiklikleri kaydet' : 'Teknoloji ekle'}
      onSubmit={async (values) =>
        paths.technologies.detail((await save.mutateAsync(toTechnologyInput(values))).id)
      }
      deleteAction={
        technology && (
          <TechnologyDeleteAction
            record={technology}
            onDeleted={() => void navigate(paths.technologies.list())}
          />
        )
      }
    >
      <SectionCard title="Teknoloji">
        <div className="c-form-grid">
          <TextField control={control} name="name" label="Ad" required />
          <MasterSelectField
            control={control}
            name="category"
            label="Kategori"
            list="technologyCategories"
            required
          />
          <MasterSelectField
            control={control}
            name="status"
            label="Durum"
            list="technologyStatuses"
            required
            description="Yeni işler için tercih edilen, desteklenen, kullanımdan kalkan (geçiş planlayın) veya emekli (desteklenmiyor)."
          />
          <TextField
            control={control}
            name="description"
            label="Açıklama"
            rows={3}
            className="c-form-grid__wide"
          />
        </div>
      </SectionCard>
    </FormPage>
  );
}

export default function TechnologyFormPage() {
  const { technologyId } = useParams();
  if (!technologyId) return <TechnologyForm />;
  return <EditTechnology id={technologyId} />;
}

function EditTechnology({ id }: { id: string }) {
  const query = useTechnology(id);
  return (
    <QueryView
      query={query}
      loadingLabel="Teknoloji yükleniyor"
      errorTitle="Bu teknoloji yüklenemedi"
    >
      {(technology) => <TechnologyForm technology={technology} />}
    </QueryView>
  );
}
