import { Calendar, Field, Input, Popover, useDatePicker } from '@takeoff-ui/react-spar';
import { CalendarIconOutlinedRounded } from '@takeoff-icons/react/calendar';
import { format, isValid, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useEffect } from 'react';
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

  // The picker is uncontrolled; follow values set from outside (`setValue`, `reset`, a default
  // derived from another field) so the input never shows something other than the form state.
  const formValue = typeof field.value === 'string' ? field.value : '';
  const pickerValue = picker.value ? format(picker.value, 'yyyy-MM-dd') : '';
  const { setValue } = picker;
  useEffect(() => {
    if (formValue !== pickerValue && (formValue === '' || toDate(formValue))) {
      setValue(toDate(formValue));
    }
    // Only react to the form value; the picker reports its own edits through onValueChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValue, setValue]);

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
