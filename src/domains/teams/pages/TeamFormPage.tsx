import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { DeleteAction } from '@/components/actions/DeleteAction';
import { ChipsField, MultiSelectField, SelectField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { Can } from '@/domains/auth/components/Can';
import { usePersonOptions } from '@/domains/people/api/queries';
import { useRepositories } from '@/services/RepositoryContext';
import { useTeam } from '../api/queries';
import { useDeleteTeam, useSaveTeam } from '../api/mutations';
import {
  teamFormSchema,
  toTeamFormValues,
  toTeamInput,
  type TeamFormValues,
} from '../schemas/teamForm';
import type { Team } from '../types';

function TeamForm({ team }: { team?: Team }) {
  const navigate = useNavigate();
  const { teams } = useRepositories();
  const save = useSaveTeam(team?.id);
  const remove = useDeleteTeam();
  const people = usePersonOptions();
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: toTeamFormValues(team),
    mode: 'onTouched',
  });
  const { control } = form;

  return (
    <FormPage
      form={form}
      title={team ? `Edit ${team.name}` : 'Create team'}
      breadcrumbs={[
        { label: 'Teams', to: paths.teams.list() },
        ...(team ? [{ label: team.name, to: paths.teams.detail(team.id) }] : []),
        { label: team ? 'Edit' : 'New' },
      ]}
      cancelTo={team ? paths.teams.detail(team.id) : paths.teams.list()}
      submitLabel={team ? 'Save changes' : 'Create team'}
      onSubmit={async (values) =>
        paths.teams.detail((await save.mutateAsync(toTeamInput(values))).id)
      }
      deleteAction={
        team && (
          <Can permission="portfolio:delete">
            <DeleteAction
              entityLabel="team"
              entityName={team.name}
              impactKey={['team', team.id]}
              loadImpact={() => teams.getDeletionImpact(team.id)}
              onDelete={() => remove.mutateAsync(team.id)}
              onDeleted={() => void navigate(paths.teams.list())}
            />
          </Can>
        )
      }
    >
      <SectionCard title="Team">
        <div className="c-form-grid">
          <TextField control={control} name="name" label="Team name" required />
          <SelectField
            control={control}
            name="managerId"
            label="Manager"
            options={people}
            emptyLabel="No manager"
          />
          <TextField
            control={control}
            name="description"
            label="Description"
            rows={3}
            className="c-form-grid__wide"
          />
          <ChipsField
            control={control}
            name="responsibilities"
            label="Responsibilities"
            className="c-form-grid__wide"
          />
        </div>
      </SectionCard>
      <SectionCard
        title="Contact"
        description="Shared channels only — never personal phone numbers."
      >
        <div className="c-form-grid">
          <TextField
            control={control}
            name="contactEmail"
            label="Team mailbox"
            type="email"
            placeholder="team@corp.example"
          />
          <TextField
            control={control}
            name="chatChannel"
            label="Chat channel"
            placeholder="#team-channel"
          />
        </div>
      </SectionCard>
      <SectionCard title="Members">
        <MultiSelectField
          control={control}
          name="memberIds"
          label="Members"
          options={people}
          addLabel="Add a member"
          description="The manager is added automatically."
        />
      </SectionCard>
    </FormPage>
  );
}

export default function TeamFormPage() {
  const { teamId } = useParams();
  return teamId ? <EditTeam id={teamId} /> : <TeamForm />;
}

function EditTeam({ id }: { id: string }) {
  const query = useTeam(id);
  return (
    <QueryView query={query} loadingLabel="Loading team" errorTitle="This team could not be loaded">
      {(team) => <TeamForm team={team} />}
    </QueryView>
  );
}
