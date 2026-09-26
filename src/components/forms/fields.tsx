import { Chip, Field, Input, Select, Switch } from '@takeoff-ui/react-spar';
import type { ReactNode } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

/** Props every form field shares. `T` is the form's value type. */
export interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

/** Sentinel for "no value" in optional selects — Takeoff `Select` has no clearable empty value. */
const NONE = '__none__';

/** Stable empty array so controlled list values keep their identity between renders. */
const EMPTY_LIST: string[] = [];

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

function Message({ error, description }: { error: string | undefined; description: ReactNode }) {
  return error ? (
    <Field.ErrorMessage>{error}</Field.ErrorMessage>
  ) : description ? (
    <Field.Description>{description}</Field.Description>
  ) : null;
}

interface TextFieldProps<T extends FieldValues> extends FormFieldProps<T> {
  placeholder?: string;
  type?: 'text' | 'email' | 'url' | 'number';
  /** Renders a textarea with this many rows. */
  rows?: number;
  autoComplete?: string;
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  placeholder,
  type = 'text',
  rows,
  autoComplete = 'off',
}: TextFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field
          invalid={fieldState.invalid}
          required={required}
          disabled={disabled}
          className={className}
        >
          <Field.Label>{label}</Field.Label>
          <Input>
            {rows ? (
              <Input.Field
                as="textarea"
                rows={rows}
                name={field.name}
                value={String(field.value ?? '')}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                aria-invalid={fieldState.invalid}
                placeholder={placeholder}
              />
            ) : (
              <Input.Field
                type={type}
                name={field.name}
                value={String(field.value ?? '')}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                aria-invalid={fieldState.invalid}
                placeholder={placeholder}
                autoComplete={autoComplete}
              />
            )}
          </Input>
          <Message error={fieldState.error?.message} description={description} />
        </Field>
      )}
    />
  );
}

interface SelectFieldProps<T extends FieldValues> extends FormFieldProps<T> {
  options: readonly SelectOption[];
  placeholder?: string;
  /** Adds a "none" option that maps to an empty value (for optional references). */
  emptyLabel?: string;
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  options,
  placeholder = 'Seçin…',
  emptyLabel,
}: SelectFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const value = String(field.value ?? '');
        return (
          <Field
            invalid={fieldState.invalid}
            required={required}
            disabled={disabled}
            className={className}
          >
            <Field.Label>{label}</Field.Label>
            <Select
              name={field.name}
              value={value === '' ? (emptyLabel ? NONE : undefined) : value}
              onChange={(next) => field.onChange(next === NONE ? '' : next)}
              invalid={fieldState.invalid}
            >
              <Select.Trigger
                placeholder={placeholder}
                aria-invalid={fieldState.invalid}
                onBlur={field.onBlur}
              />
              <Select.Content>
                <Select.Viewport>
                  {emptyLabel && (
                    <Select.Item value={NONE} label={emptyLabel}>
                      {emptyLabel}
                    </Select.Item>
                  )}
                  {options.map((option) => (
                    <Select.Item key={option.value} value={option.value} label={option.label}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select>
            <Message error={fieldState.error?.message} description={description} />
          </Field>
        );
      }}
    />
  );
}

/** Free-form list of short strings (tags, user groups) using Takeoff `Input.Chips`. */
export function ChipsField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  placeholder = 'Yazıp Enter’a basın',
}: FormFieldProps<T> & { placeholder?: string }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field
          invalid={fieldState.invalid}
          required={required}
          disabled={disabled}
          className={className}
        >
          <Field.Label>{label}</Field.Label>
          <Input>
            <Input.Chips
              value={(field.value as string[] | undefined) ?? EMPTY_LIST}
              // Input.Chips reports its value back on sync; forwarding identical lists would loop.
              onValueChange={(next) => {
                const current = (field.value as string[] | undefined) ?? EMPTY_LIST;
                if (!sameList(current, next)) field.onChange(next);
              }}
              separator=","
            />
            <Input.Field
              placeholder={placeholder}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
            />
          </Input>
          <Message
            error={fieldState.error?.message}
            description={description ?? 'Her değeri eklemek için Enter’a basın veya virgül yazın.'}
          />
        </Field>
      )}
    />
  );
}

/** Pick several catalogued entities: a Select adds, removable chips show the choice. */
export function MultiSelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  options,
  addLabel,
}: FormFieldProps<T> & { options: readonly SelectOption[]; addLabel: string }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selected = (field.value as string[] | undefined) ?? EMPTY_LIST;
        const labelOf = (value: string) =>
          options.find((option) => option.value === value)?.label ?? value;
        const available = options.filter((option) => !selected.includes(option.value));
        return (
          <Field
            invalid={fieldState.invalid}
            required={required}
            disabled={disabled}
            className={className}
          >
            <Field.Label>{label}</Field.Label>
            {/* Remounting after each pick resets the Select to its placeholder. */}
            <Select
              key={selected.length}
              onChange={(value) => field.onChange([...selected, value])}
              invalid={fieldState.invalid}
              disabled={disabled || available.length === 0}
            >
              <Select.Trigger
                placeholder={available.length === 0 ? 'Tüm seçenekler eklendi' : addLabel}
                aria-invalid={fieldState.invalid}
                onBlur={field.onBlur}
              />
              <Select.Content>
                <Select.Viewport>
                  {available.map((option) => (
                    <Select.Item key={option.value} value={option.value} label={option.label}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select>
            {selected.length > 0 && (
              <ul className="c-chip-list" aria-label={`Seçilen: ${label}`}>
                {selected.map((value) => (
                  <li key={value}>
                    <Chip
                      variant="neutral"
                      appearance="outlined"
                      size="small"
                      removable
                      autoDismiss={false}
                      disabled={disabled}
                      onRemove={() => field.onChange(selected.filter((item) => item !== value))}
                    >
                      {labelOf(value)}
                    </Chip>
                  </li>
                ))}
              </ul>
            )}
            <Message error={fieldState.error?.message} description={description} />
          </Field>
        );
      }}
    />
  );
}

export function SwitchField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  className,
}: FormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field invalid={fieldState.invalid} disabled={disabled} className={className}>
          <Field.Label>{label}</Field.Label>
          <Switch checked={Boolean(field.value)} onChange={field.onChange} name={field.name}>
            <Switch.Indicator />
          </Switch>
          <Message error={fieldState.error?.message} description={description} />
        </Field>
      )}
    />
  );
}
