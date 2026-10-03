import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@takeoff-ui/react-spar';
import { useForm, useWatch, type Control } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { DateField } from '@/components/forms/DateField';
import { MultiSelectField, SelectField, SwitchField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { PermissionDeniedState } from '@/components/feedback/PermissionDeniedState';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationOptions } from '@/domains/applications/api/queries';
import { useCurrentUser } from '@/domains/auth/api/queries';
import { useBusinessUnitOptions } from '@/domains/business-units/api/queries';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { useMasterData } from '@/domains/master-data/context';
import { usePeopleById, usePersonOptions } from '@/domains/people/api/queries';
import type { EntityId } from '@/domains/shared/types';
import { parseId } from '@/lib/urlParams';
import { useSaveDemand } from '../api/mutations';
import { useDemand } from '../api/queries';
import { DemandDeleteAction } from '../components/DemandDeleteAction';
import {
  demandFormSchema,
  toDemandFormValues,
  toDemandInput,
  type DemandFormValues,
} from '../schemas/demandForm';
import type { Demand } from '../types';
import { canEditDemand } from '../utils/demandAccess';

/** Budget currency only matters once there is a budget. */
function BudgetFields({ control }: { control: Control<DemandFormValues> }) {
  const budget = useWatch({ control, name: 'estimatedBudget' });
  return (
    <>
      <TextField
        control={control}
        name="estimatedBudget"
        label="Tahmini bütçe"
        type="number"
        description="Biliyorsanız; kaba bir tahmin de değerlendirmeye yardımcı olur."
      />
      <MasterSelectField
        control={control}
        name="currency"
        label="Para birimi"
        list="currencies"
        disabled={!budget}
      />
    </>
  );
}

function DemandForm({
  demand,
  me,
}: {
  demand?: Demand;
  me: { personId: EntityId | null; businessUnitId: EntityId | null };
}) {
  const navigate = useNavigate();
  const save = useSaveDemand(demand?.id);
  const people = usePersonOptions();
  const units = useBusinessUnitOptions();
  const applications = useApplicationOptions();
  const masterData = useMasterData();
  const form = useForm<DemandFormValues>({
    resolver: zodResolver(demandFormSchema),
    defaultValues: toDemandFormValues(demand, me),
    mode: 'onTouched',
  });
  const { control } = form;
  const cancelTo = demand ? paths.demands.detail(demand.id) : paths.demands.list();
  const asked = demand?.status === 'needs-info' ? demand.assessment.decisionNote : null;

  return (
    <FormPage
      form={form}
      title={demand ? 'Talebi düzenle' : 'Yeni talep'}
      subtitle={
        demand
          ? `${demand.code} · ${demand.title}`
          : 'İhtiyacınızı ve beklediğiniz faydayı olabildiğince somut yazın. Portföy ofisi talebi değerlendirip size dönüş yapar.'
      }
      breadcrumbs={[
        { label: 'Talepler', to: paths.demands.list() },
        ...(demand ? [{ label: demand.code, to: paths.demands.detail(demand.id) }] : []),
        { label: demand ? 'Düzenle' : 'Yeni talep' },
      ]}
      cancelTo={cancelTo}
      submitLabel={
        demand ? (asked ? 'Güncelle ve yeniden gönder' : 'Değişiklikleri kaydet') : 'Talebi gönder'
      }
      onSubmit={async (values) => {
        const saved = await save.mutateAsync(toDemandInput(values));
        return paths.demands.detail(saved.id);
      }}
      deleteAction={
        demand && (
          <DemandDeleteAction
            record={demand}
            onDeleted={() => void navigate(paths.demands.manage())}
          />
        )
      }
      after={
        !demand && (
          <p className="c-muted">
            İş gerekçesi, ekran görüntüsü veya mevzuat metni gibi dosyaları talebi gönderdikten
            sonra talep sayfasından ekleyebilirsiniz.
          </p>
        )
      }
    >
      {asked && (
        <Alert variant="warning" appearance="outlined">
          <Alert.Content>
            <Alert.Title level={2}>Portföy ofisi sizden bilgi bekliyor</Alert.Title>
            <Alert.Description>{asked}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
      <SectionCard title="Talep" description="Ne istendiğini ve kimin adına istendiğini anlatın.">
        <div className="c-form-grid">
          <TextField
            control={control}
            name="title"
            label="Başlık"
            required
            className="c-form-grid__wide"
            placeholder="ör. Biniş kartlarının mobil cüzdana eklenmesi"
          />
          <MasterSelectField
            control={control}
            name="type"
            label="Talep türü"
            required
            list="demandTypes"
          />
          <SelectField
            control={control}
            name="businessUnitId"
            label="İş birimi"
            required
            options={units}
          />
          <SelectField
            control={control}
            name="requesterId"
            label="Talep eden"
            required
            options={people}
            description="Sorular bu kişiye yöneltilir."
          />
          <SelectField
            control={control}
            name="sponsorId"
            label="Sponsor"
            options={people}
            emptyLabel="Sponsor yok"
            description="Bütçe ve öncelik kararını iş biriminde sahiplenen yönetici."
          />
        </div>
      </SectionCard>
      <SectionCard title="İhtiyaç ve fayda">
        <div className="c-form-grid">
          <TextField
            control={control}
            name="problem"
            label="Mevcut durum ve ihtiyaç"
            required
            rows={4}
            className="c-form-grid__wide"
            description="Bugün nasıl yapılıyor, sorun ne, kimler etkileniyor?"
          />
          <TextField
            control={control}
            name="proposedSolution"
            label="Beklenen çözüm ve kapsam"
            rows={3}
            className="c-form-grid__wide"
            description="Aklınızdaki çözüm; kapsam dışı bıraktıklarınızı da yazabilirsiniz."
          />
          <TextField
            control={control}
            name="expectedBenefits"
            label="Beklenen fayda"
            required
            rows={3}
            className="c-form-grid__wide"
            description="Mümkünse ölçülebilir yazın: tasarruf, gelir, süre, hata oranı…"
          />
          <MultiSelectField
            control={control}
            name="benefitTypes"
            label="Fayda türleri"
            options={masterData.options('demandBenefitTypes')}
            addLabel="Fayda türü ekle"
          />
          <TextField
            control={control}
            name="affectedUsers"
            label="Etkilenen kullanıcı sayısı"
            type="number"
            description="Yaklaşık; çalışan veya müşteri."
          />
          <MultiSelectField
            control={control}
            name="relatedApplicationIds"
            label="İlgili uygulamalar"
            options={applications}
            addLabel="Uygulama ekle"
            className="c-form-grid__wide"
            description="Değişmesi veya entegre olması gereken mevcut sistemler; bilmiyorsanız boş bırakın."
          />
        </div>
      </SectionCard>
      <SectionCard title="Zamanlama ve bütçe">
        <div className="c-form-grid">
          <MasterSelectField
            control={control}
            name="urgency"
            label="Aciliyet"
            required
            list="criticalities"
          />
          <DateField
            control={control}
            name="desiredDate"
            label="İstenen tarih"
            description="Çözümün hazır olması gereken tarih."
          />
          <SwitchField
            control={control}
            name="regulatory"
            label="Yasal zorunluluk"
            description="Bir mevzuat, regülatör veya denetim bulgusu gerektiriyor."
          />
          <TextField
            control={control}
            name="deadlineReason"
            label="Tarih gerekçesi"
            rows={2}
            description="Tarih neden önemli? (mevzuat, kampanya, sözleşme bitişi…)"
          />
          <BudgetFields control={control} />
        </div>
      </SectionCard>
    </FormPage>
  );
}

function NewDemand() {
  const user = useCurrentUser();
  const people = usePeopleById();
  return (
    <QueryView query={people} loadingLabel="Form hazırlanıyor" errorTitle="Form yüklenemedi">
      {(byId) => {
        const personId = user?.personId ?? null;
        const person = personId !== null ? byId.get(personId) : undefined;
        return <DemandForm me={{ personId, businessUnitId: person?.businessUnitId ?? null }} />;
      }}
    </QueryView>
  );
}

function EditDemand({ id }: { id: EntityId }) {
  const user = useCurrentUser();
  const query = useDemand(id);
  return (
    <QueryView query={query} loadingLabel="Talep yükleniyor" errorTitle="Bu talep yüklenemedi">
      {(demand) =>
        canEditDemand(user, demand) ? (
          <DemandForm demand={demand} me={{ personId: null, businessUnitId: null }} />
        ) : (
          <PermissionDeniedState
            action="bu talebi düzenleme (karar verilmiş veya size ait olmayan talepler değiştirilemez)"
            backTo={paths.demands.detail(demand.id)}
            backLabel="Talebe dön"
          />
        )
      }
    </QueryView>
  );
}

export default function DemandFormPage() {
  const { demandId } = useParams();
  return demandId ? <EditDemand id={parseId(demandId) ?? 0} /> : <NewDemand />;
}
