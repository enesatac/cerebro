package com.cerebro.api.attachments;

import com.cerebro.api.shared.Audit;

/**
 * A file attached to a record. The bytes live in the content store under {@code id}; this is the
 * metadata. Files are documents and evidence — never credentials.
 */
public record Attachment(
    long id,
    Owner owner,
    String documentType,
    String fileName,
    String contentType,
    long sizeBytes,
    String description,
    String uploadedAt,
    Long uploadedBy,
    Audit audit) {

  public record Owner(String type, long id) {}

  public record Update(String documentType, String description) {}
}
