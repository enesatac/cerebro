-- File bytes of attachments. Kept in the database so the API runs without extra infrastructure;
-- the `AttachmentContentStore` interface lets an object store (S3, Azure Blob…) replace it. Bytes
-- go with their metadata row.
CREATE TABLE attachment_contents (
  attachment_id BIGINT PRIMARY KEY REFERENCES attachments (id) ON DELETE CASCADE,
  content       BYTEA  NOT NULL
);

-- Deleting a project unlinks the demands it came from (`project_id` → NULL), converted ones
-- included, as the application has always done. The rule "a converted demand names its project"
-- is checked when the demand is assessed, not afterwards.
ALTER TABLE demands DROP CONSTRAINT demands_check4;
