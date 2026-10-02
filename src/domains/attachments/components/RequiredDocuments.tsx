import { Upload } from '@takeoff-ui/react-spar';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { usePermission } from '@/domains/auth/api/queries';
import { useMasterData } from '@/domains/master-data/context';
import { getErrorMessage } from '@/lib/errors';
import { toaster } from '@/lib/toaster';
import { useUploadAttachment } from '../api/mutations';
import { MAX_ATTACHMENT_BYTES, type Attachment, type AttachmentOwner } from '../types';
import { ACCEPT_ATTRIBUTE } from '../utils/attachmentFiles';
import { describeRejection, UPLOAD_COPY } from '../utils/uploadCopy';
import { useAttachmentFile } from './useAttachmentFile';

interface RequiredDocumentsProps {
  owner: AttachmentOwner;
  required: readonly string[];
  attachments: readonly Attachment[];
}

/**
 * The documents every record of this type should carry: each shows whether it is there (with the
 * latest file) and, for editors, uploads straight into that type.
 */
export function RequiredDocuments({ owner, required, attachments }: RequiredDocumentsProps) {
  const masterData = useMasterData();
  const canEdit = usePermission('portfolio:edit');
  const upload = useUploadAttachment();
  const file = useAttachmentFile();
  const present = required.filter((type) => attachments.some((a) => a.documentType === type));

  const send = async (documentType: string, picked: File | undefined) => {
    if (!picked) return;
    try {
      await upload.mutateAsync({
        owner,
        documentType,
        description: '',
        file: picked,
        fileName: picked.name,
      });
    } catch (error) {
      toaster.error({ title: `${picked.name} yüklenemedi`, description: getErrorMessage(error) });
    }
  };

  return (
    <section className="c-required-docs" aria-label="Gerekli belgeler">
      <p className="c-required-docs__summary">
        <strong>Gerekli belgeler:</strong> {present.length}/{required.length} yüklendi
        {present.length < required.length && (
          <span className="c-muted"> · eksikler aşağıda işaretli</span>
        )}
      </p>
      <ul className="c-required-docs__list">
        {required.map((type) => {
          const files = attachments.filter((a) => a.documentType === type);
          const latest = files[0];
          return (
            <li key={type} className={`c-required-doc${latest ? '' : ' c-required-doc--missing'}`}>
              <div className="c-required-doc__text">
                <strong>{masterData.label('documentTypes', type)}</strong>
                {latest ? (
                  <button
                    type="button"
                    className="c-link c-link-button c-required-doc__file"
                    onClick={() => file.open(latest)}
                  >
                    {latest.fileName}
                    {files.length > 1 && (
                      <span className="c-muted"> (+{files.length - 1} sürüm)</span>
                    )}
                  </button>
                ) : (
                  <span className="c-muted">Henüz yüklenmedi</span>
                )}
              </div>
              <span className="c-required-doc__badge">
                <StatusBadge
                  label={latest ? 'Yüklendi' : 'Eksik'}
                  variant={latest ? 'success' : 'warning'}
                />
              </span>
              {canEdit && (
                <Upload
                  accept={ACCEPT_ATTRIBUTE}
                  maxFileSize={MAX_ATTACHMENT_BYTES}
                  onFileAccept={(accepted) => void send(type, accepted[0]?.file)}
                  onFilesReject={(rejections) =>
                    rejections[0] &&
                    toaster.error({
                      title: 'Dosya yüklenemedi',
                      description: describeRejection(rejections[0]),
                    })
                  }
                  {...UPLOAD_COPY}
                  className="c-required-doc__upload"
                >
                  <Upload.Trigger
                    aria-label={`${masterData.label('documentTypes', type)} ${latest ? 'için yeni sürüm yükle' : 'yükle'}`}
                  >
                    {latest ? 'Yeni sürüm' : 'Yükle'}
                  </Upload.Trigger>
                </Upload>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
