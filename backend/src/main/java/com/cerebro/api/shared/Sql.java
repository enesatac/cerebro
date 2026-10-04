package com.cerebro.api.shared;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.core.simple.JdbcClient.StatementSpec;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * JDBC helpers for the hand-written SQL of the services, written for Oracle (19c and later) and
 * run on H2 in Oracle mode in tests: identity keys read back from the driver, booleans as 0/1,
 * string lists as JSON, and Oracle's empty-string-is-NULL read back as {@code ""}.
 */
public final class Sql {

  /** Audit columns as stored on every audited table. */
  public static final String AUDIT_COLUMNS =
      "created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at,"
          + " last_reviewed_by_person_id";

  public static final String AUDIT_VALUES =
      ":createdAt, :createdBy, :updatedAt, :updatedBy, :lastReviewedAt, :lastReviewedBy";

  public static final String AUDIT_UPDATE =
      "updated_at = :updatedAt, updated_by_person_id = :updatedBy,"
          + " last_reviewed_at = :lastReviewedAt, last_reviewed_by_person_id = :lastReviewedBy";

  private static final JsonMapper JSON = JsonMapper.builder().build();

  private Sql() {}

  /** Runs an INSERT into a table with an identity {@code id} and returns the new key. */
  public static long insert(StatementSpec statement) {
    KeyHolder keys = new GeneratedKeyHolder();
    statement.update(keys, "ID");
    Map<String, Object> generated = keys.getKeys();
    Object id =
        generated != null && !generated.isEmpty()
            ? generated.values().iterator().next()
            : keys.getKey();
    if (!(id instanceof Number number)) {
      throw new IllegalStateException("No generated key returned");
    }
    return number.longValue();
  }

  /** True when {@code select} (a query returning any column) finds a row. */
  public static boolean exists(JdbcClient jdbc, String select, Map<String, ?> params) {
    return jdbc.sql(select + " FETCH FIRST 1 ROWS ONLY")
        .params(params)
        .query((rs, row) -> 1)
        .optional()
        .isPresent();
  }

  public static StatementSpec audit(StatementSpec statement, Audit audit) {
    return statement
        .param("createdAt", Times.parseTimestamp(audit.createdAt()))
        .param("createdBy", audit.createdBy())
        .param("updatedAt", Times.parseTimestamp(audit.updatedAt()))
        .param("updatedBy", audit.updatedBy())
        .param("lastReviewedAt", Times.parseTimestamp(audit.lastReviewedAt()))
        .param("lastReviewedBy", audit.lastReviewedBy());
  }

  public static Audit audit(ResultSet rs) throws SQLException {
    return new Audit(
        timestamp(rs, "created_at"),
        longOrNull(rs, "created_by_person_id"),
        timestamp(rs, "updated_at"),
        longOrNull(rs, "updated_by_person_id"),
        timestamp(rs, "last_reviewed_at"),
        longOrNull(rs, "last_reviewed_by_person_id"));
  }

  /** Booleans are stored as NUMBER(1) 0/1 (no BOOLEAN column type before Oracle 23ai). */
  public static int flag(boolean value) {
    return value ? 1 : 0;
  }

  /** A list of strings as a JSON array (tags, responsibilities, alternatives…). */
  public static String json(List<String> values) {
    return JSON.writeValueAsString(values == null ? List.of() : values);
  }

  public static List<String> jsonList(ResultSet rs, String column) throws SQLException {
    String value = rs.getString(column);
    if (value == null || value.isBlank()) {
      return List.of();
    }
    return JSON.readValue(value, new TypeReference<List<String>>() {});
  }

  /** A text column whose domain value is never null: Oracle stores {@code ""} as NULL. */
  public static String text(ResultSet rs, String column) throws SQLException {
    String value = rs.getString(column);
    return value == null ? "" : value;
  }

  public static Long longOrNull(ResultSet rs, String column) throws SQLException {
    long value = rs.getLong(column);
    return rs.wasNull() ? null : value;
  }

  public static Integer intOrNull(ResultSet rs, String column) throws SQLException {
    int value = rs.getInt(column);
    return rs.wasNull() ? null : value;
  }

  /** Amounts with their stored scale (2), as the API has always written them. */
  public static BigDecimal decimal(ResultSet rs, String column) throws SQLException {
    BigDecimal value = rs.getBigDecimal(column);
    return value == null ? null : value.setScale(Math.max(2, value.scale()));
  }

  public static String date(ResultSet rs, String column) throws SQLException {
    return Times.date(rs.getObject(column, LocalDate.class));
  }

  public static String timestamp(ResultSet rs, String column) throws SQLException {
    return Times.timestamp(rs.getObject(column, OffsetDateTime.class));
  }

  /** Groups child rows by their parent id, keeping the query's order. */
  public static <T> Map<Long, List<T>> group(List<Keyed<T>> rows) {
    Map<Long, List<T>> grouped = new HashMap<>();
    for (Keyed<T> row : rows) {
      grouped.computeIfAbsent(row.parentId(), key -> new ArrayList<>()).add(row.value());
    }
    return grouped;
  }

  /** A child row with the id of the record it belongs to. */
  public record Keyed<T>(long parentId, T value) {}
}
