import { Calendar, Field, Input, Popover, useDatePicker } from '@takeoff-ui/react-spar';
import { CalendarIconOutlinedRounded } from '@takeoff-icons/react/calendar';
import { format, isValid, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Controller,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldValues,
} from 'react-hook-form';
import type { FormFieldProps } from './fields';

const toDate = (value: unknown): Date | undefined => {
  if (typeof value !== 'string' || value === '') return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
};

interface PickerProps<T extends FieldValues> {
  field: ControllerRenderProps<T>;
  fieldState: ControllerFieldState;
  label: string;
  description: FormFieldProps<T>['description'];
  required: boolean | undefined;
  disabled: boolean | undefined;
}

/**
 * Takeoff has no DatePicker component: it is `useDatePicker` + `Popover` + `Calendar`, composed as
 * the official React Hook Form guide shows. The form stores ISO dates (`yyyy-MM-dd`), the hook
 * works with `Date`s, so values are converted at this boundary.
 */
function DatePickerControl<T extends FieldValues>({
  field,
  fieldState,
  label,
  description,
  required,
  disabled,
}: PickerProps<T>) {
  const picker = useDatePicker({
    defaultValue: toDate(field.value),
    onValueChange: (date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : ''),
  });

  return (
    <Field invalid={fieldState.invalid} required={required} disabled={disabled}>
      <Field.Label>{label}</Field.Label>
      <Popover {...picker.popoverProps}>
        <Input>
          <Input.Field
            {...picker.inputProps}
            name={field.name}
            onBlur={field.onBlur}
            aria-invalid={fieldState.invalid}
          />
          <Popover.Trigger
            aria-label={`${label}: takvimden seç`}
            classNames={{ root: 'tk-input-action' }}
          >
            <CalendarIconOutlinedRounded width={20} height={20} aria-hidden="true" />
          </Popover.Trigger>
        </Input>
        <Popover.Content align="end" classNames={{ root: 'tk-datepicker-panel' }}>
          <Calendar {...picker.calendarProps} locale={tr} />
        </Popover.Content>
      </Popover>
      {fieldState.error ? (
        <Field.ErrorMessage>{fieldState.error.message}</Field.ErrorMessage>
      ) : (
        <Field.Description>
          {description ?? 'gg/aa/yyyy biçiminde yazın veya takvimden seçin.'}
        </Field.Description>
      )}
    </Field>
  );
}

export function DateField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
}: FormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <DatePickerControl
          field={field}
          fieldState={fieldState}
          label={label}
          description={description}
          required={required}
          disabled={disabled}
        />
      )}
    />
  );
}
