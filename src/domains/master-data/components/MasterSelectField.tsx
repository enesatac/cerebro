import { useWatch, type FieldValues } from 'react-hook-form';
import { SelectField, type FormFieldProps } from '@/components/forms/fields';
import { useMasterData } from '../context';
import type { MasterDataListKey } from '../types';

interface MasterSelectFieldProps<T extends FieldValues> extends FormFieldProps<T> {
  /** The master data list that supplies the options. */
  list: MasterDataListKey;
  /** Restricts the options to these codes (e.g. risk likelihood uses low–high of the scale). */
  only?: readonly string[];
  /** Codes listed first, in this order (e.g. owner roles on an application form). */
  prefer?: readonly string[];
  emptyLabel?: string;
}

/**
 * A select whose options come from an administrable list: active values in admin order, plus the
 * record's current value even when it has since been deactivated.
 */
export function MasterSelectField<T extends FieldValues>({
  list,
  only,
  prefer = [],
  ...props
}: MasterSelectFieldProps<T>) {
  const current = useWatch({ control: props.control, name: props.name }) as unknown;
  const options = useMasterData()
    .options(list, typeof current === 'string' ? current : null)
    .filter((option) => !only || only.includes(option.value));
  const rank = (code: string) => (prefer.includes(code) ? prefer.indexOf(code) : prefer.length);
  options.sort((a, b) => rank(a.value) - rank(b.value));
  return <SelectField {...props} options={options} />;
}
