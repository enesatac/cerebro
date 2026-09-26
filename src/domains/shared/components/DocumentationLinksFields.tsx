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
      title="Dokümantasyon"
      description="Confluence, Jira, runbook, tasarım ve gösterge panellerine türüyle birlikte bağlantılar."
    >
      <RepeatableList
        items={fields}
        onAdd={() => append(emptyDocumentationLink() as never)}
        onRemove={remove}
        addLabel="Bağlantı ekle"
        removeLabel={(index) => `${index + 1}. dokümantasyon bağlantısını kaldır`}
        emptyText="Henüz dokümantasyon bağlanmadı."
        renderItem={(index) => (
          <div className="c-form-grid c-form-grid--three">
            <SelectField
              control={control}
              name={fieldPath<T>(`documentation.${index}.type`)}
              label="Tür"
              required
              options={TYPE_OPTIONS}
            />
            <TextField
              control={control}
              name={fieldPath<T>(`documentation.${index}.title`)}
              label="Başlık"
              required
            />
            <TextField
              control={control}
              name={fieldPath<T>(`documentation.${index}.url`)}
              label="Adres"
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
