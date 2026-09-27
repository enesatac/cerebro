import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { DateField } from '@/components/forms/DateField';
import { SelectField, TextField } from '@/components/forms/fields';
import { RecordDialog } from '@/components/forms/RecordDialog';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { usePersonOptions } from '@/domains/people/api/queries';
import { formatDateRange } from '@/lib/dates';
import { useSaveLeave } from '../api/mutations';
import {
  leaveFormSchema,
  toLeaveFormValues,
  toLeaveInput,
  type LeaveFormValues,
} from '../schemas/leaveForm';
import type { LeaveRecord } from '../types';
import { calendarDaysBetween, workingDays } from '../utils/leaveCalendar';

interface LeaveDialogProps {
  leave: LeaveRecord | null;
  /** Person and day picked on the calendar for a new leave. */
  prefill?: { personId?: number; date?: string };
  onClose: () => void;
}

function Duration({
  control,
}: {
  control: ReturnType<typeof useForm<LeaveFormValues>>['control'];
}) {
  const [start, end] = useWatch({ control, name: ['startDate', 'endDate'] });
  if (!start || !end || end < start) return null;
  const days = workingDays(start, end);
  const total = calendarDaysBetween(start, end);
  return (
    <p className="c-leave-duration" aria-live="polite">
      <strong>{formatDateRange(start, end)}</strong> · {days} iş günü
      {total !== days && <span className="c-muted"> ({total} takvim günü)</span>}
    </p>
  );
}

/** Add or edit a leave. Overlaps with the person's other leaves are refused by the server. */
export function LeaveDialog({ leave, prefill, onClose }: LeaveDialogProps) {
  const people = usePersonOptions();
  const save = useSaveLeave(leave?.id);
  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: toLeaveFormValues(leave ?? undefined, prefill),
    mode: 'onTouched',
  });
  const { control } = form;
  return (
    <RecordDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={leave ? 'İzni düzenle' : 'İzin ekle'}
      description="Başlangıç ve bitiş günleri dahildir; hafta sonları izin gününden sayılmaz."
      form={form}
      onSubmit={(values) => save.mutateAsync(toLeaveInput(values))}
      submitLabel={leave ? 'Değişiklikleri kaydet' : 'İzni kaydet'}
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
        <MasterSelectField
          control={control}
          name="type"
          label="İzin türü"
          required
          list="leaveTypes"
          className="c-form-grid__wide"
        />
        <DateField control={control} name="startDate" label="Başlangıç" required />
        <DateField control={control} name="endDate" label="Bitiş" required />
        <div className="c-form-grid__wide">
          <Duration control={control} />
        </div>
        <TextField
          control={control}
          name="note"
          label="Not"
          rows={2}
          description="İsteğe bağlı, ekibin göreceği kısa bilgi. Sağlık ayrıntısı yazmayın."
          className="c-form-grid__wide"
        />
      </div>
    </RecordDialog>
  );
}
