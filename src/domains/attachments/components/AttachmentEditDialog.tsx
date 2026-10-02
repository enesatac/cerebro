import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { TextField } from '@/components/forms/fields';
import { RecordDialog } from '@/components/forms/RecordDialog';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { requiredChoice, secretFreeText } from '@/lib/validation';
import { useUpdateAttachment } from '../api/mutations';
import type { Attachment } from '../types';

const schema = z.object({
  documentType: requiredChoice('bir belge türü'),
  description: secretFreeText('Açıklama', 300),
});
type Values = z.infer<typeof schema>;

/** Change a file's type or description (the file itself is replaced by uploading a new one). */
export function AttachmentEditDialog({
  attachment,
  onClose,
}: {
  attachment: Attachment;
  onClose: () => void;
}) {
  const save = useUpdateAttachment(attachment.id);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { documentType: attachment.documentType, description: attachment.description },
  });
  return (
    <RecordDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Eki düzenle"
      description={attachment.fileName}
      form={form}
      onSubmit={(values) => save.mutateAsync(values)}
      submitLabel="Kaydet"
    >
      <div className="c-form-grid">
        <MasterSelectField
          control={form.control}
          name="documentType"
          label="Belge türü"
          required
          list="documentTypes"
          className="c-form-grid__wide"
        />
        <TextField
          control={form.control}
          name="description"
          label="Açıklama"
          rows={2}
          className="c-form-grid__wide"
        />
      </div>
    </RecordDialog>
  );
}
