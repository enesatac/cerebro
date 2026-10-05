import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { QueryView } from '@/components/feedback/QueryView';
import { DateField } from '@/components/forms/DateField';
import { SelectField, SwitchField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationOptions } from '@/domains/applications/api/queries';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { usePersonOptions } from '@/domains/people/api/queries';
import { useProjectOptions } from '@/domains/projects/api/queries';
import type { EntityId } from '@/domains/shared/types';
import { parseId } from '@/lib/urlParams';
import { useSaveRelease } from '../api/mutations';
import { useRelease } from '../api/queries';
import { ReleaseDeleteAction } from '../components/ReleaseDeleteAction';
import {
  releaseFormSchema,
  toReleaseFormValues,
  toReleaseInput,
  type ReleaseFormValues,
} from '../schemas/releaseForm';
import type { Release } from '../types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function ReleaseForm({ release }: { release?: Release }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const save = useSaveRelease(release?.id);
  const applications = useApplicationOptions();
  const projects = useProjectOptions();
  const people = usePersonOptions();
  const date = params.get('date');
  const prefill = {
    applicationId: parseId(params.get('application')),
    projectId: parseId(params.get('project')),
    date: date && ISO_DATE.test(date) ? date : null,
  };
  const form = useForm<ReleaseFormValues>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: toReleaseFormValues(release, prefill),
    mode: 'onTouched',
  });
  const { control } = form;
  const cancelTo = release
    ? paths.releases.detail(release.id)
    : prefill.applicationId
      ? `${paths.applications.detail(prefill.applicationId)}?tab=releases`
      : prefill.projectId
        ? `${paths.projects.detail(prefill.projectId)}?tab=releases`
        : paths.releases.list();

  return (
    <FormPage
      form={form}
      title={release ? 'Canlı geçişi düzenle' : 'Canlı geçiş ekle'}
      subtitle={release ? `${release.releaseNumber} · ${release.title}` : undefined}
      breadcrumbs={[
        { label: 'Canlı geçişler', to: paths.releases.list() },
        ...(release
          ? [{ label: release.releaseNumber, to: paths.releases.detail(release.id) }]
          : []),
        { label: release ? 'Düzenle' : 'Yeni geçiş' },
      ]}
      cancelTo={cancelTo}
      submitLabel={release ? 'Değişiklikleri kaydet' : 'Geçişi kaydet'}
      onSubmit={async (values) => {
        const saved = await save.mutateAsync(toReleaseInput(values));
        return paths.releases.detail(saved.id);
      }}
      deleteAction={
        release && (
          <ReleaseDeleteAction
            record={release}
            onDeleted={() => void navigate(paths.releases.list())}
          />
        )
      }
    >
      <SectionCard title="Geçiş">
        <div className="c-form-grid">
          <TextField
            control={control}
            name="releaseNumber"
            label="Geçiş no"
            required
            placeholder="ör. CHG-2026-0412"
            description="Değişiklik yönetimindeki kayıt numarası; her geçiş için tektir."
          />
          <TextField
            control={control}
            name="title"
            label="Başlık"
            required
            placeholder="ör. Ödeme yönlendirme yeni sağlayıcı"
          />
          <SelectField
            control={control}
            name="applicationId"
            label="Uygulama"
            required
            options={applications}
            description="Canlıya geçen uygulama; geçiş bu uygulamanın sayfasında da görünür."
          />
          <SelectField
            control={control}
            name="projectId"
            label="Proje"
            options={projects}
            emptyLabel="Projeye bağlı değil"
            description="Geçiş bir projenin teslimatıysa seçin."
          />
          <MasterSelectField
            control={control}
            name="type"
            label="Tür"
            required
            list="releaseTypes"
          />
          <MasterSelectField
            control={control}
            name="status"
            label="Durum"
            required
            list="releaseStatuses"
          />
          <TextField control={control} name="version" label="Sürüm" placeholder="ör. 4.12.0" />
          <SelectField
            control={control}
            name="ownerId"
            label="Geçiş sorumlusu"
            options={people}
            emptyLabel="Atanmamış"
          />
        </div>
      </SectionCard>
      <SectionCard
        title="Zaman"
        description="Geçiş penceresi; bitiş başlangıçtan önceyse gece yarısını geçer."
      >
        <div className="c-form-grid">
          <DateField control={control} name="plannedDate" label="Geçiş tarihi" required />
          <TextField
            control={control}
            name="startTime"
            label="Başlangıç saati"
            placeholder="ör. 23:00"
          />
          <TextField control={control} name="endTime" label="Bitiş saati" placeholder="ör. 01:30" />
          <SwitchField
            control={control}
            name="serviceInterruption"
            label="Hizmet kesintisi var"
            description="Geçiş sırasında kullanıcılar hizmeti kullanamaz."
          />
        </div>
      </SectionCard>
      <SectionCard title="Detaylar">
        <div className="c-form-grid">
          <TextField
            control={control}
            name="description"
            label="Geçiş detayları"
            rows={5}
            className="c-form-grid__wide"
            description="Neler değişiyor: kapsam, ilgili kayıtlar, bağımlılıklar, riskler."
          />
          <TextField
            control={control}
            name="rollbackPlan"
            label="Geri alma planı"
            rows={3}
            className="c-form-grid__wide"
          />
          <TextField
            control={control}
            name="outcomeNote"
            label="Sonuç notu"
            rows={3}
            className="c-form-grid__wide"
            description="Geçiş sonrasında: nasıl geçti, sorun yaşandı mı."
          />
        </div>
      </SectionCard>
    </FormPage>
  );
}

function EditRelease({ id }: { id: EntityId }) {
  const query = useRelease(id);
  return (
    <QueryView
      query={query}
      loadingLabel="Canlı geçiş yükleniyor"
      errorTitle="Bu canlı geçiş yüklenemedi"
    >
      {(release) => <ReleaseForm release={release} />}
    </QueryView>
  );
}

export default function ReleaseFormPage() {
  const { releaseId } = useParams();
  return releaseId ? <EditRelease id={parseId(releaseId) ?? 0} /> : <ReleaseForm />;
}
