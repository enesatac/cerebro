import { useFieldArray, useWatch, type Control } from 'react-hook-form';
import { DateField } from '@/components/forms/DateField';
import { ChipsField, SelectField, SwitchField, TextField } from '@/components/forms/fields';
import { RepeatableList } from '@/components/forms/RepeatableList';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationOptions } from '@/domains/applications/api/queries';
import { useBusinessUnitOptions } from '@/domains/business-units/api/queries';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { emptyImpact, emptyMilestone, type ProjectFormValues } from '../../schemas/projectForm';

type Props = { control: Control<ProjectFormValues> };

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
        <MasterSelectField control={control} name="type" label="Tür" required list="projectTypes" />
        <MasterSelectField
          control={control}
          name="status"
          label="Durum"
          required
          list="projectStatuses"
        />
        <MasterSelectField
          control={control}
          name="health"
          label="Sağlık"
          required
          list="projectHealths"
        />
        <MasterSelectField
          control={control}
          name="priority"
          label="Öncelik"
          required
          list="criticalities"
        />
        <MasterSelectField
          control={control}
          name="confidentiality"
          label="Gizlilik"
          required
          list="confidentialityLevels"
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
        <MasterSelectField
          control={control}
          name="currentPhase"
          label="Mevcut aşama"
          required
          list="projectPhases"
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
          <MasterSelectField
            control={control}
            name="currency"
            label="Para birimi"
            required
            list="currencies"
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
            <MasterSelectField
              control={control}
              name={`applicationImpacts.${index}.impactType`}
              label="Etki"
              required
              list="applicationImpactTypes"
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
            <MasterSelectField
              control={control}
              name={`milestones.${index}.status`}
              label="Durum"
              required
              list="milestoneStatuses"
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
