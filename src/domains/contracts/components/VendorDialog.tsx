import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { TextField } from '@/components/forms/fields';
import { RecordDialog } from '@/components/forms/RecordDialog';
import { useSaveVendor } from '../api/mutations';
import {
  toVendorFormValues,
  toVendorInput,
  vendorFormSchema,
  type VendorFormValues,
} from '../schemas/vendorForm';
import type { Vendor } from '../types';

/** Add or edit a supplier. Business contacts only — never bank details or credentials. */
export function VendorDialog({ vendor, onClose }: { vendor: Vendor | null; onClose: () => void }) {
  const save = useSaveVendor(vendor?.id);
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: toVendorFormValues(vendor),
    mode: 'onTouched',
  });
  const { control } = form;
  return (
    <RecordDialog
      open
      wide
      onOpenChange={(open) => !open && onClose()}
      title={vendor ? `Tedarikçiyi düzenle: ${vendor.name}` : 'Tedarikçi ekle'}
      description="Banka hesabı, şifre veya portal giriş bilgisi yazmayın."
      form={form}
      onSubmit={(values) => save.mutateAsync(toVendorInput(values))}
      submitLabel={vendor ? 'Değişiklikleri kaydet' : 'Tedarikçi ekle'}
    >
      <div className="c-form-grid">
        <TextField control={control} name="name" label="Firma adı" required />
        <TextField control={control} name="taxNumber" label="Vergi numarası" />
        <TextField control={control} name="contactName" label="İletişim kişisi" />
        <TextField control={control} name="contactEmail" label="E-posta" type="email" />
        <TextField control={control} name="contactPhone" label="Telefon" />
        <TextField control={control} name="website" label="Web sitesi" type="url" />
        <TextField
          control={control}
          name="notes"
          label="Not"
          rows={2}
          className="c-form-grid__wide"
        />
      </div>
    </RecordDialog>
  );
}
