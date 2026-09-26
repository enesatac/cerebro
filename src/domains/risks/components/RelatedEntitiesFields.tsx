import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { MultiSelectField } from '@/components/forms/fields';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationOptions } from '@/domains/applications/api/queries';
import { useProjectOptions } from '@/domains/projects/api/queries';

interface RelatedEntitiesFieldsProps<T extends FieldValues> {
  control: Control<T>;
  applicationsName: FieldPath<T>;
  projectsName: FieldPath<T>;
}

/** "What does this relate to?" — shared by risk, escalation and decision forms. */
export function RelatedEntitiesFields<T extends FieldValues>({
  control,
  applicationsName,
  projectsName,
}: RelatedEntitiesFieldsProps<T>) {
  const applications = useApplicationOptions();
  const projects = useProjectOptions();
  return (
    <SectionCard
      title="Etkilenen"
      description="Kaydın ilgili yerlerde görünmesi için en az bir uygulama veya proje bağlayın."
    >
      <div className="c-form-grid">
        <MultiSelectField
          control={control}
          name={applicationsName}
          label="Uygulamalar"
          options={applications}
          addLabel="Uygulama ekle"
        />
        <MultiSelectField
          control={control}
          name={projectsName}
          label="Projeler"
          options={projects}
          addLabel="Proje ekle"
        />
      </div>
    </SectionCard>
  );
}
