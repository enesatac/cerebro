import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@takeoff-ui/react-spar';
import { useEffect } from 'react';
import { useForm, useWatch, type Control, type UseFormReturn } from 'react-hook-form';
import { DateField } from '@/components/forms/DateField';
import { SelectField, TextField } from '@/components/forms/fields';
import { RecordDialog } from '@/components/forms/RecordDialog';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { usePeopleById, usePersonOptions } from '@/domains/people/api/queries';
import { useProject, useProjectOptions } from '@/domains/projects/api/queries';
import { formatDateRange } from '@/lib/dates';
import { toId } from '@/lib/validation';
import { useSaveAllocation } from '../api/mutations';
import { useAllocations } from '../api/queries';
import {
  allocationFormSchema,
  PERCENT_CHOICES,
  toAllocationFormValues,
  toAllocationInput,
  type AllocationFormValues,
  type AllocationPrefill,
} from '../schemas/allocationForm';
import { FULL_LOAD, type Allocation } from '../types';
import { loadSegments, peakLoad } from '../utils/resourcePlan';

const PERCENT_OPTIONS = PERCENT_CHOICES.map((percent) => ({
  value: String(percent),
  label: percent === 100 ? '%100 (tam zamanlı)' : `%${percent}`,
}));

/** Fills empty dates from the chosen project's timeline (actual dates first, then planned). */
function useProjectDates(form: UseFormReturn<AllocationFormValues>) {
  const projectId = useWatch({ control: form.control, name: 'projectId' });
  const id = projectId ? toId(projectId) : 0;
  const project = useProject(id, id > 0);
  useEffect(() => {
    const timeline = project.data?.timeline;
    if (!timeline) return;
    const start = timeline.actualStartDate ?? timeline.plannedStartDate;
    const end = timeline.actualEndDate ?? timeline.plannedEndDate;
    const values = form.getValues();
    if (!values.startDate && start) form.setValue('startDate', start, { shouldValidate: true });
    if (!values.endDate && end && end >= (form.getValues('startDate') || end)) {
      form.setValue('endDate', end, { shouldValidate: true });
    }
  }, [project.data, form]);
}

/**
 * What the person's load would be with this allocation: the peak across its dates, counting
 * every other allocation they have. Saving is allowed above 100 % — the planner decides — but
 * it is said plainly before saving.
 */
function LoadPreview({
  control,
  editingId,
}: {
  control: Control<AllocationFormValues>;
  editingId: number | null;
}) {
  const [personId, startDate, endDate, percent] = useWatch({
    control,
    name: ['personId', 'startDate', 'endDate', 'percent'],
  });
  const people = usePeopleById();
  const ready = Boolean(personId && startDate && endDate && endDate >= startDate && percent);
  const period = { from: startDate, to: endDate };
  const others = useAllocations({ ...period, personIds: personId ? [toId(personId)] : [] }, ready);
  if (!ready || !others.data) return null;
  const candidate: Allocation = {
    id: -1,
    personId: toId(personId),
    projectId: 0,
    role: '',
    startDate,
    endDate,
    percent: Number(percent),
    note: '',
    audit: {
      createdAt: '',
      createdBy: null,
      updatedAt: '',
      updatedBy: null,
      lastReviewedAt: null,
      lastReviewedBy: null,
    },
  };
  const all = [...others.data.filter((a) => a.id !== editingId), candidate];
  const peak = peakLoad(loadSegments(all, period));
  const name = people.data?.get(toId(personId))?.fullName ?? 'Kişi';
  const parallel = peak.count > 1 ? ` (${peak.count} paralel iş)` : '';
  if (peak.percent > FULL_LOAD) {
    return (
      <Alert variant="warning" appearance="outlined" role="status">
        <Alert.Content>
          <Alert.Title>Aşırı yük: en fazla %{peak.percent}</Alert.Title>
          <Alert.Description>
            Bu atamayla {name}, {formatDateRange(startDate, endDate)} arasında %{peak.percent} yüklü
            olacak{parallel}. Kaydedebilirsiniz; diğer atamaların oranını azaltmayı düşünün.
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  return (
    <p className="c-leave-duration" role="status">
      Bu atamayla {name} en fazla <strong>%{peak.percent}</strong> yüklü olacak{parallel}.
    </p>
  );
}

interface AllocationDialogProps {
  allocation: Allocation | null;
  prefill?: AllocationPrefill;
  onClose: () => void;
}

/** Plan a person onto a project, or change an existing allocation. */
export function AllocationDialog({ allocation, prefill, onClose }: AllocationDialogProps) {
  const people = usePersonOptions();
  const projects = useProjectOptions();
  const save = useSaveAllocation(allocation?.id);
  const form = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationFormSchema),
    defaultValues: toAllocationFormValues(allocation ?? undefined, prefill),
    mode: 'onTouched',
  });
  useProjectDates(form);
  const { control } = form;
  return (
    <RecordDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={allocation ? 'Atamayı düzenle' : 'Kaynak ata'}
      description="Kişiyi bir projeye, tarih aralığı ve zamanının ne kadarıyla planlayın. Tarihler boşsa projenin tarihleri kullanılır."
      form={form}
      onSubmit={(values) => save.mutateAsync(toAllocationInput(values))}
      submitLabel={allocation ? 'Değişiklikleri kaydet' : 'Atamayı kaydet'}
    >
      <div className="c-form-grid">
        <SelectField
          control={control}
          name="personId"
          label="Kişi"
          required
          options={people}
          className="c-form-grid__wide"
        />
        <SelectField
          control={control}
          name="projectId"
          label="Proje"
          required
          options={projects}
          className="c-form-grid__wide"
        />
        <MasterSelectField
          control={control}
          name="role"
          label="Projedeki rolü"
          required
          list="stakeholderRoles"
        />
        <SelectField
          control={control}
          name="percent"
          label="Doluluk"
          required
          options={PERCENT_OPTIONS}
          description="Haftalık çalışma süresinin ne kadarı."
        />
        <DateField control={control} name="startDate" label="Başlangıç" required />
        <DateField control={control} name="endDate" label="Bitiş" required />
        <div className="c-form-grid__wide">
          <LoadPreview control={control} editingId={allocation?.id ?? null} />
        </div>
        <TextField
          control={control}
          name="note"
          label="Not"
          rows={2}
          description="İsteğe bağlı, örneğin hangi iş paketi."
          className="c-form-grid__wide"
        />
      </div>
    </RecordDialog>
  );
}
