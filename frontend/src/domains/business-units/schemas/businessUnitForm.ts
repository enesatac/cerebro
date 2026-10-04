import { z } from 'zod';
import { idText, optionalText, requiredText, toIdOrNull } from '@/lib/validation';
import type { BusinessUnit, BusinessUnitInput } from '../types';

export const businessUnitFormSchema = z.object({
  code: requiredText('Kod', 12).regex(
    /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/,
    'Yalnızca büyük harf, rakam ve kısa çizgi kullanın.',
  ),
  name: requiredText('Ad', 80),
  description: optionalText('Açıklama', 300),
  headId: z.string(),
});

export type BusinessUnitFormValues = z.infer<typeof businessUnitFormSchema>;

export function toBusinessUnitFormValues(unit?: BusinessUnit): BusinessUnitFormValues {
  return {
    code: unit?.code ?? '',
    name: unit?.name ?? '',
    description: unit?.description ?? '',
    headId: idText(unit?.headId),
  };
}

export function toBusinessUnitInput(values: BusinessUnitFormValues): BusinessUnitInput {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    description: values.description.trim(),
    headId: toIdOrNull(values.headId),
  };
}
