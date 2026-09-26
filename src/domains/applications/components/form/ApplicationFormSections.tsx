import { useFieldArray, useWatch, type Control } from 'react-hook-form';
import { ChipsField, SelectField, SwitchField, TextField } from '@/components/forms/fields';
import { RepeatableList } from '@/components/forms/RepeatableList';
import { SectionCard } from '@/components/layout/SectionCard';
import { useBusinessUnitOptions } from '@/domains/business-units/api/queries';
import { CRITICALITIES } from '@/domains/shared/types';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { useTechnologyOptions } from '@/domains/technologies/api/queries';
import { TECHNOLOGY_CATEGORIES } from '@/domains/technologies/types';
import { TECHNOLOGY_CATEGORY_LABELS } from '@/domains/technologies/utils/technologyPresentation';
import {
  emptyDataStore,
  emptyEnvironment,
  emptyRepository,
  emptyTechnologyUsage,
  type ApplicationFormValues,
} from '../../schemas/applicationForm';
import {
  APPLICATION_LIFECYCLES,
  APPLICATION_TYPES,
  ENVIRONMENT_STATUSES,
  ENVIRONMENT_TYPES,
  HOSTING_MODELS,
  OPERATIONAL_STATUSES,
  SOURCE_REPOSITORY_TYPES,
} from '../../types';
import {
  APPLICATION_TYPE_LABELS,
  ENVIRONMENT_STATUS_PRESENTATION,
  ENVIRONMENT_TYPE_LABELS,
  HOSTING_MODEL_LABELS,
  LIFECYCLE_PRESENTATION,
  OPERATIONAL_STATUS_PRESENTATION,
  SOURCE_REPOSITORY_TYPE_LABELS,
} from '../../utils/applicationPresentation';

type Props = { control: Control<ApplicationFormValues> };

const options = <T extends string>(values: readonly T[], label: (value: T) => string) =>
  values.map((value) => ({ value, label: label(value) }));

export function ApplicationGeneralSection({ control }: Props) {
  return (
    <SectionCard title="Genel">
      <div className="c-form-grid c-form-grid--three">
        <TextField
          control={control}
          name="name"
          label="Uygulama adı"
          required
          className="c-form-grid__wide"
        />
        <TextField
          control={control}
          name="code"
          label="Kod"
          required
          description="Kısa ve benzersiz kod, ör. PAYGW."
        />
        <SelectField
          control={control}
          name="type"
          label="Tür"
          required
          options={options(APPLICATION_TYPES, (v) => APPLICATION_TYPE_LABELS[v])}
        />
        <SelectField
          control={control}
          name="lifecycle"
          label="Yaşam döngüsü"
          required
          options={options(APPLICATION_LIFECYCLES, (v) => LIFECYCLE_PRESENTATION[v].label)}
        />
        <SelectField
          control={control}
          name="criticality"
          label="Kritiklik"
          required
          options={options(CRITICALITIES, (v) => CRITICALITY_PRESENTATION[v].label)}
        />
        <SelectField
          control={control}
          name="operationalStatus"
          label="Çalışma durumu"
          required
          options={options(OPERATIONAL_STATUSES, (v) => OPERATIONAL_STATUS_PRESENTATION[v].label)}
        />
        <ChipsField control={control} name="tags" label="Etiketler" className="c-form-grid__wide" />
      </div>
      <div className="c-stack c-form-stack">
        <TextField
          control={control}
          name="shortDescription"
          label="Kısa açıklama"
          required
          description="Listelerde ve arama sonuçlarında gösterilen tek cümle."
        />
        <TextField
          control={control}
          name="businessPurpose"
          label="İş amacı"
          rows={2}
          required
          description="Uygulamanın neden var olduğu, iş diliyle."
        />
        <TextField
          control={control}
          name="detailedDescription"
          label="Ayrıntılı açıklama"
          rows={4}
        />
      </div>
    </SectionCard>
  );
}

export function ApplicationBusinessSection({ control }: Props) {
  const businessUnits = useBusinessUnitOptions();
  return (
    <SectionCard title="İş bağlamı">
      <div className="c-form-grid">
        <SelectField
          control={control}
          name="businessUnitId"
          label="İş birimi"
          options={businessUnits}
          emptyLabel="Belirlenmemiş"
        />
        <TextField
          control={control}
          name="estimatedUserCount"
          label="Tahmini kullanıcı"
          type="number"
        />
        <ChipsField control={control} name="businessProcesses" label="İş süreçleri" />
        <ChipsField control={control} name="userGroups" label="Kullanıcı grupları" />
      </div>
    </SectionCard>
  );
}

export function ApplicationTechnologySection({ control }: Props) {
  const technologies = useTechnologyOptions();
  const usages = useFieldArray({ control, name: 'technologies' });
  const stores = useFieldArray({ control, name: 'dataStores' });
  const hostingModel = useWatch({ control, name: 'hostingModel' });
  const layers = options(TECHNOLOGY_CATEGORIES, (v) => TECHNOLOGY_CATEGORY_LABELS[v]);

  return (
    <>
      <SectionCard
        title="Teknoloji yığını"
        description="Katalogdaki teknolojiler ve kullanıldıkları katman."
      >
        <RepeatableList
          items={usages.fields}
          onAdd={() => usages.append(emptyTechnologyUsage())}
          onRemove={usages.remove}
          addLabel="Teknoloji ekle"
          removeLabel={(index) => `${index + 1}. teknolojiyi kaldır`}
          emptyText="Henüz teknoloji kaydedilmedi."
          renderItem={(index) => (
            <div className="c-form-grid c-form-grid--three">
              <SelectField
                control={control}
                name={`technologies.${index}.technologyId`}
                label="Teknoloji"
                required
                options={technologies}
              />
              <SelectField
                control={control}
                name={`technologies.${index}.layer`}
                label="Katman"
                required
                options={layers}
              />
              <TextField control={control} name={`technologies.${index}.version`} label="Sürüm" />
            </div>
          )}
        />
      </SectionCard>
      <SectionCard
        title="Veri depoları"
        description="Bu uygulamaya ait veritabanları ve önbellekler."
      >
        <RepeatableList
          items={stores.fields}
          onAdd={() => stores.append(emptyDataStore())}
          onRemove={stores.remove}
          addLabel="Veri deposu ekle"
          removeLabel={(index) => `${index + 1}. veri deposunu kaldır`}
          emptyText="Henüz veri deposu kaydedilmedi."
          renderItem={(index) => (
            <div className="c-form-grid c-form-grid--four">
              <TextField control={control} name={`dataStores.${index}.name`} label="Ad" required />
              <SelectField
                control={control}
                name={`dataStores.${index}.technologyId`}
                label="Teknoloji"
                required
                options={technologies}
              />
              <TextField control={control} name={`dataStores.${index}.purpose`} label="Amaç" />
              <SwitchField
                control={control}
                name={`dataStores.${index}.containsPersonalData`}
                label="Kişisel veri"
              />
            </div>
          )}
        />
      </SectionCard>
      <SectionCard title="Barındırma">
        <div className="c-form-grid c-form-grid--three">
          <SelectField
            control={control}
            name="hostingModel"
            label="Barındırma modeli"
            required
            options={options(HOSTING_MODELS, (v) => HOSTING_MODEL_LABELS[v])}
          />
          <TextField
            control={control}
            name="cloudProvider"
            label="Bulut sağlayıcı"
            required={hostingModel === 'public-cloud' || hostingModel === 'hybrid'}
          />
          <TextField control={control} name="hostingNotes" label="Notlar" />
        </div>
      </SectionCard>
    </>
  );
}

export function ApplicationEnvironmentsSection({ control }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'environments' });
  return (
    <SectionCard
      title="Ortamlar"
      description="Yalnızca adresler ve notlar — asla kimlik bilgisi değil. Onlar için ekibin secrets manager'ını kullanın."
    >
      <RepeatableList
        items={fields}
        onAdd={() => append(emptyEnvironment())}
        onRemove={remove}
        addLabel="Ortam ekle"
        removeLabel={(index) => `${index + 1}. ortamı kaldır`}
        emptyText="Henüz ortam kaydedilmedi."
        renderItem={(index) => (
          <div className="c-form-grid c-form-grid--three">
            <SelectField
              control={control}
              name={`environments.${index}.type`}
              label="Tür"
              required
              options={options(ENVIRONMENT_TYPES, (v) => ENVIRONMENT_TYPE_LABELS[v])}
            />
            <TextField control={control} name={`environments.${index}.name`} label="Ad" required />
            <SelectField
              control={control}
              name={`environments.${index}.status`}
              label="Durum"
              required
              options={options(
                ENVIRONMENT_STATUSES,
                (v) => ENVIRONMENT_STATUS_PRESENTATION[v].label,
              )}
            />
            <TextField
              control={control}
              name={`environments.${index}.url`}
              label="URL"
              type="url"
              placeholder="https://"
            />
            <TextField control={control} name={`environments.${index}.region`} label="Bölge" />
            <TextField control={control} name={`environments.${index}.notes`} label="Notlar" />
          </div>
        )}
      />
    </SectionCard>
  );
}

export function ApplicationRepositoriesSection({ control }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'repositories' });
  return (
    <SectionCard title="Kaynak kod depoları">
      <RepeatableList
        items={fields}
        onAdd={() => append(emptyRepository())}
        onRemove={remove}
        addLabel="Kod deposu ekle"
        removeLabel={(index) => `${index + 1}. kod deposunu kaldır`}
        emptyText="Henüz kod deposu bağlanmadı."
        renderItem={(index) => (
          <div className="c-form-grid c-form-grid--four">
            <TextField
              control={control}
              name={`repositories.${index}.name`}
              label="Ad"
              required
              placeholder="group/repository"
            />
            <SelectField
              control={control}
              name={`repositories.${index}.type`}
              label="Tür"
              required
              options={options(SOURCE_REPOSITORY_TYPES, (v) => SOURCE_REPOSITORY_TYPE_LABELS[v])}
            />
            <TextField
              control={control}
              name={`repositories.${index}.url`}
              label="Adres"
              type="url"
              required
              placeholder="https://"
            />
            <TextField
              control={control}
              name={`repositories.${index}.defaultBranch`}
              label="Varsayılan dal"
              required
            />
          </div>
        )}
      />
    </SectionCard>
  );
}
