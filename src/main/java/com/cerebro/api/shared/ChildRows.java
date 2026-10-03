package com.cerebro.api.shared;

import java.util.List;
import java.util.function.Function;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.core.simple.JdbcClient.StatementSpec;

/**
 * Child rows edited as part of an aggregate (environments, milestones, payments…). Stored rows
 * keep their id, new rows ({@code id = null}) take the next value of the table's sequence, rows
 * left out are deleted. Ids the parent does not own are refused.
 */
public final class ChildRows {

  private ChildRows() {}

  /**
   * @param columns the insert column list without {@code id}, e.g. {@code "application_id, name"}
   * @param values the matching named parameters, e.g. {@code ":parent, :name"}
   */
  public static <T> void replace(
      JdbcClient jdbc,
      String table,
      String parentColumn,
      long parentId,
      List<T> rows,
      Function<T, Long> idOf,
      String columns,
      String values,
      Binder<T> bind) {
    List<Long> owned =
        jdbc.sql("SELECT id FROM " + table + " WHERE " + parentColumn + " = :parent")
            .param("parent", parentId)
            .query(Long.class)
            .list();
    Checks.assertOwned(rows.stream().map(idOf).toList(), owned);
    jdbc.sql("DELETE FROM " + table + " WHERE " + parentColumn + " = :parent")
        .param("parent", parentId)
        .update();
    String insert =
        "INSERT INTO "
            + table
            + " (id, "
            + columns
            + ") VALUES (COALESCE(CAST(:id AS BIGINT), nextval(pg_get_serial_sequence('"
            + table
            + "', 'id'))), "
            + values
            + ")";
    for (int index = 0; index < rows.size(); index++) {
      T row = rows.get(index);
      bind.bind(jdbc.sql(insert).param("id", idOf.apply(row)).param("parent", parentId), row, index)
          .update();
    }
  }

  /** Binds one row's values; {@code index} is its position (for order columns). */
  @FunctionalInterface
  public interface Binder<T> {
    StatementSpec bind(StatementSpec statement, T row, int index);
  }
}
