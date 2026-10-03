import { z } from 'zod';
import {
  optionalEmail,
  optionalText,
  optionalUrl,
  requiredText,
  secretFreeText,
} from '@/lib/validation';
import type { Vendor, VendorInput } from '../types';

export const vendorFormSchema = z.object({
  name: requiredText('Firma adı'),
  taxNumber: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || /^\d{10,11}$/.test(v),
      'Vergi numarası 10 veya 11 haneli olmalıdır.',
    ),
  contactName: optionalText('İletişim kişisi', 120),
  contactEmail: optionalEmail,
  contactPhone: optionalText('Telefon', 40),
  website: optionalUrl,
  notes: secretFreeText('Not', 1000),
});

export type VendorFormValues = z.infer<typeof vendorFormSchema>;

export const toVendorFormValues = (vendor?: Vendor | null): VendorFormValues => ({
  name: vendor?.name ?? '',
  taxNumber: vendor?.taxNumber ?? '',
  contactName: vendor?.contactName ?? '',
  contactEmail: vendor?.contactEmail ?? '',
  contactPhone: vendor?.contactPhone ?? '',
  website: vendor?.website ?? '',
  notes: vendor?.notes ?? '',
});

export const toVendorInput = (values: VendorFormValues): VendorInput => ({
  name: values.name.trim(),
  taxNumber: values.taxNumber.trim(),
  contactName: values.contactName.trim(),
  contactEmail: values.contactEmail.trim().toLowerCase(),
  contactPhone: values.contactPhone.trim(),
  website: values.website.trim(),
  notes: values.notes.trim(),
});
