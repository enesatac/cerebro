import { Field, Input, Select, Upload, type UploadFile } from '@takeoff-ui/react-spar';
import { useState } from 'react';
import { useMasterData } from '@/domains/master-data/context';
import { getErrorMessage } from '@/lib/errors';
import { useUploadAttachment } from '../api/mutations';
import { MAX_ATTACHMENT_BYTES, type AttachmentOwner } from '../types';
import { ACCEPT_ATTRIBUTE, MAX_SIZE_LABEL } from '../utils/attachmentFiles';
import { describeRejection, UPLOAD_COPY } from '../utils/uploadCopy';

/**
 * Drop files or pick them; each accepted file uploads at once with the chosen type and
 * description, and its row shows progress, then success or the server's reason for refusing it.
 */
export function AttachmentUploader({
  owner,
  defaultType = 'other',
}: {
  owner: AttachmentOwner;
  defaultType?: string;
}) {
  const masterData = useMasterData();
  const upload = useUploadAttachment();
  const [documentType, setDocumentType] = useState(defaultType);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);

  const patch = (id: string, next: Partial<UploadFile>) =>
    setFiles((current) => current.map((f) => (f.id === id ? { ...f, ...next } : f)));

  const send = async (accepted: UploadFile[]) => {
    setRejected([]);
    for (const entry of accepted) {
      if (!entry.file) continue;
      patch(entry.id, { status: 'uploading', progress: 40 });
      try {
        await upload.mutateAsync({
          owner,
          documentType,
          description,
          file: entry.file,
          fileName: entry.name ?? entry.file.name,
        });
        patch(entry.id, { status: 'completed', progress: 100 });
      } catch (error) {
        patch(entry.id, { status: 'error', error: getErrorMessage(error) });
      }
    }
  };

  return (
    <div className="c-uploader">
      <div className="c-form-grid">
        <Field>
          <Field.Label>Belge türü</Field.Label>
          <Select size="small" value={documentType} onChange={setDocumentType}>
            <Select.Trigger />
            <Select.Content>
              <Select.Viewport>
                {masterData.options('documentTypes', documentType).map((option) => (
                  <Select.Item key={option.value} value={option.value} label={option.label}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select>
        </Field>
        <Field>
          <Field.Label>Açıklama</Field.Label>
          <Input size="small">
            <Input.Field
              value={description}
              maxLength={300}
              placeholder="İsteğe bağlı, ör. sürüm veya kapsam"
              onChange={(event) => setDescription(event.target.value)}
            />
          </Input>
          <Field.Description>Seçili dosyaların hepsine uygulanır.</Field.Description>
        </Field>
      </div>
      <Upload
        multiple
        accept={ACCEPT_ATTRIBUTE}
        maxFileSize={MAX_ATTACHMENT_BYTES}
        value={files}
        onValueChange={setFiles}
        onFileAccept={(accepted) => void send(accepted)}
        onFilesReject={(rejections) => setRejected(rejections.map(describeRejection))}
        {...UPLOAD_COPY}
      >
        <Upload.Dropzone>
          <span className="c-uploader__prompt">Dosyaları buraya sürükleyip bırakın</span>
          <Upload.Trigger>Dosya seç</Upload.Trigger>
          <span className="c-uploader__hint">
            PDF, Word, Excel, PowerPoint, görsel, Visio/draw.io veya zip · dosya başına en fazla{' '}
            {MAX_SIZE_LABEL}. Şifre veya anahtar içeren dosya yüklemeyin.
          </span>
        </Upload.Dropzone>
        <Upload.List />
      </Upload>
      {rejected.length > 0 && (
        <ul className="c-form-error-list" role="alert">
          {rejected.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
