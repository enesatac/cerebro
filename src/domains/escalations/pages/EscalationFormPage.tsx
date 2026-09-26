import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { DeleteAction } from '@/components/actions/DeleteAction';
import { DateField } from '@/components/forms/DateField';
import { SelectField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { Can } from '@/domains/auth/components/Can';
import { usePersonOptions } from '@/domains/people/api/queries';
import { RelatedEntitiesFields } from '@/domains/risks/components/RelatedEntitiesFields';
import { readRelatedPrefill, relatedReturnPath } from '@/domains/risks/utils/relatedPrefill';
import { CRITICALITIES } from '@/domains/shared/types';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { useTeamOptions } from '@/domains/teams/api/queries';
import { toIsoDate } from '@/lib/dates';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteEscalation, useSaveEscalation } from '../api/mutations';
import { useEscalation } from '../api/queries';
import {
  escalationFormSchema,
  toEscalationFormValues,
  toEscalationInput,
  type EscalationFormValues,
} from '../schemas/escalationForm';
import { ESCALATION_STATUSES, type Escalation } from '../types';
import { ESCALATION_STATUS_PRESENTATION } from '../utils/escalationPresentation';

function EscalationForm({ escalation }: { escalation?: Escalation }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { escalations } = useRepositories();
  const save = useSaveEscalation(escalation?.id);
  const remove = useDeleteEscalation();
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
      title={escalation ? 'Edit escalation' : 'Raise an escalation'}
      subtitle={escalation?.title}
      breadcrumbs={[
        { label: 'Risks & Escalations', to: paths.risks('escalations') },
        { label: escalation ? 'Edit escalation' : 'New escalation' },
      ]}
      cancelTo={returnTo}
      submitLabel={escalation ? 'Save changes' : 'Raise escalation'}
      onSubmit={async (values) => {
        await save.mutateAsync(toEscalationInput(values));
        return returnTo;
      }}
      deleteAction={
        escalation && (
          <Can permission="portfolio:delete">
            <DeleteAction
              entityLabel="escalation"
              entityName={escalation.title}
              impactKey={['escalation', escalation.id]}
              loadImpact={() => escalations.getDeletionImpact(escalation.id)}
              onDelete={() => remove.mutateAsync(escalation.id)}
              onDeleted={() => void navigate(paths.risks('escalations'))}
            />
          </Can>
        )
      }
    >
      <SectionCard title="Escalation">
        <div className="c-form-grid">
          <TextField
            control={control}
            name="title"
            label="Title"
            required
            className="c-form-grid__wide"
          />
          <TextField
            control={control}
            name="description"
            label="Description"
            rows={3}
            className="c-form-grid__wide"
          />
          <SelectField
            control={control}
            name="severity"
            label="Severity"
            required
            options={CRITICALITIES.map((value) => ({
              value,
              label: CRITICALITY_PRESENTATION[value].label,
            }))}
          />
          <SelectField
            control={control}
            name="status"
            label="Status"
            required
            options={ESCALATION_STATUSES.map((value) => ({
              value,
              label: ESCALATION_STATUS_PRESENTATION[value].label,
            }))}
          />
        </div>
      </SectionCard>
      <SectionCard title="Responsibility">
        <div className="c-form-grid">
          <SelectField
            control={control}
            name="raisedById"
            label="Raised by"
            required
            options={people}
          />
          <DateField control={control} name="raisedAt" label="Raised on" required />
          <SelectField
            control={control}
            name="ownerId"
            label="Owner"
            options={people}
            emptyLabel="Unassigned"
          />
          <SelectField
            control={control}
            name="responsibleTeamId"
            label="Responsible team"
            options={teams}
            emptyLabel="No team"
          />
          <DateField control={control} name="targetResolutionDate" label="Target resolution" />
        </div>
      </SectionCard>
      <SectionCard title="Resolution">
        <TextField
          control={control}
          name="resolution"
          label="Resolution"
          rows={3}
          description="Required when the escalation is resolved or closed."
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
  return escalationId ? <EditEscalation id={escalationId} /> : <EscalationForm />;
}

function EditEscalation({ id }: { id: string }) {
  const query = useEscalation(id);
  return (
    <QueryView
      query={query}
      loadingLabel="Loading escalation"
      errorTitle="This escalation could not be loaded"
    >
      {(escalation) => <EscalationForm escalation={escalation} />}
    </QueryView>
  );
}
