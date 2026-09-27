import { Field, Select } from '@takeoff-ui/react-spar';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  label: string;
  /** Current filter; record ids may be passed as numbers. */
  value: string | number | null;
  options: readonly FilterOption[];
  /** Label of the "no filter" option, e.g. "All lifecycles". */
  allLabel: string;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

/** Sentinel for "no filter" — Takeoff `Select` has no clearable empty value. */
const ALL = '__all__';

/** Single-choice filter built on Takeoff `Field` + `Select`, with an explicit "All" option. */
export function FilterSelect({
  label,
  value,
  options,
  allLabel,
  onChange,
  disabled,
}: FilterSelectProps) {
  return (
    <Field className="c-filter-select" disabled={disabled}>
      <Field.Label>{label}</Field.Label>
      <Select
        size="small"
        value={value === null ? ALL : String(value)}
        onChange={(next) => onChange(next === ALL ? null : next)}
      >
        <Select.Trigger placeholder={allLabel} />
        <Select.Content>
          <Select.Viewport>
            <Select.Item value={ALL} label={allLabel}>
              {allLabel}
            </Select.Item>
            {options.map((option) => (
              <Select.Item key={option.value} value={option.value} label={option.label}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select>
    </Field>
  );
}
