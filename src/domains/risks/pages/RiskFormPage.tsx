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
import { useSaveRisk } from '../api/mutations';
import { useRisk } from '../api/queries';
import { RelatedEntitiesFields } from '../components/RelatedEntitiesFields';
import {
  riskFormSchema,
  toRiskFormValues,
  toRiskInput,
  type RiskFormValues,
} from '../schemas/riskForm';
import { RISK_LIKELIHOODS, type Risk } from '../types';
import { readRelatedPrefill, relatedReturnPath } from '../utils/relatedPrefill';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { RiskDeleteAction } from '../components/RiskDeleteAction';
import { parseId } from '@/lib/urlParams';

function RiskForm({ risk }: { risk?: Risk }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const save = useSaveRisk(risk?.id);
  const people = usePersonOptions();
  const form = useForm<RiskFormValues>({
    resolver: zodResolver(riskFormSchema),
    defaultValues: toRiskFormValues(risk, readRelatedPrefill(params)),
    mode: 'onTouched',
  });
  const { control } = form;
  const returnTo = relatedReturnPath(
    params,
    {
      application: (id) => `${paths.applications.detail(id)}?tab=risks`,
      project: (id) => `${paths.projects.detail(id)}?tab=risks`,
    },
    paths.risks('risks'),
  );

  return (
    <FormPage
      form={form}
      title={risk ? 'Riski düzenle' : 'Risk kaydet'}
      subtitle={risk?.title}
      breadcrumbs={[
        { label: 'Riskler ve Eskalasyonlar', to: paths.risks('risks') },
        { label: risk ? 'Riski düzenle' : 'Yeni risk' },
      ]}
      cancelTo={returnTo}
      submitLabel={risk ? 'Değişiklikleri kaydet' : 'Risk kaydet'}
      onSubmit={async (values) => {
        await save.mutateAsync(toRiskInput(values));
        return returnTo;
      }}
      deleteAction={
        risk && (
          <RiskDeleteAction record={risk} onDeleted={() => void navigate(paths.risks('risks'))} />
        )
      }
    >
      <SectionCard title="Risk">
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
            name="category"
            label="Kategori"
            required
            list="riskCategories"
          />
          <MasterSelectField
            control={control}
            name="status"
            label="Durum"
            required
            list="riskStatuses"
          />
        </div>
      </SectionCard>
      <SectionCard title="Değerlendirme">
        <div className="c-form-grid c-form-grid--three">
          <MasterSelectField
            control={control}
            name="probability"
            label="Olasılık"
            required
            list="criticalities"
            only={RISK_LIKELIHOODS}
          />
          <MasterSelectField
            control={control}
            name="impact"
            label="Etki"
            required
            list="criticalities"
            only={RISK_LIKELIHOODS}
          />
          <MasterSelectField
            control={control}
            name="severity"
            label="Önem derecesi"
            required
            list="criticalities"
            description="Önceliklendirmede kullanılan genel derece."
          />
        </div>
      </SectionCard>
      <SectionCard title="Sahiplik ve azaltma">
        <div className="c-form-grid">
          <SelectField
            control={control}
            name="ownerId"
            label="Sahip"
            options={people}
            emptyLabel="Atanmamış"
          />
          <DateField control={control} name="dueDate" label="Termin tarihi" />
          <TextField
            control={control}
            name="mitigationPlan"
            label="Azaltma planı"
            rows={3}
            className="c-form-grid__wide"
          />
        </div>
      </SectionCard>
      <RelatedEntitiesFields
        control={control}
        applicationsName="relatedApplicationIds"
        projectsName="relatedProjectIds"
      />
    </FormPage>
  );
}

export default function RiskFormPage() {
  const { riskId } = useParams();
  return riskId ? <EditRisk id={parseId(riskId) ?? 0} /> : <RiskForm />;
}

function EditRisk({ id }: { id: EntityId }) {
  const query = useRisk(id);
  return (
    <QueryView query={query} loadingLabel="Risk yükleniyor" errorTitle="Bu risk yüklenemedi">
      {(risk) => <RiskForm risk={risk} />}
    </QueryView>
  );
}
