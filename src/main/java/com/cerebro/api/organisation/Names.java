package com.cerebro.api.organisation;

import com.cerebro.api.shared.EntityRef;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/** Id → display name resolution (what the frontend's lookup does) for read models. */
@Component
public class Names {

  private final JdbcClient jdbc;

  public Names(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  public Map<Long, String> people() {
    return map("SELECT id, full_name AS name FROM people");
  }

  public Map<Long, String> teams() {
    return map("SELECT id, name FROM teams");
  }

  public Map<Long, String> businessUnits() {
    return map("SELECT id, name FROM business_units");
  }

  public Map<Long, String> applications() {
    return map("SELECT id, name FROM applications");
  }

  public Map<Long, String> projects() {
    return map("SELECT id, name FROM projects");
  }

  /** {@code null} for a missing id or an unknown row. */
  public static EntityRef ref(Map<Long, String> names, Long id) {
    if (id == null) {
      return null;
    }
    String name = names.get(id);
    return name == null ? null : new EntityRef(id, name);
  }

  private Map<Long, String> map(String sql) {
    Map<Long, String> names = new java.util.HashMap<>();
    jdbc.sql(sql)
        .query(
            rs -> {
              names.put(rs.getLong("id"), rs.getString("name"));
            });
    return names;
  }
}
