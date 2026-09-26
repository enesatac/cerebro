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
      title="Affects"
      description="Link at least one application or project so the record appears where people look."
    >
      <div className="c-form-grid">
        <MultiSelectField
          control={control}
          name={applicationsName}
          label="Applications"
          options={applications}
          addLabel="Add an application"
        />
        <MultiSelectField
          control={control}
          name={projectsName}
          label="Projects"
          options={projects}
          addLabel="Add a project"
        />
      </div>
    </SectionCard>
  );
}
