package com.cerebro.api.shared;

import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/** Server-side checks shared by every write: references, uniqueness and child row ownership. */
@Component
public class Checks {

  private final JdbcClient jdbc;

  public Checks(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  /** 404 unless {@code table} has a row {@code id}. {@code table} is a constant, never input. */
  public void requireExists(String table, long id, String label) {
    if (!exists(table, id)) {
      throw new NotFoundException(label, id);
    }
  }

  public boolean exists(String table, long id) {
    return jdbc.sql("SELECT EXISTS (SELECT 1 FROM " + table + " WHERE id = :id)")
        .param("id", id)
        .query(Boolean.class)
        .single();
  }

  /** Throws when any non-null id does not exist in {@code table}. */
  public void assertRefs(Collection<Long> ids, String table, String label, String field) {
    List<Long> wanted = ids.stream().filter(Objects::nonNull).toList();
    if (wanted.isEmpty()) {
      return;
    }
    Set<Long> known =
        new HashSet<>(
            jdbc.sql("SELECT id FROM " + table + " WHERE id = ANY(:ids)")
                .param("ids", Sql.longs(new HashSet<>(wanted)))
                .query(Long.class)
                .list());
    List<Long> unknown = wanted.stream().filter(id -> !known.contains(id)).toList();
    if (!unknown.isEmpty()) {
      throw new ValidationException(
          "Bilinmeyen "
              + label
              + ": "
              + unknown.stream().map(String::valueOf).collect(Collectors.joining(", "))
              + ".",
          field);
    }
  }

  /** Case-insensitive uniqueness of a text column (Turkish I/İ/ı/i compare equal). */
  public void assertUnique(
      String table, String column, String value, Long excludeId, String message, String field) {
    String needle = Texts.foldForCompare(value);
    boolean taken =
        jdbc.sql("SELECT id, " + column + " AS value FROM " + table)
            .query(
                (rs, row) ->
                    rs.getLong("id") != (excludeId == null ? -1 : excludeId)
                        && Texts.foldForCompare(rs.getString("value")).equals(needle))
            .list()
            .contains(true);
    if (taken) {
      throw new ValidationException(message, field);
    }
  }

  /**
   * Child rows of an aggregate: stored rows keep their id, new rows send {@code null}. Any other id
   * is refused so a request cannot take over another record's rows.
   */
  public static void assertOwned(Collection<Long> incoming, Collection<Long> owned) {
    Set<Long> mine = new HashSet<>(owned);
    for (Long id : incoming) {
      if (id != null && !mine.contains(id)) {
        throw new ValidationException("Geçersiz alt kayıt kimliği: " + id + ".");
      }
    }
  }
}
