import { Field, Radio } from '@takeoff-ui/react-spar';
import { Controller, type FieldValues } from 'react-hook-form';
import type { FormFieldProps } from '@/components/forms/fields';
import { DEMAND_SCORES } from '../types';

/** A 1–5 score as a row of radio buttons; the value is the digit as text ('' = not scored). */
export function ScoreField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
}: FormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field invalid={fieldState.invalid} className={className}>
          <Field.Label>{label}</Field.Label>
          <Radio
            aria-label={label}
            orientation="horizontal"
            size="small"
            name={field.name}
            value={String(field.value ?? '')}
            onChange={field.onChange}
            className="c-score-field"
          >
            {DEMAND_SCORES.map((score) => (
              <Radio.Item key={score} value={String(score)}>
                <Radio.Indicator />
                <Radio.Label>{score}</Radio.Label>
              </Radio.Item>
            ))}
          </Radio>
          {fieldState.error ? (
            <Field.ErrorMessage>{fieldState.error.message}</Field.ErrorMessage>
          ) : (
            description && <Field.Description>{description}</Field.Description>
          )}
        </Field>
      )}
    />
  );
}
