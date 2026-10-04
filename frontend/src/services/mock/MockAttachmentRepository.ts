import type { AttachmentRepository } from '@/domains/attachments/api/AttachmentRepository';
import {
  MAX_ATTACHMENT_BYTES,
  type Attachment,
  type AttachmentOwner,
  type AttachmentOwnerType,
} from '@/domains/attachments/types';
import {
  attachmentPrivilege,
  attachmentViewPrivileges,
} from '@/domains/attachments/utils/attachmentPrivileges';
import { canAttachToDemand } from '@/domains/demands/utils/demandAccess';
import {
  isAllowedFileName,
  MAX_SIZE_LABEL,
  sanitizeFileName,
} from '@/domains/attachments/utils/attachmentFiles';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { looksLikeSecret, NO_SECRETS_MESSAGE } from '@/lib/validation';
import type { BlobStore } from './blobStore';
import { NO_IMPACT, sameOwner } from './cascade';
import { SEED_ATTACHMENT_COUNT, seedAttachmentContent } from './data/attachments';
import type { MockDatabase } from './database';
import { assertCodeChecks } from './MockMasterDataRepository';
import { copy, findOrThrow } from './query';
import { removeRow, replaceRow, type WriteKit } from './writeKit';

const OWNER_LABELS: Record<AttachmentOwnerType, string> = {
  application: 'Uygulama',
  project: 'Proje',
  team: 'Ekip',
  technology: 'Teknoloji',
  risk: 'Risk',
  escalation: 'Eskalasyon',
  decision: 'Karar',
  demand: 'Talep',
  contract: 'Sözleşme',
};

function ownerRows(db: MockDatabase, type: AttachmentOwnerType): readonly { id: number }[] {
  switch (type) {
    case 'application':
      return db.applications;
    case 'project':
      return db.projects;
    case 'team':
      return db.teams;
    case 'technology':
      return db.technologies;
    case 'risk':
      return db.risks;
    case 'escalation':
      return db.escalations;
    case 'decision':
      return db.decisions;
    case 'demand':
      return db.demands;
    case 'contract':
      return db.contracts;
  }
}

export function createMockAttachmentRepository(
  db: MockDatabase,
  blobs: BlobStore,
  kit: WriteKit,
): AttachmentRepository {
  // Bytes of files whose record was deleted are cleaned up when the backend starts.
  void blobs.retain(new Set(db.attachments.map((a) => a.id)));

  const assertDocumentType = (code: string, previous: string[] = []) =>
    assertCodeChecks(
      db,
      [{ list: 'documentTypes', codes: [code], field: 'documentType' }],
      [{ list: 'documentTypes', codes: previous, field: 'documentType' }],
    );
  /**
   * Files on most records follow the portfolio permissions; a demand's requester may also manage
   * the files of their own open demand (business cases, screenshots…).
   */
  const authorize = async (owner: AttachmentOwner, action: 'write' | 'remove') => {
    if (owner.type !== 'demand') {
      return kit.begin(attachmentPrivilege(owner.type, action === 'write' ? 'edit' : 'delete'));
    }
    const user = await kit.beginAny(['demands:edit', 'demandManagement:edit']);
    const demand = db.demands.find((row) => row.id === owner.id);
    if (demand && !canAttachToDemand(user, demand)) throw new ForbiddenError();
    return user;
  };
  const assertDescription = (description: string) => {
    if (description.length > 300) {
      throw new ValidationError('Açıklama en fazla 300 karakter olabilir.', 'description');
    }
    if (looksLikeSecret(description)) throw new ValidationError(NO_SECRETS_MESSAGE, 'description');
  };

  return {
    async list(owner) {
      await kit.beginAny(attachmentViewPrivileges(owner.type));
      return copy(
        db.attachments
          .filter((a) => sameOwner(a.owner, owner))
          .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
      );
    },

    async countByOwner(type) {
      await kit.beginAny(attachmentViewPrivileges(type));
      const counts = new Map<number, number>();
      for (const a of db.attachments) {
        if (a.owner.type === type) counts.set(a.owner.id, (counts.get(a.owner.id) ?? 0) + 1);
      }
      return counts;
    },

    async upload({ owner, documentType, description, file, fileName }) {
      const user = await authorize(owner, 'write');
      if (!ownerRows(db, owner.type).some((row) => row.id === owner.id)) {
        throw new NotFoundError(OWNER_LABELS[owner.type], owner.id);
      }
      const name = sanitizeFileName(fileName);
      if (!name || !isAllowedFileName(name)) {
        throw new ValidationError(
          'Bu dosya türü yüklenemez. Belge, tablo, sunum, görsel veya zip yükleyin.',
          'file',
        );
      }
      if (file.size === 0) throw new ValidationError('Dosya boş.', 'file');
      if (file.size > MAX_ATTACHMENT_BYTES) {
        throw new ValidationError(`Dosya en fazla ${MAX_SIZE_LABEL} olabilir.`, 'file');
      }
      assertDocumentType(documentType);
      assertDescription(description.trim());

      const audit = kit.newAudit(user);
      const attachment: Attachment = {
        id: kit.nextId('attachments'),
        owner: { ...owner },
        documentType,
        fileName: name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        description: description.trim(),
        uploadedAt: audit.createdAt,
        uploadedBy: user.personId,
        audit,
      };
      await blobs.put(attachment.id, file);
      db.attachments.push(attachment);
      return copy(attachment);
    },

    async update(id, { documentType, description }) {
      const current = findOrThrow(db.attachments, id, 'Ek');
      const user = await authorize(current.owner, 'write');
      assertDocumentType(documentType, [current.documentType]);
      assertDescription(description.trim());
      return copy(
        replaceRow(db.attachments, {
          ...current,
          documentType,
          description: description.trim(),
          audit: kit.touch(current.audit, user),
        }),
      );
    },

    async remove(id) {
      await authorize(findOrThrow(db.attachments, id, 'Ek').owner, 'remove');
      removeRow(db.attachments, id);
      await blobs.delete(id);
    },

    async getDeletionImpact(id) {
      const attachment = findOrThrow(db.attachments, id, 'Ek');
      await kit.beginAny(attachmentViewPrivileges(attachment.owner.type));
      return NO_IMPACT;
    },

    async download(id) {
      const attachment = findOrThrow(db.attachments, id, 'Ek');
      await kit.beginAny(attachmentViewPrivileges(attachment.owner.type));
      const blob = await blobs.get(id);
      if (blob) return blob;
      if (id <= SEED_ATTACHMENT_COUNT) return seedAttachmentContent(attachment);
      throw new NotFoundError('Dosya içeriği', id);
    },
  };
}
