import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, type Control } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { DateField } from '@/components/forms/DateField';
import { MultiSelectField, SelectField, SwitchField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationOptions } from '@/domains/applications/api/queries';
import { AttachmentsSection } from '@/domains/attachments/components/AttachmentsSection';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { usePersonOptions } from '@/domains/people/api/queries';
import { useProjectOptions } from '@/domains/projects/api/queries';
import type { EntityId } from '@/domains/shared/types';
import { formatDate } from '@/lib/dates';
import { parseId } from '@/lib/urlParams';
import { useSaveContract } from '../api/mutations';
import { useContract, useVendors } from '../api/queries';
import { ContractDeleteAction } from '../components/ContractDeleteAction';
import { PaymentFields } from '../components/PaymentFields';
import {
  contractFormSchema,
  toContractFormValues,
  toContractInput,
  type ContractFormValues,
} from '../schemas/contractForm';
import type { Contract } from '../types';
import { noticeDeadline } from '../utils/contractSchedule';

/** The last notice date, computed as the end date and notice period are typed. */
function NoticeHint({ control }: { control: Control<ContractFormValues> }) {
  const [endDate, days] = useWatch({ control, name: ['endDate', 'noticePeriodDays'] });
  const deadline = noticeDeadline({
    endDate: endDate || null,
    noticePeriodDays: Number(days) || null,
  });
  return deadline ? (
    <p className="c-muted c-form-grid__wide" aria-live="polite">
      Fesih veya yeniden görüşme için son bildirim tarihi: <strong>{formatDate(deadline)}</strong>
    </p>
  ) : null;
}

function ContractForm({ contract }: { contract?: Contract }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const save = useSaveContract(contract?.id);
  const projects = useProjectOptions();
  const people = usePersonOptions();
  const applications = useApplicationOptions();
  const vendors = useVendors();
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: toContractFormValues(contract, { projectId: parseId(params.get('project')) }),
    mode: 'onTouched',
  });
  const { control } = form;
  const projectId = parseId(params.get('project'));
  const cancelTo = contract
    ? paths.contracts.detail(contract.id)
    : projectId
      ? `${paths.projects.detail(projectId)}?tab=contracts`
      : paths.contracts.list();

  return (
    <FormPage
      form={form}
      title={contract ? 'Sözleşmeyi düzenle' : 'Sözleşme ekle'}
      subtitle={contract ? `${contract.code} · ${contract.title}` : undefined}
      breadcrumbs={[
        { label: 'Sözleşmeler', to: paths.contracts.list() },
        ...(contract ? [{ label: contract.code, to: paths.contracts.detail(contract.id) }] : []),
        { label: contract ? 'Düzenle' : 'Yeni sözleşme' },
      ]}
      cancelTo={cancelTo}
      submitLabel={contract ? 'Değişiklikleri kaydet' : 'Sözleşmeyi kaydet'}
      onSubmit={async (values) => {
        const saved = await save.mutateAsync(toContractInput(values));
        return paths.contracts.detail(saved.id);
      }}
      deleteAction={
        contract && (
          <ContractDeleteAction
            record={contract}
            onDeleted={() => void navigate(paths.contracts.list())}
          />
        )
      }
      after={
        contract ? (
          <AttachmentsSection
            owner={{ type: 'contract', id: contract.id }}
            ownerName={`${contract.code} ${contract.title}`}
            title="Sözleşme belgeleri"
            description="Dosyalar hemen kaydedilir; formu kaydetmek gerekmez."
            defaultType="invoice"
          />
        ) : (
          <p className="c-muted">
            İmzalı sözleşme, teklif ve faturaları kaydettikten sonra sözleşme sayfasından
            ekleyebilirsiniz.
          </p>
        )
      }
    >
      <SectionCard title="Sözleşme">
        <div className="c-form-grid">
          <TextField
            control={control}
            name="title"
            label="Başlık"
            required
            className="c-form-grid__wide"
            placeholder="ör. Gözlemlenebilirlik platformu aboneliği"
          />
          <SelectField
            control={control}
            name="projectId"
            label="Proje"
            required
            options={projects}
          />
          <SelectField
            control={control}
            name="vendorId"
            label="Tedarikçi"
            required
            options={(vendors.data ?? []).map((v) => ({ value: String(v.id), label: v.name }))}
            description="Listede yoksa Sözleşmeler → Tedarikçiler sekmesinden ekleyin."
          />
          <MasterSelectField
            control={control}
            name="type"
            label="Tür"
            required
            list="contractTypes"
          />
          <MasterSelectField
            control={control}
            name="status"
            label="Durum"
            required
            list="contractStatuses"
          />
          <SelectField
            control={control}
            name="ownerId"
            label="Sözleşme sorumlusu"
            options={people}
            emptyLabel="Atanmamış"
          />
          <TextField control={control} name="purchaseOrderNumber" label="Satın alma sipariş no" />
          <TextField
            control={control}
            name="description"
            label="Kapsam"
            rows={3}
            className="c-form-grid__wide"
            description="Ne alınıyor: miktarlar, hizmet seviyeleri, dahil olanlar."
          />
          <MultiSelectField
            control={control}
            name="relatedApplicationIds"
            label="İlgili uygulamalar"
            options={applications}
            addLabel="Uygulama ekle"
            className="c-form-grid__wide"
          />
        </div>
      </SectionCard>
      <SectionCard title="Süre ve yenileme">
        <div className="c-form-grid">
          <DateField control={control} name="signedDate" label="İmza tarihi" />
          <DateField control={control} name="startDate" label="Başlangıç" />
          <DateField
            control={control}
            name="endDate"
            label="Bitiş"
            description="Süresiz sözleşmelerde boş bırakın."
          />
          <TextField
            control={control}
            name="noticePeriodDays"
            label="İhbar süresi (gün)"
            type="number"
            description="Bitişten kaç gün önce bildirim yapılmalı."
          />
          <SwitchField
            control={control}
            name="autoRenewal"
            label="Otomatik yenilenir"
            description="Bildirim yapılmazsa aynı koşullarla uzar."
          />
          <NoticeHint control={control} />
        </div>
      </SectionCard>
      <SectionCard title="Bedel">
        <div className="c-form-grid">
          <TextField control={control} name="totalValue" label="Sözleşme bedeli" type="number" />
          <MasterSelectField
            control={control}
            name="currency"
            label="Para birimi"
            required
            list="currencies"
          />
          <MasterSelectField
            control={control}
            name="billingFrequency"
            label="Faturalama sıklığı"
            required
            list="billingFrequencies"
          />
        </div>
      </SectionCard>
      <PaymentFields
        control={control}
        error={
          form.formState.errors.payments?.root?.message ?? form.formState.errors.payments?.message
        }
      />
    </FormPage>
  );
}

function EditContract({ id }: { id: EntityId }) {
  const query = useContract(id);
  return (
    <QueryView
      query={query}
      loadingLabel="Sözleşme yükleniyor"
      errorTitle="Bu sözleşme yüklenemedi"
    >
      {(contract) => <ContractForm contract={contract} />}
    </QueryView>
  );
}

export default function ContractFormPage() {
  const { contractId } = useParams();
  return contractId ? <EditContract id={parseId(contractId) ?? 0} /> : <ContractForm />;
}
