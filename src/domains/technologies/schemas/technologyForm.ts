import { z } from 'zod';
import { enumChoice, optionalText, requiredChoice, requiredText } from '@/lib/validation';
import { TECHNOLOGY_STATUSES, type Technology, type TechnologyInput } from '../types';

export const technologyFormSchema = z.object({
  name: requiredText('Ad', 80),
  category: requiredChoice('bir kategori'),
  status: enumChoice(TECHNOLOGY_STATUSES, 'bir durum'),
  description: optionalText('Açıklama', 500),
});

export type TechnologyFormValues = z.infer<typeof technologyFormSchema>;

export function toTechnologyFormValues(technology?: Technology): TechnologyFormValues {
  return {
    name: technology?.name ?? '',
    category: technology?.category ?? 'backend',
    status: technology?.status ?? 'supported',
    description: technology?.description ?? '',
  };
}

export function toTechnologyInput(values: TechnologyFormValues): TechnologyInput {
  return { ...values, name: values.name.trim(), description: values.description.trim() };
}
