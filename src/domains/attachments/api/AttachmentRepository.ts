import type { DeletionImpact } from '@/domains/shared/types';
import type {
  Attachment,
  AttachmentId,
  AttachmentOwner,
  AttachmentOwnerType,
  AttachmentUpdate,
  AttachmentUpload,
} from '../types';

/**
 * Files attached to records. Reading (list and download) is open to every signed-in user;
 * uploading and editing need `portfolio:edit`, deleting `portfolio:delete`.
 */
export interface AttachmentRepository {
  list(owner: AttachmentOwner): Promise<Attachment[]>;
  /** Number of files per record of a type, for registers ("Ekler (2)"). */
  countByOwner(type: AttachmentOwnerType): Promise<Map<number, number>>;
  /** @throws ForbiddenError, ValidationError (type, size, name), NotFoundError (owner) */
  upload(input: AttachmentUpload): Promise<Attachment>;
  update(id: AttachmentId, input: AttachmentUpdate): Promise<Attachment>;
  remove(id: AttachmentId): Promise<void>;
  getDeletionImpact(id: AttachmentId): Promise<DeletionImpact>;
  /** The file's bytes. @throws NotFoundError */
  download(id: AttachmentId): Promise<Blob>;
}
