import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { DeleteAction } from '@/components/actions/DeleteAction';
import { DateField } from '@/components/forms/DateField';
import { ChipsField, MultiSelectField, SelectField, TextField } from '@/components/forms/fields';
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
import { DECISION_STATUSES, type Decision } from '../types';
import { DECISION_STATUS_PRESENTATION } from '../utils/decisionPresentation';

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
      title={decision ? 'Edit decision' : 'Record a decision'}
      subtitle="A lightweight architecture decision record: context, decision, rationale and consequences."
      breadcrumbs={[
        { label: 'Projects', to: paths.projects.list() },
        { label: decision ? 'Edit decision' : 'New decision' },
      ]}
      cancelTo={returnTo}
      submitLabel={decision ? 'Save changes' : 'Record decision'}
      onSubmit={async (values) => {
        await save.mutateAsync(toDecisionInput(values));
        return returnTo;
      }}
      deleteAction={
        decision && (
          <Can permission="portfolio:delete">
            <DeleteAction
              entityLabel="decision"
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
      <SectionCard title="Decision">
        <div className="c-form-grid">
          <TextField
            control={control}
            name="title"
            label="Title"
            required
            className="c-form-grid__wide"
          />
          <SelectField
            control={control}
            name="status"
            label="Status"
            required
            options={DECISION_STATUSES.map((value) => ({
              value,
              label: DECISION_STATUS_PRESENTATION[value].label,
            }))}
          />
          <DateField control={control} name="decisionDate" label="Decision date" required />
          <MultiSelectField
            control={control}
            name="decidedByIds"
            label="Decided by"
            options={people}
            addLabel="Add a decision maker"
            required
            className="c-form-grid__wide"
          />
        </div>
      </SectionCard>
      <SectionCard title="Record">
        <div className="c-stack">
          <TextField
            control={control}
            name="context"
            label="Context"
            rows={3}
            required
            description="The situation and forces that required a decision."
          />
          <TextField control={control} name="decision" label="Decision" rows={3} required />
          <TextField control={control} name="rationale" label="Rationale" rows={3} />
          <ChipsField control={control} name="alternatives" label="Alternatives considered" />
          <TextField control={control} name="consequences" label="Consequences" rows={3} />
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
    <QueryView
      query={query}
      loadingLabel="Loading decision"
      errorTitle="This decision could not be loaded"
    >
      {(decision) => <DecisionForm decision={decision} />}
    </QueryView>
  );
}
