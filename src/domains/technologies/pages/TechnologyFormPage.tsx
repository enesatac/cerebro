import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { DeleteAction } from '@/components/actions/DeleteAction';
import { SelectField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { Can } from '@/domains/auth/components/Can';
import { useRepositories } from '@/services/RepositoryContext';
import { useTechnology } from '../api/queries';
import { useDeleteTechnology, useSaveTechnology } from '../api/mutations';
import {
  technologyFormSchema,
  toTechnologyFormValues,
  toTechnologyInput,
  type TechnologyFormValues,
} from '../schemas/technologyForm';
import { TECHNOLOGY_CATEGORIES, TECHNOLOGY_STATUSES, type Technology } from '../types';
import {
  TECHNOLOGY_CATEGORY_LABELS,
  TECHNOLOGY_STATUS_PRESENTATION,
} from '../utils/technologyPresentation';

const CATEGORY_OPTIONS = TECHNOLOGY_CATEGORIES.map((value) => ({
  value,
  label: TECHNOLOGY_CATEGORY_LABELS[value],
}));
const STATUS_OPTIONS = TECHNOLOGY_STATUSES.map((value) => ({
  value,
  label: TECHNOLOGY_STATUS_PRESENTATION[value].label,
}));

function TechnologyForm({ technology }: { technology?: Technology }) {
  const navigate = useNavigate();
  const { technologies } = useRepositories();
  const save = useSaveTechnology(technology?.id);
  const remove = useDeleteTechnology();
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
          <Can permission="portfolio:delete">
            <DeleteAction
              entityLabel="teknoloji"
              entityName={technology.name}
              impactKey={['technology', technology.id]}
              loadImpact={() => technologies.getDeletionImpact(technology.id)}
              onDelete={() => remove.mutateAsync(technology.id)}
              onDeleted={() => void navigate(paths.technologies.list())}
            />
          </Can>
        )
      }
    >
      <SectionCard title="Teknoloji">
        <div className="c-form-grid">
          <TextField control={control} name="name" label="Ad" required />
          <SelectField
            control={control}
            name="category"
            label="Kategori"
            options={CATEGORY_OPTIONS}
            required
          />
          <SelectField
            control={control}
            name="status"
            label="Durum"
            options={STATUS_OPTIONS}
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
