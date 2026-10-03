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
 * Files attached to records. Reading (list, counts, download) needs the view privilege of the
 * record's screen (`attachmentViewPrivileges`); uploading and editing its `edit`, deleting its
 * `delete` privilege. A demand's requester also manages the files of their own open demand.
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
