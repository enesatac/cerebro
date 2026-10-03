package com.cerebro.api.shared;

import java.math.BigDecimal;
import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient.StatementSpec;
import org.springframework.jdbc.support.SqlArrayValue;

/** JDBC helpers for the hand-written SQL of the stores. */
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

  private Sql() {}

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

  public static SqlArrayValue longs(Collection<Long> values) {
    return new SqlArrayValue("bigint", values.toArray());
  }

  public static SqlArrayValue texts(Collection<String> values) {
    return new SqlArrayValue("text", values.toArray());
  }

  public static Long longOrNull(ResultSet rs, String column) throws SQLException {
    long value = rs.getLong(column);
    return rs.wasNull() ? null : value;
  }

  public static Integer intOrNull(ResultSet rs, String column) throws SQLException {
    int value = rs.getInt(column);
    return rs.wasNull() ? null : value;
  }

  public static BigDecimal decimal(ResultSet rs, String column) throws SQLException {
    return rs.getBigDecimal(column);
  }

  public static String date(ResultSet rs, String column) throws SQLException {
    return Times.date(rs.getObject(column, LocalDate.class));
  }

  public static String timestamp(ResultSet rs, String column) throws SQLException {
    return Times.timestamp(rs.getObject(column, OffsetDateTime.class));
  }

  public static List<String> textArray(ResultSet rs, String column) throws SQLException {
    Array array = rs.getArray(column);
    if (array == null) {
      return List.of();
    }
    return Arrays.stream((Object[]) array.getArray()).map(String::valueOf).toList();
  }

  /** Groups child rows by their parent id, keeping the query's order. */
  public static <T> Map<Long, List<T>> group(List<Keyed<T>> rows) {
    Map<Long, List<T>> grouped = new java.util.HashMap<>();
    for (Keyed<T> row : rows) {
      grouped.computeIfAbsent(row.parentId(), key -> new java.util.ArrayList<>()).add(row.value());
    }
    return grouped;
  }

  /** A child row with the id of the record it belongs to. */
  public record Keyed<T>(long parentId, T value) {}
}
