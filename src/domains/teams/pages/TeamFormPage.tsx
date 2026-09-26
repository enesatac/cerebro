import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { ChipsField, MultiSelectField, SelectField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { usePersonOptions } from '@/domains/people/api/queries';
import { useTeam } from '../api/queries';
import { useSaveTeam } from '../api/mutations';
import {
  teamFormSchema,
  toTeamFormValues,
  toTeamInput,
  type TeamFormValues,
} from '../schemas/teamForm';
import type { Team } from '../types';
import { TeamDeleteAction } from '../components/TeamDeleteAction';

function TeamForm({ team }: { team?: Team }) {
  const navigate = useNavigate();
  const save = useSaveTeam(team?.id);
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
      title={team ? `Düzenle: ${team.name}` : 'Ekip oluştur'}
      breadcrumbs={[
        { label: 'Ekipler', to: paths.teams.list() },
        ...(team ? [{ label: team.name, to: paths.teams.detail(team.id) }] : []),
        { label: team ? 'Düzenle' : 'Yeni' },
      ]}
      cancelTo={team ? paths.teams.detail(team.id) : paths.teams.list()}
      submitLabel={team ? 'Değişiklikleri kaydet' : 'Ekip oluştur'}
      onSubmit={async (values) =>
        paths.teams.detail((await save.mutateAsync(toTeamInput(values))).id)
      }
      deleteAction={
        team && (
          <TeamDeleteAction record={team} onDeleted={() => void navigate(paths.teams.list())} />
        )
      }
    >
      <SectionCard title="Ekip">
        <div className="c-form-grid">
          <TextField control={control} name="name" label="Ekip adı" required />
          <SelectField
            control={control}
            name="managerId"
            label="Yönetici"
            options={people}
            emptyLabel="Yönetici yok"
          />
          <TextField
            control={control}
            name="description"
            label="Açıklama"
            rows={3}
            className="c-form-grid__wide"
          />
          <ChipsField
            control={control}
            name="responsibilities"
            label="Sorumluluklar"
            className="c-form-grid__wide"
          />
        </div>
      </SectionCard>
      <SectionCard
        title="İletişim"
        description="Yalnızca ortak kanallar — asla kişisel telefon numarası yazmayın."
      >
        <div className="c-form-grid">
          <TextField
            control={control}
            name="contactEmail"
            label="Ekip e-posta kutusu"
            type="email"
            placeholder="team@corp.example"
          />
          <TextField
            control={control}
            name="chatChannel"
            label="Sohbet kanalı"
            placeholder="#team-channel"
          />
        </div>
      </SectionCard>
      <SectionCard title="Üyeler">
        <MultiSelectField
          control={control}
          name="memberIds"
          label="Üyeler"
          options={people}
          addLabel="Üye ekle"
          description="Yönetici otomatik olarak eklenir."
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
    <QueryView query={query} loadingLabel="Ekip yükleniyor" errorTitle="Bu ekip yüklenemedi">
      {(team) => <TeamForm team={team} />}
    </QueryView>
  );
}
