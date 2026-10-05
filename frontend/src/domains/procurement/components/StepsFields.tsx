import { Button } from '@takeoff-ui/react-spar';
import { useFieldArray, type Control } from 'react-hook-form';
import { DateField } from '@/components/forms/DateField';
import { SelectField, TextField } from '@/components/forms/fields';
import { RepeatableList } from '@/components/forms/RepeatableList';
import { SectionCard } from '@/components/layout/SectionCard';
import { useMasterData } from '@/domains/master-data/context';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { usePersonOptions } from '@/domains/people/api/queries';
import { emptyStep, templateSteps, type StepsFormValues } from '../schemas/stepsForm';

/** The ordered steps of a purchase: what, status, owner, planned and actual dates, a note. */
export function StepsFields({
  control,
  error,
}: {
  control: Control<StepsFormValues>;
  error?: string;
}) {
  const { fields, append, remove, move, replace } = useFieldArray({ control, name: 'steps' });
  const masterData = useMasterData();
  const people = usePersonOptions();
  const label = (index: number) => `${index + 1}. adım`;
  return (
    <SectionCard
      title="Süreç adımları"
      description="Adımlar sırayla ilerler; ilk tamamlanmamış adım güncel adımdır. Planlanan tarihler hedefi, gerçekleşen tarihler olanı gösterir."
      actions={
        fields.length === 0 ? (
          <Button
            type="button"
            size="small"
            variant="neutral"
            appearance="outlined"
            onClick={() => replace(templateSteps(masterData.options('procurementSteps')))}
          >
            Standart adımları ekle
          </Button>
        ) : undefined
      }
    >
      <RepeatableList
        items={fields}
        onAdd={() => append(emptyStep())}
        onRemove={remove}
        onMove={move}
        addLabel="Adım ekle"
        emptyText="Henüz adım yok. Standart adımlarla başlayabilir ya da tek tek ekleyebilirsiniz."
        error={error}
        itemLabel={label}
        removeLabel={(index) => `${label(index)}: kaldır`}
        renderItem={(index) => (
          <div className="c-form-grid">
            <MasterSelectField
              control={control}
              name={`steps.${index}.type`}
              label={label(index)}
              required
              list="procurementSteps"
            />
            <MasterSelectField
              control={control}
              name={`steps.${index}.status`}
              label="Durum"
              required
              list="procurementStepStatuses"
            />
            <SelectField
              control={control}
              name={`steps.${index}.ownerId`}
              label="Sorumlu"
              options={people}
              emptyLabel="Atanmamış"
            />
            <DateField
              control={control}
              name={`steps.${index}.plannedStart`}
              label="Planlanan başlangıç"
            />
            <DateField
              control={control}
              name={`steps.${index}.plannedEnd`}
              label="Planlanan bitiş"
            />
            <DateField
              control={control}
              name={`steps.${index}.actualStart`}
              label="Gerçekleşen başlangıç"
            />
            <DateField
              control={control}
              name={`steps.${index}.actualEnd`}
              label="Gerçekleşen bitiş"
            />
            <TextField
              control={control}
              name={`steps.${index}.note`}
              label="Açıklama"
              className="c-form-grid__wide"
              placeholder="ör. 3 tedarikçiden teklif bekleniyor"
            />
          </div>
        )}
      />
    </SectionCard>
  );
}
