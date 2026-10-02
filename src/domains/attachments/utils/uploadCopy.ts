import type { UploadRejection } from '@takeoff-ui/react-spar';
import { MAX_SIZE_LABEL } from './attachmentFiles';

export function describeRejection(rejection: UploadRejection): string {
  const name = rejection.file.name;
  if (rejection.code === 'file-invalid-type') {
    return `${name}: bu dosya türü yüklenemez (belge, tablo, sunum, görsel veya zip yükleyin).`;
  }
  if (rejection.code === 'file-too-large')
    return `${name}: dosya ${MAX_SIZE_LABEL} sınırını aşıyor.`;
  return `${name}: yüklenemedi.`;
}

/** Turkish copy for Takeoff Upload's row states and actions. */
export const UPLOAD_COPY = {
  uploadingLabel: 'Yükleniyor…',
  processingLabel: 'İşleniyor…',
  completedLabel: 'Yüklendi',
  errorLabel: 'Yüklenemedi',
  progressLabel: '{name} yükleme durumu',
  downloadLabel: 'İndir: {name}',
  removeLabel: 'Listeden kaldır: {name}',
} as const;
