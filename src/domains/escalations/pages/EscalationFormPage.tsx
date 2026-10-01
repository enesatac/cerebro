import { zodResolver } from '@hookform/resolvers/zod';
import type { EntityId } from '@/domains/shared/types';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { DateField } from '@/components/forms/DateField';
import { SelectField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { usePersonOptions } from '@/domains/people/api/queries';
import { RelatedEntitiesFields } from '@/domains/risks/components/RelatedEntitiesFields';
import { readRelatedPrefill, relatedReturnPath } from '@/domains/risks/utils/relatedPrefill';
import { useTeamOptions } from '@/domains/teams/api/queries';
import { toIsoDate } from '@/lib/dates';
import { useSaveEscalation } from '../api/mutations';
import { useEscalation } from '../api/queries';
import {
  escalationFormSchema,
  toEscalationFormValues,
  toEscalationInput,
  type EscalationFormValues,
} from '../schemas/escalationForm';
import { type Escalation } from '../types';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { EscalationDeleteAction } from '../components/EscalationDeleteAction';
import { parseId } from '@/lib/urlParams';

function EscalationForm({ escalation }: { escalation?: Escalation }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const save = useSaveEscalation(escalation?.id);
  const people = usePersonOptions();
  const teams = useTeamOptions();
  const form = useForm<EscalationFormValues>({
    resolver: zodResolver(escalationFormSchema),
    defaultValues: toEscalationFormValues(
      escalation,
      readRelatedPrefill(params),
      toIsoDate(new Date()),
    ),
    mode: 'onTouched',
  });
  const { control } = form;
  const returnTo = relatedReturnPath(
    params,
    {
      application: (id) => `${paths.applications.detail(id)}?tab=risks`,
      project: (id) => `${paths.projects.detail(id)}?tab=risks`,
    },
    paths.risks('escalations'),
  );

  return (
    <FormPage
      form={form}
      title={escalation ? 'Eskalasyonu düzenle' : 'Eskalasyon aç'}
      subtitle={escalation?.title}
      breadcrumbs={[
        { label: 'Riskler ve Eskalasyonlar', to: paths.risks('escalations') },
        { label: escalation ? 'Eskalasyonu düzenle' : 'Yeni eskalasyon' },
      ]}
      cancelTo={returnTo}
      submitLabel={escalation ? 'Değişiklikleri kaydet' : 'Eskalasyon aç'}
      onSubmit={async (values) => {
        await save.mutateAsync(toEscalationInput(values));
        return returnTo;
      }}
      deleteAction={
        escalation && (
          <EscalationDeleteAction
            record={escalation}
            onDeleted={() => void navigate(paths.risks('escalations'))}
          />
        )
      }
    >
      <SectionCard title="Eskalasyon">
        <div className="c-form-grid">
          <TextField
            control={control}
            name="title"
            label="Başlık"
            required
            className="c-form-grid__wide"
          />
          <TextField
            control={control}
            name="description"
            label="Açıklama"
            rows={3}
            className="c-form-grid__wide"
          />
          <MasterSelectField
            control={control}
            name="severity"
            label="Önem derecesi"
            required
            list="criticalities"
          />
          <MasterSelectField
            control={control}
            name="status"
            label="Durum"
            required
            list="escalationStatuses"
          />
        </div>
      </SectionCard>
      <SectionCard title="Sorumluluk">
        <div className="c-form-grid">
          <SelectField control={control} name="raisedById" label="Açan" required options={people} />
          <DateField control={control} name="raisedAt" label="Açılış tarihi" required />
          <SelectField
            control={control}
            name="ownerId"
            label="Sahip"
            options={people}
            emptyLabel="Atanmamış"
          />
          <SelectField
            control={control}
            name="responsibleTeamId"
            label="Sorumlu ekip"
            options={teams}
            emptyLabel="Ekip yok"
          />
          <DateField control={control} name="targetResolutionDate" label="Hedef çözüm" />
        </div>
      </SectionCard>
      <SectionCard title="Çözüm">
        <TextField
          control={control}
          name="resolution"
          label="Çözüm"
          rows={3}
          description="Eskalasyon çözüldüğünde veya kapatıldığında zorunludur."
        />
        <DateField
          control={control}
          name="resolvedOn"
          label="Çözüm tarihi"
          description="Boş bırakılırsa, Çözüldü veya Kapatıldı olarak kaydedildiği gün kullanılır. Raporlardaki çözüm süreleri bu tarihten hesaplanır."
        />
      </SectionCard>
      <RelatedEntitiesFields
        control={control}
        applicationsName="relatedApplicationIds"
        projectsName="relatedProjectIds"
      />
    </FormPage>
  );
}

export default function EscalationFormPage() {
  const { escalationId } = useParams();
  return escalationId ? <EditEscalation id={parseId(escalationId) ?? 0} /> : <EscalationForm />;
}

function EditEscalation({ id }: { id: EntityId }) {
  const query = useEscalation(id);
  return (
    <QueryView
      query={query}
      loadingLabel="Eskalasyon yükleniyor"
      errorTitle="Bu eskalasyon yüklenemedi"
    >
      {(escalation) => <EscalationForm escalation={escalation} />}
    </QueryView>
  );
}
