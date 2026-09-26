import { z } from 'zod';
import { email, emptyToNull, optionalText, requiredText } from '@/lib/validation';
import type { Person, PersonInput } from '../types';

export const personFormSchema = z.object({
  fullName: requiredText('Ad soyad', 80),
  jobTitle: requiredText('Unvan', 100),
  email: email('E-posta'),
  businessUnitId: z.string(),
  location: optionalText('Konum', 60),
});

export type PersonFormValues = z.infer<typeof personFormSchema>;

export function toPersonFormValues(person?: Person): PersonFormValues {
  return {
    fullName: person?.fullName ?? '',
    jobTitle: person?.jobTitle ?? '',
    email: person?.email ?? '',
    businessUnitId: person?.businessUnitId ?? '',
    location: person?.location ?? '',
  };
}

export function toPersonInput(values: PersonFormValues): PersonInput {
  return {
    fullName: values.fullName.trim(),
    jobTitle: values.jobTitle.trim(),
    email: values.email.trim().toLowerCase(),
    businessUnitId: emptyToNull(values.businessUnitId),
    location: emptyToNull(values.location),
  };
}
