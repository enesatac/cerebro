import { useFieldArray, type Control, type FieldValues } from 'react-hook-form';
import { arrayPath, fieldPath } from '@/components/forms/fieldPath';
import { SelectField, TextField } from '@/components/forms/fields';
import { RepeatableList } from '@/components/forms/RepeatableList';
import { SectionCard } from '@/components/layout/SectionCard';
import { emptyDocumentationLink } from '../schemas/sharedFormSchemas';
import { DOCUMENTATION_LINK_TYPES } from '../types';
import { DOCUMENTATION_LINK_TYPE_LABELS } from '../utils/presentation';

const TYPE_OPTIONS = DOCUMENTATION_LINK_TYPES.map((value) => ({
  value,
  label: DOCUMENTATION_LINK_TYPE_LABELS[value],
}));

/** Expects `documentation: DocumentationLinkFormValues[]` in the form. */
export function DocumentationLinksFields<T extends FieldValues>({
  control,
}: {
  control: Control<T>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: arrayPath<T>('documentation'),
  });
  return (
    <SectionCard
      title="Documentation"
      description="Typed links to Confluence, Jira, runbooks, designs and dashboards."
    >
      <RepeatableList
        items={fields}
        onAdd={() => append(emptyDocumentationLink() as never)}
        onRemove={remove}
        addLabel="Add link"
        removeLabel={(index) => `Remove documentation link ${index + 1}`}
        emptyText="No documentation linked yet."
        renderItem={(index) => (
          <div className="c-form-grid c-form-grid--three">
            <SelectField
              control={control}
              name={fieldPath<T>(`documentation.${index}.type`)}
              label="Type"
              required
              options={TYPE_OPTIONS}
            />
            <TextField
              control={control}
              name={fieldPath<T>(`documentation.${index}.title`)}
              label="Title"
              required
            />
            <TextField
              control={control}
              name={fieldPath<T>(`documentation.${index}.url`)}
              label="Address"
              type="url"
              required
              placeholder="https://"
            />
          </div>
        )}
      />
    </SectionCard>
  );
}
