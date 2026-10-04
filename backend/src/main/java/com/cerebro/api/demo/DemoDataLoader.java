package com.cerebro.api.demo;

import com.cerebro.api.shared.Sql;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.sql.DatabaseMetaData;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.core.simple.JdbcClient.StatementSpec;
import org.springframework.jdbc.core.support.SqlBinaryValue;
import org.springframework.jdbc.support.JdbcUtils;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Local development and demos: fills an empty database with the fictional organisation the
 * frontend mock uses ({@code demo/demo-data.json}, generated from the frontend seed), so every
 * screen has something to show. Never touches a database that already has people or accounts.
 * Enabled by {@code cerebro.demo-data}; refused together with {@code prod}.
 *
 * <p>Rows are written with bound parameters (no SQL literals), so the same data loads into Oracle
 * and into H2; afterwards each identity continues after the highest id.
 */
@Component
@Order(0)
@ConditionalOnProperty(name = "cerebro.demo-data", havingValue = "true")
class DemoDataLoader implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(DemoDataLoader.class);

  private final JdbcClient jdbc;
  private final DataSource dataSource;

  DemoDataLoader(JdbcClient jdbc, DataSource dataSource) {
    this.jdbc = jdbc;
    this.dataSource = dataSource;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    boolean used =
        Sql.exists(jdbc, "SELECT 1 FROM people", Map.of())
            || Sql.exists(jdbc, "SELECT 1 FROM user_accounts", Map.of());
    if (used) {
      return;
    }
    JsonNode demo = read();
    Set<String> withIds = new LinkedHashSet<>();
    for (JsonNode table : demo.get("tables")) {
      String name = table.get("table").asString();
      for (JsonNode row : table.get("rows")) {
        insert(name, row);
      }
      if (table.get("rows").get(0).has("id")) {
        withIds.add(name);
      }
    }
    for (JsonNode head : demo.get("businessUnitHeads")) {
      jdbc.sql("UPDATE business_units SET head_person_id = :head WHERE id = :id")
          .param("head", head.get("headId").asLong())
          .param("id", head.get("id").asLong())
          .update();
    }
    JsonNode system = demo.get("systemRole");
    if (system != null && !system.isNull()) {
      StatementSpec update =
          jdbc.sql(
              "UPDATE roles SET name = :name, description = :description, "
                  + Sql.AUDIT_UPDATE
                  + ", created_at = :createdAt, created_by_person_id = :createdBy"
                  + " WHERE system_role = 1");
      update.param("name", system.get("name").asString());
      update.param("description", system.get("description").asString());
      for (String column :
          List.of(
              "created_at", "created_by_person_id", "updated_at", "updated_by_person_id",
              "last_reviewed_at", "last_reviewed_by_person_id")) {
        update.param(camel(column), value(system.get(column)));
      }
      update.update();
    }
    continueIdentities(withIds);
    log.warn("Loaded the demo data set (cerebro.demo-data=true)");
  }

  private void insert(String table, JsonNode row) {
    List<String> columns = new ArrayList<>();
    row.propertyNames().forEach(columns::add);
    StatementSpec statement =
        jdbc.sql(
            "INSERT INTO "
                + table
                + " ("
                + String.join(", ", columns)
                + ") VALUES ("
                + String.join(", ", columns.stream().map(c -> ":" + c).toList())
                + ")");
    for (String column : columns) {
      statement.param(column, value(row.get(column)));
    }
    statement.update();
  }

  /** JSON → JDBC value: dates, timestamps and file bytes are tagged objects in the data file. */
  private static Object value(JsonNode node) {
    if (node == null || node.isNull()) {
      return null;
    }
    if (node.isObject()) {
      if (node.has("$date")) {
        return LocalDate.parse(node.get("$date").asString());
      }
      if (node.has("$ts")) {
        return OffsetDateTime.parse(node.get("$ts").asString());
      }
      if (node.has("$base64")) {
        return new SqlBinaryValue(Base64.getDecoder().decode(node.get("$base64").asString()));
      }
      throw new IllegalArgumentException("Unknown value " + node);
    }
    if (node.isIntegralNumber()) {
      return node.asLong();
    }
    if (node.isNumber()) {
      return node.decimalValue();
    }
    return node.asString();
  }

  /** Rows were inserted with their ids: move each identity past the highest one. */
  private void continueIdentities(Set<String> tables) {
    boolean oracle = product().toLowerCase().contains("oracle");
    for (String table : tables) {
      if (oracle) {
        jdbc.sql(
                "ALTER TABLE "
                    + table
                    + " MODIFY (id GENERATED BY DEFAULT AS IDENTITY (START WITH LIMIT VALUE))")
            .update();
      } else {
        long next =
            jdbc.sql("SELECT COALESCE(MAX(id), 0) + 1 FROM " + table).query(Long.class).single();
        jdbc.sql("ALTER TABLE " + table + " ALTER COLUMN id RESTART WITH " + next).update();
      }
    }
  }

  private String product() {
    try {
      return JdbcUtils.extractDatabaseMetaData(
          dataSource, DatabaseMetaData::getDatabaseProductName);
    } catch (Exception e) {
      throw new IllegalStateException("Cannot read the database product", e);
    }
  }

  private static String camel(String column) {
    return switch (column) {
      case "created_at" -> "createdAt";
      case "created_by_person_id" -> "createdBy";
      case "updated_at" -> "updatedAt";
      case "updated_by_person_id" -> "updatedBy";
      case "last_reviewed_at" -> "lastReviewedAt";
      default -> "lastReviewedBy";
    };
  }

  private static JsonNode read() {
    try (InputStream in = new ClassPathResource("demo/demo-data.json").getInputStream()) {
      return JsonMapper.builder().build().readTree(in);
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }
}
