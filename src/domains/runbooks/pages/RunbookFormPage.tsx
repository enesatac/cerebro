import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, type Control } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { NotFoundState } from '@/components/feedback/NotFoundState';
import { DateField } from '@/components/forms/DateField';
import { SelectField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { RepeatableList } from '@/components/forms/RepeatableList';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplication } from '@/domains/applications/api/queries';
import type { Application } from '@/domains/applications/types';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { usePersonOptions } from '@/domains/people/api/queries';
import { useTeamOptions } from '@/domains/teams/api/queries';
import { isNotFoundError } from '@/lib/errors';
import { parseId } from '@/lib/urlParams';
import { useSaveRunbook } from '../api/mutations';
import { useRunbook } from '../api/queries';
import { RunbookDeleteAction } from '../components/RunbookDeleteAction';
import {
  emptyRunbookContact,
  emptyRunbookLink,
  emptyRunbookScenario,
  runbookFormSchema,
  toRunbookFormValues,
  toRunbookInput,
  type RunbookFormValues,
} from '../schemas/runbookForm';
import type { Runbook } from '../types';

type Props = { control: Control<RunbookFormValues> };

const STEPS_HELP = 'Her satır bir adım. Sırayla yazın; numara eklemenize gerek yok.';

function LinksSection({ control }: Props) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'links' });
  return (
    <SectionCard
      title="Kontrol edilecek adresler"
      description="Panolar, log aramaları, sağlık kontrolleri, durum sayfaları. Her birinde neye bakılacağını yazın."
    >
      <RepeatableList
        items={fields}
        onAdd={() => append(emptyRunbookLink())}
        onRemove={remove}
        onMove={move}
        itemLabel={(index) => `${index + 1}. adres`}
        addLabel="Adres ekle"
        removeLabel={(index) => `${index + 1}. adresi kaldır`}
        emptyText="Henüz adres eklenmedi."
        renderItem={(index) => (
          <div className="c-form-grid c-form-grid--three">
            <MasterSelectField
              control={control}
              name={`links.${index}.type`}
              label="Tür"
              required
              list="runbookLinkTypes"
            />
            <TextField control={control} name={`links.${index}.label`} label="Ad" required />
            <TextField
              control={control}
              name={`links.${index}.url`}
              label="Adres"
              type="url"
              required
              placeholder="https://"
            />
            <TextField
              control={control}
              name={`links.${index}.note`}
              label="Ne kontrol edilmeli"
              placeholder="ör. 5xx oranı %1'i geçiyorsa sorun var"
              className="c-form-grid__wide"
            />
          </div>
        )}
      />
    </SectionCard>
  );
}

function ContactsSection({ control }: Props) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'contacts' });
  const people = usePersonOptions();
  const teams = useTeamOptions();
  return (
    <SectionCard
      title="Aranacak kişiler"
      description="Eskalasyon sırasına göre: önce aranacak en üstte. Telefon, kanal ve nöbet hattı yazabilirsiniz — şifre veya erişim bilgisi asla."
    >
      <RepeatableList
        items={fields}
        onAdd={() => append(emptyRunbookContact())}
        onRemove={remove}
        onMove={move}
        itemLabel={(index) => `${index + 1}. kişi`}
        addLabel="Kişi ekle"
        removeLabel={(index) => `${index + 1}. kişiyi kaldır`}
        emptyText="Henüz kimse eklenmedi."
        renderItem={(index) => (
          <div className="c-form-grid c-form-grid--three">
            <TextField
              control={control}
              name={`contacts.${index}.label`}
              label="Rol / seviye"
              required
              placeholder="ör. 1. seviye — nöbetçi destek"
            />
            <SelectField
              control={control}
              name={`contacts.${index}.personId`}
              label="Kişi"
              options={people}
              emptyLabel="Kişi yok"
            />
            <SelectField
              control={control}
              name={`contacts.${index}.teamId`}
              label="Ekip"
              options={teams}
              emptyLabel="Ekip yok"
            />
            <TextField
              control={control}
              name={`contacts.${index}.channel`}
              label="İletişim"
              placeholder="ör. Nöbet hattı: dahili 4410 · #app-support"
            />
            <TextField
              control={control}
              name={`contacts.${index}.when`}
              label="Ne zaman aranır"
              placeholder="ör. 15 dakikada çözülmezse"
              className="c-form-grid__wide"
            />
          </div>
        )}
      />
    </SectionCard>
  );
}

function ScenariosSection({ control }: Props) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'scenarios' });
  return (
    <SectionCard
      title="Bilinen sorunlar"
      description="Daha önce yaşanmış veya beklenen sorunlar: nasıl görünür ve nasıl çözülür."
    >
      <RepeatableList
        items={fields}
        onAdd={() => append(emptyRunbookScenario())}
        onRemove={remove}
        onMove={move}
        itemLabel={(index) => `${index + 1}. sorun`}
        addLabel="Sorun ekle"
        removeLabel={(index) => `${index + 1}. sorunu kaldır`}
        emptyText="Henüz bilinen sorun eklenmedi."
        renderItem={(index) => (
          <div className="c-form-grid">
            <TextField
              control={control}
              name={`scenarios.${index}.title`}
              label="Sorun"
              required
              placeholder="ör. Kart sağlayıcısı zaman aşımı veriyor"
              className="c-form-grid__wide"
            />
            <TextField
              control={control}
              name={`scenarios.${index}.symptoms`}
              label="Belirtiler"
              rows={2}
              placeholder="Nasıl fark edilir? Hangi alarm, hangi hata mesajı?"
              className="c-form-grid__wide"
            />
            <TextField
              control={control}
              name={`scenarios.${index}.steps`}
              label="Çözüm adımları"
              rows={5}
              description={STEPS_HELP}
              className="c-form-grid__wide"
            />
          </div>
        )}
      />
    </SectionCard>
  );
}

function RunbookForm({
  application,
  runbook,
}: {
  application: Application;
  runbook: Runbook | null;
}) {
  const navigate = useNavigate();
  const save = useSaveRunbook(runbook?.id);
  const form = useForm<RunbookFormValues>({
    resolver: zodResolver(runbookFormSchema),
    defaultValues: toRunbookFormValues(runbook),
    mode: 'onTouched',
  });
  const { control } = form;
  const back = paths.applications.runbook(application.id);
  return (
    <FormPage
      form={form}
      title={runbook ? `Müdahale rehberini düzenle` : 'Müdahale rehberi oluştur'}
      subtitle={`${application.name} — sorun anında ilk bakılacak yer. Kısa ve uygulanabilir yazın.`}
      breadcrumbs={[
        { label: 'Uygulamalar', to: paths.applications.list() },
        { label: application.name, to: back },
        { label: 'Müdahale rehberi' },
      ]}
      cancelTo={back}
      submitLabel={runbook ? 'Değişiklikleri kaydet' : 'Rehberi kaydet'}
      onSubmit={async (values) => {
        await save.mutateAsync(toRunbookInput(application.id, values));
        return back;
      }}
      deleteAction={
        runbook && (
          <RunbookDeleteAction
            record={runbook}
            applicationName={application.name}
            onDeleted={() => void navigate(back)}
          />
        )
      }
    >
      <SectionCard title="Genel">
        <div className="c-form-grid">
          <TextField
            control={control}
            name="summary"
            label="Ne zaman kullanılır"
            rows={3}
            placeholder="Hangi durumlarda bu rehbere bakılmalı? Sağlıklı durum nasıl görünür?"
            className="c-form-grid__wide"
          />
          <DateField
            control={control}
            name="lastVerifiedOn"
            label="Son doğrulama"
            description="Rehberin adım adım denenip hâlâ geçerli olduğunun teyit edildiği tarih."
          />
        </div>
      </SectionCard>
      <SectionCard
        title="İlk müdahale adımları"
        description="Sorun fark edildiğinde, nedeni bilinmeden önce yapılacaklar — ilk 15 dakika."
      >
        <TextField
          control={control}
          name="firstResponse"
          label="Adımlar"
          rows={7}
          description={STEPS_HELP}
          placeholder={
            'Durum sayfasında devam eden bir olay var mı bakın\nPanoda hata oranını kontrol edin\nSon dağıtımları kontrol edin'
          }
        />
      </SectionCard>
      <LinksSection control={control} />
      <ContactsSection control={control} />
      <ScenariosSection control={control} />
    </FormPage>
  );
}

export default function RunbookFormPage() {
  const requestedId = useParams().applicationId ?? '';
  const applicationId = parseId(requestedId) ?? 0;
  const application = useApplication(applicationId);
  const runbook = useRunbook(applicationId);

  if (application.isPending || runbook.isPending) {
    return <LoadingState label="Müdahale rehberi yükleniyor" rows={8} />;
  }
  if (application.isError) {
    return isNotFoundError(application.error) ? (
      <NotFoundState
        title="Uygulama bulunamadı"
        description={`"${requestedId}" kimliğine sahip bir uygulama yok.`}
        backTo={paths.applications.list()}
        backLabel="Uygulamalara dön"
      />
    ) : (
      <ErrorState title="Uygulama yüklenemedi" onRetry={() => void application.refetch()} />
    );
  }
  if (runbook.isError) {
    return (
      <ErrorState title="Müdahale rehberi yüklenemedi" onRetry={() => void runbook.refetch()} />
    );
  }
  return <RunbookForm application={application.data} runbook={runbook.data} />;
}
