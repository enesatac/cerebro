import { useFieldArray, useWatch, type Control } from 'react-hook-form';
import { DateField } from '@/components/forms/DateField';
import { ChipsField, SelectField, SwitchField, TextField } from '@/components/forms/fields';
import { RepeatableList } from '@/components/forms/RepeatableList';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationOptions } from '@/domains/applications/api/queries';
import { useBusinessUnitOptions } from '@/domains/business-units/api/queries';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import {
  CURRENCIES,
  emptyImpact,
  emptyMilestone,
  type ProjectFormValues,
} from '../../schemas/projectForm';
import {
  APPLICATION_IMPACT_TYPES,
  CONFIDENTIALITY_LEVELS,
  MILESTONE_STATUSES,
  PROJECT_HEALTHS,
  PROJECT_PHASES,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from '../../types';
import {
  APPLICATION_IMPACT_LABELS,
  CONFIDENTIALITY_LABELS,
  MILESTONE_STATUS_PRESENTATION,
  PROJECT_HEALTH_PRESENTATION,
  PROJECT_PHASE_LABELS,
  PROJECT_STATUS_PRESENTATION,
  PROJECT_TYPE_LABELS,
} from '../../utils/projectPresentation';

type Props = { control: Control<ProjectFormValues> };

const options = <T extends string>(values: readonly T[], label: (value: T) => string) =>
  values.map((value) => ({ value, label: label(value) }));

export function ProjectGeneralSection({ control }: Props) {
  const businessUnits = useBusinessUnitOptions();
  return (
    <SectionCard title="Genel">
      <div className="c-form-grid c-form-grid--three">
        <TextField
          control={control}
          name="name"
          label="Proje adı"
          required
          className="c-form-grid__wide"
        />
        <TextField
          control={control}
          name="code"
          label="Kod"
          required
          description="Kısa ve benzersiz kod, ör. PPM."
        />
        <TextField control={control} name="shortName" label="Kısa ad" />
        <SelectField
          control={control}
          name="businessUnitId"
          label="İş birimi"
          options={businessUnits}
          emptyLabel="Belirlenmemiş"
        />
        <SelectField
          control={control}
          name="type"
          label="Tür"
          required
          options={options(PROJECT_TYPES, (v) => PROJECT_TYPE_LABELS[v])}
        />
        <SelectField
          control={control}
          name="status"
          label="Durum"
          required
          options={options(PROJECT_STATUSES, (v) => PROJECT_STATUS_PRESENTATION[v].label)}
        />
        <SelectField
          control={control}
          name="health"
          label="Sağlık"
          required
          options={options(PROJECT_HEALTHS, (v) => PROJECT_HEALTH_PRESENTATION[v].label)}
        />
        <SelectField
          control={control}
          name="priority"
          label="Öncelik"
          required
          options={options(PROJECT_PRIORITIES, (v) => CRITICALITY_PRESENTATION[v].label)}
        />
        <SelectField
          control={control}
          name="confidentiality"
          label="Gizlilik"
          required
          options={options(CONFIDENTIALITY_LEVELS, (v) => CONFIDENTIALITY_LABELS[v])}
        />
        <ChipsField control={control} name="tags" label="Etiketler" className="c-form-grid__wide" />
      </div>
      <div className="c-stack c-form-stack">
        <TextField control={control} name="description" label="Açıklama" rows={2} required />
        <TextField control={control} name="objective" label="Hedef" rows={2} />
        <div className="c-form-grid">
          <TextField control={control} name="scope" label="Kapsam" rows={3} />
          <TextField control={control} name="outOfScope" label="Kapsam dışı" rows={3} />
        </div>
      </div>
    </SectionCard>
  );
}

export function ProjectProgressSection({ control }: Props) {
  return (
    <SectionCard title="Zaman çizelgesi ve ilerleme">
      <div className="c-form-grid c-form-grid--four">
        <DateField control={control} name="plannedStartDate" label="Planlanan başlangıç" />
        <DateField control={control} name="plannedEndDate" label="Planlanan bitiş" />
        <DateField control={control} name="actualStartDate" label="Gerçekleşen başlangıç" />
        <DateField control={control} name="actualEndDate" label="Gerçekleşen bitiş" />
        <SelectField
          control={control}
          name="currentPhase"
          label="Mevcut aşama"
          required
          options={options(PROJECT_PHASES, (v) => PROJECT_PHASE_LABELS[v])}
        />
        <TextField
          control={control}
          name="progressPercentage"
          label="İlerleme (%)"
          type="number"
          required
        />
      </div>
      <div className="c-form-grid c-form-stack">
        <TextField control={control} name="latestStatusSummary" label="Son durum özeti" rows={3} />
        <TextField control={control} name="nextSteps" label="Sonraki adımlar" rows={3} />
      </div>
    </SectionCard>
  );
}

export function ProjectFinancialsSection({ control }: Props) {
  const enabled = useWatch({ control, name: 'hasFinancials' });
  return (
    <SectionCard
      title="Finansal bilgiler"
      description="İsteğe bağlı. Bütçe rakamları yetkili rollerle sınırlandırılabilir."
    >
      <SwitchField
        control={control}
        name="hasFinancials"
        label="Bu projenin finansal bilgilerini takip et"
      />
      {enabled && (
        <div className="c-form-grid c-form-grid--four c-form-stack">
          <SelectField
            control={control}
            name="currency"
            label="Para birimi"
            required
            options={CURRENCIES.map((value) => ({ value, label: value }))}
          />
          <TextField control={control} name="budget" label="Bütçe" type="number" />
          <TextField
            control={control}
            name="actualCost"
            label="Gerçekleşen maliyet"
            type="number"
          />
          <TextField control={control} name="forecastCost" label="Tahmini maliyet" type="number" />
        </div>
      )}
    </SectionCard>
  );
}

export function ProjectApplicationsSection({ control }: Props) {
  const applications = useApplicationOptions();
  const { fields, append, remove } = useFieldArray({ control, name: 'applicationImpacts' });
  return (
    <SectionCard
      title="Etkilenen uygulamalar"
      description="Bu projenin oluşturduğu, değiştirdiği, entegre olduğu veya devreden çıkardığı uygulamalar."
    >
      <RepeatableList
        items={fields}
        onAdd={() => append(emptyImpact())}
        onRemove={remove}
        addLabel="Uygulama ekle"
        removeLabel={(index) => `${index + 1}. etkilenen uygulamayı kaldır`}
        emptyText="Henüz uygulama bağlanmadı."
        renderItem={(index) => (
          <div className="c-form-grid c-form-grid--three">
            <SelectField
              control={control}
              name={`applicationImpacts.${index}.applicationId`}
              label="Uygulama"
              required
              options={applications}
            />
            <SelectField
              control={control}
              name={`applicationImpacts.${index}.impactType`}
              label="Etki"
              required
              options={options(APPLICATION_IMPACT_TYPES, (v) => APPLICATION_IMPACT_LABELS[v])}
            />
            <TextField
              control={control}
              name={`applicationImpacts.${index}.description`}
              label="Ne değişiyor"
            />
          </div>
        )}
      />
    </SectionCard>
  );
}

export function ProjectMilestonesSection({ control }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'milestones' });
  return (
    <SectionCard title="Kilometre taşları">
      <RepeatableList
        items={fields}
        onAdd={() => append(emptyMilestone())}
        onRemove={remove}
        addLabel="Kilometre taşı ekle"
        removeLabel={(index) => `${index + 1}. kilometre taşını kaldır`}
        emptyText="Henüz kilometre taşı tanımlanmadı."
        renderItem={(index) => (
          <div className="c-form-grid c-form-grid--four">
            <TextField
              control={control}
              name={`milestones.${index}.title`}
              label="Kilometre taşı"
              required
            />
            <DateField
              control={control}
              name={`milestones.${index}.dueDate`}
              label="Termin"
              required
            />
            <SelectField
              control={control}
              name={`milestones.${index}.status`}
              label="Durum"
              required
              options={options(MILESTONE_STATUSES, (v) => MILESTONE_STATUS_PRESENTATION[v].label)}
            />
            <DateField
              control={control}
              name={`milestones.${index}.completedDate`}
              label="Tamamlandı"
            />
          </div>
        )}
      />
    </SectionCard>
  );
}
