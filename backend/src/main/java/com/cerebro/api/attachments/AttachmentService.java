package com.cerebro.api.attachments;

import com.cerebro.api.access.Access;
import com.cerebro.api.access.SessionUser;
import com.cerebro.api.demands.DemandAccess;
import com.cerebro.api.masterdata.MasterCodes;
import com.cerebro.api.shared.Audit;
import com.cerebro.api.shared.AuditStamp;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.Texts;
import com.cerebro.api.shared.Times;
import com.cerebro.api.shared.error.ForbiddenException;
import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Files on records. Reading follows the record's screen ({@code <module>:view}); uploading and
 * editing need {@code <module>:edit}, deleting {@code <module>:delete}. A demand's requester may
 * also manage the files of their own open demand.
 */
@Service
@Transactional
public class AttachmentService {

  /** Largest file accepted, per file (20 MB). */
  public static final long MAX_BYTES = 20L * 1024 * 1024;

  /**
   * Documents, spreadsheets, slides, images, diagrams and archives. Executables, scripts, HTML and
   * SVG (which can carry scripts) are refused.
   */
  static final List<String> ALLOWED_EXTENSIONS =
      List.of(
          "pdf", "doc", "docx", "odt", "rtf", "txt", "md", "xls", "xlsx", "ods", "csv", "ppt",
          "pptx", "odp", "png", "jpg", "jpeg", "gif", "webp", "vsdx", "drawio", "zip");

  private static final Pattern EXTENSION = Pattern.compile("\\.([^./\\\\]+)$");
  private static final Pattern UNSAFE = Pattern.compile("[\\u0000-\\u001f<>:\"|?*]");

  private static final String COLUMNS =
      Arrays.stream(OwnerType.values()).map(OwnerType::column).collect(Collectors.joining(", "));

  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final MasterCodes codes;
  private final AuditStamp stamp;
  private final AttachmentContentStore contents;

  public AttachmentService(
      JdbcClient jdbc,
      Access access,
      Checks checks,
      MasterCodes codes,
      AuditStamp stamp,
      AttachmentContentStore contents) {
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
    this.codes = codes;
    this.stamp = stamp;
    this.contents = contents;
  }

  /** The record's files, newest first. */
  @Transactional(readOnly = true)
  public List<Attachment> list(String ownerType, long ownerId) {
    OwnerType type = OwnerType.of(ownerType);
    access.requireAny(type.viewPrivileges());
    return load("WHERE " + type.column() + " = :owner", Map.of("owner", ownerId)).stream()
        .sorted((a, b) -> b.uploadedAt().compareTo(a.uploadedAt()))
        .toList();
  }

  /** Number of files per record of a type, for registers. */
  @Transactional(readOnly = true)
  public Map<Long, Integer> countByOwner(String ownerType) {
    OwnerType type = OwnerType.of(ownerType);
    access.requireAny(type.viewPrivileges());
    Map<Long, Integer> counts = new LinkedHashMap<>();
    jdbc.sql(
            "SELECT "
                + type.column()
                + " AS owner, count(*) AS files FROM attachments WHERE "
                + type.column()
                + " IS NOT NULL GROUP BY "
                + type.column()
                + " ORDER BY 1")
        .query(
            rs -> {
              counts.put(rs.getLong("owner"), rs.getInt("files"));
            });
    return counts;
  }

  public Attachment upload(
      String ownerType,
      long ownerId,
      String documentType,
      String description,
      String fileName,
      String contentType,
      byte[] content) {
    OwnerType type = OwnerType.of(ownerType);
    SessionUser user = authorize(type, ownerId, "edit");
    checks.requireExists(type.table, ownerId, type.label);
    String name = sanitize(fileName);
    if (name.isEmpty() || !ALLOWED_EXTENSIONS.contains(extensionOf(name))) {
      throw new ValidationException(
          "Bu dosya türü yüklenemez. Belge, tablo, sunum, görsel veya zip yükleyin.", "file");
    }
    if (content.length == 0) {
      throw new ValidationException("Dosya boş.", "file");
    }
    if (content.length > MAX_BYTES) {
      throw new ValidationException("Dosya en fazla 20 MB olabilir.", "file");
    }
    codes.assertCodes("documentTypes", List.of(documentType), "documentType", List.of());
    String text = description == null ? "" : description.trim();
    assertDescription(text);
    Audit audit = stamp.created(user);
    long id =
        Sql.insert(
        Sql.audit(
                jdbc.sql(
                    "INSERT INTO attachments ("
                        + type.column()
                        + ", document_type, file_name, content_type, size_bytes, description,"
                        + " uploaded_at, uploaded_by_person_id, "
                        + Sql.AUDIT_COLUMNS
                        + ") VALUES (:owner, :type, :name, :contentType, :size, :description,"
                        + " :uploadedAt, :uploadedBy, "
                        + Sql.AUDIT_VALUES
                        + ")"),
                audit)
            .param("owner", ownerId)
            .param("type", documentType)
            .param("name", name)
            .param(
                "contentType",
                contentType == null || contentType.isBlank()
                    ? "application/octet-stream"
                    : contentType)
            .param("size", (long) content.length)
            .param("description", text)
            .param("uploadedAt", Times.parseTimestamp(audit.createdAt()))
            .param("uploadedBy", user.personId()));
    contents.put(id, content);
    return find(id);
  }

  public Attachment update(long id, Attachment.Update input) {
    Attachment current = find(id);
    SessionUser user =
        authorize(OwnerType.of(current.owner().type()), current.owner().id(), "edit");
    codes.assertCodes(
        "documentTypes",
        List.of(input.documentType()),
        "documentType",
        List.of(current.documentType()));
    String text = input.description() == null ? "" : input.description().trim();
    assertDescription(text);
    Sql.audit(
            jdbc.sql(
                "UPDATE attachments SET document_type = :type, description = :description, "
                    + Sql.AUDIT_UPDATE
                    + " WHERE id = :id"),
            stamp.touched(current.audit(), user))
        .param("type", input.documentType())
        .param("description", text)
        .param("id", id)
        .update();
    return find(id);
  }

  public void remove(long id) {
    Attachment current = find(id);
    authorize(OwnerType.of(current.owner().type()), current.owner().id(), "delete");
    jdbc.sql("DELETE FROM attachments WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact deletionImpact(long id) {
    Attachment current = find(id);
    access.requireAny(OwnerType.of(current.owner().type()).viewPrivileges());
    return DeletionImpact.NONE;
  }

  /** The file with its bytes. */
  @Transactional(readOnly = true)
  public Download download(long id) {
    Attachment attachment = find(id);
    access.requireAny(OwnerType.of(attachment.owner().type()).viewPrivileges());
    byte[] bytes =
        contents.get(id).orElseThrow(() -> new NotFoundException("Dosya içeriği", id));
    return new Download(attachment, bytes);
  }

  public record Download(Attachment attachment, byte[] content) {}

  /**
   * Files on most records follow the record's screen privileges; a demand's requester may also
   * manage the files of their own open demand.
   */
  private SessionUser authorize(OwnerType type, long ownerId, String level) {
    if (type != OwnerType.DEMAND) {
      return access.require(type.module + ":" + level);
    }
    SessionUser user = access.requireAny("demands:edit", "demandManagement:edit");
    jdbc.sql(
            "SELECT requester_person_id, created_by_person_id, status FROM demands WHERE id ="
                + " :id")
        .param("id", ownerId)
        .query(
            (rs, row) ->
                DemandAccess.canAttach(
                    user,
                    rs.getLong("requester_person_id"),
                    Sql.longOrNull(rs, "created_by_person_id"),
                    rs.getString("status")))
        .optional()
        .ifPresent(
            allowed -> {
              if (!allowed) {
                throw new ForbiddenException();
              }
            });
    return user;
  }

  private static void assertDescription(String description) {
    if (description.length() > 300) {
      throw new ValidationException("Açıklama en fazla 300 karakter olabilir.", "description");
    }
    if (Texts.looksLikeSecret(description)) {
      throw new ValidationException(Texts.NO_SECRETS_MESSAGE, "description");
    }
  }

  /** Drops path segments and characters that are unsafe in file names; keeps Turkish letters. */
  static String sanitize(String fileName) {
    if (fileName == null) {
      return "";
    }
    String[] parts = fileName.split("[\\\\/]");
    String base = parts.length == 0 ? "" : parts[parts.length - 1];
    String clean = UNSAFE.matcher(base).replaceAll("").replaceAll("\\s+", " ").trim();
    return clean.length() > 200 ? clean.substring(0, 200) : clean;
  }

  static String extensionOf(String fileName) {
    Matcher matcher = EXTENSION.matcher(fileName.trim());
    return matcher.find() ? matcher.group(1).toLowerCase(Locale.ROOT) : "";
  }

  private Attachment find(long id) {
    return load("WHERE id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException("Ek", id));
  }

  private List<Attachment> load(String where, Map<String, Object> params) {
    return jdbc.sql(
            "SELECT id, "
                + COLUMNS
                + ", document_type, file_name, content_type, size_bytes, description,"
                + " uploaded_at, uploaded_by_person_id, "
                + Sql.AUDIT_COLUMNS
                + " FROM attachments "
                + where
                + " ORDER BY id")
        .params(params)
        .query(
            (rs, row) -> {
              Attachment.Owner owner = null;
              for (OwnerType type : OwnerType.values()) {
                Long ownerId = Sql.longOrNull(rs, type.column());
                if (ownerId != null) {
                  owner = new Attachment.Owner(type.code, ownerId);
                }
              }
              return new Attachment(
                  rs.getLong("id"),
                  owner,
                  rs.getString("document_type"),
                  rs.getString("file_name"),
                  rs.getString("content_type"),
                  rs.getLong("size_bytes"),
                  Sql.text(rs, "description"),
                  Sql.timestamp(rs, "uploaded_at"),
                  Sql.longOrNull(rs, "uploaded_by_person_id"),
                  Sql.audit(rs));
            })
        .list();
  }
}
