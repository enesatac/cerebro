package com.cerebro.api.attachments;

import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/** Bytes in {@code attachment_contents}; deleted with their metadata row (foreign key). */
@Component
class DatabaseContentStore implements AttachmentContentStore {

  private final JdbcClient jdbc;

  DatabaseContentStore(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public void put(long attachmentId, byte[] content) {
    jdbc.sql(
            "INSERT INTO attachment_contents (attachment_id, content) VALUES (:id, :content)"
                + " ON CONFLICT (attachment_id) DO UPDATE SET content = EXCLUDED.content")
        .param("id", attachmentId)
        .param("content", content)
        .update();
  }

  @Override
  public Optional<byte[]> get(long attachmentId) {
    return jdbc.sql("SELECT content FROM attachment_contents WHERE attachment_id = :id")
        .param("id", attachmentId)
        .query((rs, row) -> rs.getBytes("content"))
        .optional();
  }
}
