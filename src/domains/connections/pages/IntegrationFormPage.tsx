import { zodResolver } from '@hookform/resolvers/zod';
import type { EntityId } from '@/domains/shared/types';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { SelectField, TextField } from '@/components/forms/fields';
import { FormPage } from '@/components/forms/FormPage';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationOptions } from '@/domains/applications/api/queries';
import { useSaveIntegration } from '../api/mutations';
import { useIntegration } from '../api/queries';
import {
  integrationFormSchema,
  toIntegrationFormValues,
  toIntegrationInput,
  type IntegrationFormValues,
} from '../schemas/connectionForms';
import { type Integration } from '../types';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { IntegrationDeleteAction } from '../components/IntegrationDeleteAction';
import { parseId } from '@/lib/urlParams';

const TARGET_OPTIONS = [
  { value: 'application', label: 'Başka bir Cerebro uygulaması' },
  { value: 'external', label: 'Harici bir taraf' },
];

function IntegrationForm({ integration }: { integration?: Integration }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const save = useSaveIntegration(integration?.id);
  const applications = useApplicationOptions();
  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(integrationFormSchema),
    defaultValues: toIntegrationFormValues(integration, String(parseId(params.get('from')) ?? '')),
    mode: 'onTouched',
  });
  const { control } = form;
  const targetKind = useWatch({ control, name: 'targetKind' });
  const origin = integration?.fromApplicationId ?? parseId(params.get('from'));
  const returnTo = origin
    ? `${paths.applications.detail(origin)}?tab=integrations`
    : `${paths.architecture()}?tab=integrations`;

  return (
    <FormPage
      form={form}
      title={integration ? `Düzenle: ${integration.name}` : 'Entegrasyon kaydet'}
      subtitle="Somut bir teknik arayüz: kim başlatır, kim alır ve içinden ne akar."
      breadcrumbs={[
        { label: 'Bağlantılar', to: `${paths.architecture()}?tab=integrations` },
        { label: integration ? 'Entegrasyonu düzenle' : 'Yeni entegrasyon' },
      ]}
      cancelTo={returnTo}
      submitLabel={integration ? 'Değişiklikleri kaydet' : 'Entegrasyon kaydet'}
      onSubmit={async (values) => {
        await save.mutateAsync(toIntegrationInput(values));
        return returnTo;
      }}
      deleteAction={
        integration && (
          <IntegrationDeleteAction record={integration} onDeleted={() => void navigate(returnTo)} />
        )
      }
    >
      <SectionCard title="Entegrasyon">
        <div className="c-form-grid">
          <TextField control={control} name="name" label="Ad" required />
          <MasterSelectField
            control={control}
            name="type"
            label="Tür"
            required
            list="integrationTypes"
          />
          <MasterSelectField
            control={control}
            name="frequency"
            label="Sıklık"
            required
            list="integrationFrequencies"
          />
        </div>
      </SectionCard>
      <SectionCard title="Uç noktalar">
        <div className="c-form-grid">
          <SelectField
            control={control}
            name="fromApplicationId"
            label="Kaynak (başlatan veya üreten)"
            required
            options={applications}
          />
          <SelectField
            control={control}
            name="targetKind"
            label="Alıcı"
            required
            options={TARGET_OPTIONS}
          />
          {targetKind === 'application' ? (
            <SelectField
              control={control}
              name="toApplicationId"
              label="Hedef uygulama"
              required
              options={applications}
            />
          ) : (
            <TextField
              control={control}
              name="externalPartyName"
              label="Harici taraf"
              required
              placeholder="ör. Kart üye işyeri bankası"
            />
          )}
        </div>
      </SectionCard>
      <SectionCard
        title="Ayrıntılar"
        description="Asla kimlik bilgisi, token veya bağlantı dizesi eklemeyin."
      >
        <div className="c-form-grid">
          <TextField
            control={control}
            name="dataExchanged"
            label="Aktarılan veri"
            className="c-form-grid__wide"
          />
          <TextField
            control={control}
            name="description"
            label="Açıklama"
            rows={3}
            className="c-form-grid__wide"
          />
        </div>
      </SectionCard>
    </FormPage>
  );
}

export default function IntegrationFormPage() {
  const { integrationId } = useParams();
  return integrationId ? <EditIntegration id={parseId(integrationId) ?? 0} /> : <IntegrationForm />;
}

function EditIntegration({ id }: { id: EntityId }) {
  const query = useIntegration(id);
  return (
    <QueryView
      query={query}
      loadingLabel="Entegrasyon yükleniyor"
      errorTitle="Bu entegrasyon yüklenemedi"
    >
      {(integration) => <IntegrationForm integration={integration} />}
    </QueryView>
  );
}
