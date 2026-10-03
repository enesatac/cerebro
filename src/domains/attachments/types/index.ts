import type { AuditMetadata, EntityId, IsoDateTime, PersonId } from '@/domains/shared/types';

export type AttachmentId = EntityId;

/** Records that can hold files. Each maps to its own nullable foreign key in the database. */
export const ATTACHMENT_OWNER_TYPES = [
  'application',
  'project',
  'team',
  'technology',
  'risk',
  'escalation',
  'decision',
  'demand',
  'contract',
] as const;
export type AttachmentOwnerType = (typeof ATTACHMENT_OWNER_TYPES)[number];

export interface AttachmentOwner {
  type: AttachmentOwnerType;
  id: EntityId;
}

/** Seed document types; administrators can add more in master data (`documentTypes`). */
export const DOCUMENT_TYPES = [
  'architecture',
  'security-assessment',
  'operations-guide',
  'user-guide',
  'charter',
  'requirements',
  'design',
  'test-report',
  'go-live-approval',
  'contract',
  'license',
  'meeting-notes',
  'incident-report',
  'business-case',
  'offer',
  'purchase-order',
  'invoice',
  'other',
] as const;
/** Code from the `documentTypes` master data list. */
export type DocumentType = string;

/**
 * Documents every record of a type is expected to carry. Shown as a checklist on the record; the
 * codes are system values of `documentTypes`, so their labels stay editable but they cannot be
 * deleted.
 */
export const REQUIRED_DOCUMENTS: Partial<Record<AttachmentOwnerType, readonly DocumentType[]>> = {
  application: ['architecture', 'security-assessment', 'operations-guide'],
  project: ['charter', 'requirements', 'test-report', 'go-live-approval'],
  contract: ['contract'],
};

/**
 * A file attached to a record (a row of `attachments`). The bytes live in object storage under
 * `id`; this is the metadata. Files are documents and evidence — never credentials.
 */
export interface Attachment {
  id: AttachmentId;
  owner: AttachmentOwner;
  documentType: DocumentType;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  description: string;
  uploadedAt: IsoDateTime;
  uploadedBy: PersonId | null;
  audit: AuditMetadata;
}

export interface AttachmentUpload {
  owner: AttachmentOwner;
  documentType: DocumentType;
  description: string;
  file: Blob;
  fileName: string;
}

export type AttachmentUpdate = Pick<Attachment, 'documentType' | 'description'>;

/** Largest file accepted, per file. */
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

/**
 * File types that can be attached: documents, spreadsheets, slides, images, diagrams and archives.
 * Executables, scripts, HTML and SVG (which can carry scripts) are refused.
 */
export const ALLOWED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'odt',
  'rtf',
  'txt',
  'md',
  'xls',
  'xlsx',
  'ods',
  'csv',
  'ppt',
  'pptx',
  'odp',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'vsdx',
  'drawio',
  'zip',
] as const;
