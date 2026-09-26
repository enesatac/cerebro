import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { DeleteAction } from '@/components/actions/DeleteAction';
import { DateField } from '@/components/forms/DateField';
import { ChipsField, MultiSelectField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { Can } from '@/domains/auth/components/Can';
import { usePersonOptions } from '@/domains/people/api/queries';
import { RelatedEntitiesFields } from '@/domains/risks/components/RelatedEntitiesFields';
import { readRelatedPrefill, relatedReturnPath } from '@/domains/risks/utils/relatedPrefill';
import { toIsoDate } from '@/lib/dates';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteDecision, useSaveDecision } from '../api/mutations';
import { useDecision } from '../api/queries';
import {
  decisionFormSchema,
  toDecisionFormValues,
  toDecisionInput,
  type DecisionFormValues,
} from '../schemas/decisionForm';
import { type Decision } from '../types';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';

function DecisionForm({ decision }: { decision?: Decision }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { decisions } = useRepositories();
  const save = useSaveDecision(decision?.id);
  const remove = useDeleteDecision();
  const people = usePersonOptions();
  const form = useForm<DecisionFormValues>({
    resolver: zodResolver(decisionFormSchema),
    defaultValues: toDecisionFormValues(
      decision,
      readRelatedPrefill(params),
      toIsoDate(new Date()),
    ),
    mode: 'onTouched',
  });
  const { control } = form;
  const firstProject = decision?.relatedProjectIds[0];
  const returnTo = relatedReturnPath(
    params,
    {
      application: (id) => paths.applications.detail(id),
      project: (id) => `${paths.projects.detail(id)}?tab=decisions`,
    },
    firstProject ? `${paths.projects.detail(firstProject)}?tab=decisions` : paths.projects.list(),
  );

  return (
    <FormPage
      form={form}
      title={decision ? 'Kararı düzenle' : 'Karar kaydet'}
      subtitle="Hafif bir mimari karar kaydı (ADR): bağlam, karar, gerekçe ve sonuçlar."
      breadcrumbs={[
        { label: 'Projeler', to: paths.projects.list() },
        { label: decision ? 'Kararı düzenle' : 'Yeni karar' },
      ]}
      cancelTo={returnTo}
      submitLabel={decision ? 'Değişiklikleri kaydet' : 'Karar kaydet'}
      onSubmit={async (values) => {
        await save.mutateAsync(toDecisionInput(values));
        return returnTo;
      }}
      deleteAction={
        decision && (
          <Can permission="portfolio:delete">
            <DeleteAction
              entityLabel="karar"
              entityName={decision.title}
              impactKey={['decision', decision.id]}
              loadImpact={() => decisions.getDeletionImpact(decision.id)}
              onDelete={() => remove.mutateAsync(decision.id)}
              onDeleted={() => void navigate(returnTo)}
            />
          </Can>
        )
      }
    >
      <SectionCard title="Karar">
        <div className="c-form-grid">
          <TextField
            control={control}
            name="title"
            label="Başlık"
            required
            className="c-form-grid__wide"
          />
          <MasterSelectField
            control={control}
            name="status"
            label="Durum"
            required
            list="decisionStatuses"
          />
          <DateField control={control} name="decisionDate" label="Karar tarihi" required />
          <MultiSelectField
            control={control}
            name="decidedByIds"
            label="Karar verenler"
            options={people}
            addLabel="Karar verici ekle"
            required
            className="c-form-grid__wide"
          />
        </div>
      </SectionCard>
      <SectionCard title="Kayıt">
        <div className="c-stack">
          <TextField
            control={control}
            name="context"
            label="Bağlam"
            rows={3}
            required
            description="Karar verilmesini gerektiren durum ve etkenler."
          />
          <TextField control={control} name="decision" label="Karar" rows={3} required />
          <TextField control={control} name="rationale" label="Gerekçe" rows={3} />
          <ChipsField control={control} name="alternatives" label="Değerlendirilen alternatifler" />
          <TextField control={control} name="consequences" label="Sonuçlar" rows={3} />
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

export default function DecisionFormPage() {
  const { decisionId } = useParams();
  return decisionId ? <EditDecision id={decisionId} /> : <DecisionForm />;
}

function EditDecision({ id }: { id: string }) {
  const query = useDecision(id);
  return (
    <QueryView query={query} loadingLabel="Karar yükleniyor" errorTitle="Bu karar yüklenemedi">
      {(decision) => <DecisionForm decision={decision} />}
    </QueryView>
  );
}
