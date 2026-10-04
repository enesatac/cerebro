package com.cerebro.api.attachments;

import java.util.Optional;

/**
 * Where the bytes of attachments are kept. The database implementation needs no extra
 * infrastructure; an object store (S3, Azure Blob…) can replace it behind this interface.
 */
public interface AttachmentContentStore {

  void put(long attachmentId, byte[] content);

  Optional<byte[]> get(long attachmentId);
}
